import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

export class BackupService {
  /**
   * Parse DATABASE_URL to extract connection params
   */
  private parseDatabaseUrl(): { host: string; port: string; user: string; password: string; database: string } {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(dbUrl);
    return {
      host: url.hostname,
      port: url.port || '5432',
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.replace('/', ''),
    };
  }

  /**
   * Find pg_dump executable path
   * Checks: env variable PG_BIN_PATH, common Windows paths, then falls back to bare command
   */
  private findPgDump(): string {
    // 1. Check env variable
    if (process.env.PG_BIN_PATH) {
      const pgDump = path.join(process.env.PG_BIN_PATH, 'pg_dump');
      if (fs.existsSync(pgDump) || fs.existsSync(pgDump + '.exe')) {
        return `"${pgDump}"`;
      }
    }

    // 2. Auto-detect on Windows - check common PostgreSQL install paths
    if (process.platform === 'win32') {
      const programFiles = [
        process.env['ProgramFiles'] || 'C:\\Program Files',
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
      ];

      for (const pf of programFiles) {
        const pgDir = path.join(pf, 'PostgreSQL');
        if (fs.existsSync(pgDir)) {
          try {
            const versions = fs.readdirSync(pgDir).sort((a, b) => Number(b) - Number(a));
            for (const ver of versions) {
              const pgDump = path.join(pgDir, ver, 'bin', 'pg_dump.exe');
              if (fs.existsSync(pgDump)) {
                logger.info(`Found pg_dump at: ${pgDump}`);
                return `"${pgDump}"`;
              }
            }
          } catch (e) {
            // continue searching
          }
        }
      }
    }

    // 3. Fallback to bare command (works if pg_dump is in PATH)
    return 'pg_dump';
  }

  /**
   * Generate a database backup using pg_dump
   * Saves directly to the user-specified path
   */
  async generateBackup(savePath: string): Promise<{ filePath: string; fileName: string }> {
    const { host, port, user, password, database } = this.parseDatabaseUrl();

    // Validate and prepare save directory
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    const stat = fs.statSync(savePath);
    if (!stat.isDirectory()) {
      throw new Error('The specified path is not a valid directory');
    }

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup_${database}_${timestamp}.sql`;
    const filePath = path.join(savePath, fileName);

    // Find pg_dump executable
    const pgDump = this.findPgDump();

    // Build pg_dump command
    const command = `${pgDump} -h ${host} -p ${port} -U ${user} -d ${database} -F p -f "${filePath}"`;

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: password };

      exec(command, { env, timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          logger.error('Backup failed:', error.message);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(new Error(`Backup failed: ${error.message}`));
          return;
        }

        if (!fs.existsSync(filePath)) {
          reject(new Error('Backup file was not created'));
          return;
        }

        const fileSize = fs.statSync(filePath).size;
        const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        logger.info(`Database backup created: ${filePath} (${sizeMB} MB)`);
        resolve({ filePath, fileName });
      });
    });
  }
}
