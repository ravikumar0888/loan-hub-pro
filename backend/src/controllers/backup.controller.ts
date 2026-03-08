import { Response } from 'express';
import { AuthRequest } from '../types';
import { BackupService } from '../services/backup.service';
import logger from '../utils/logger';

const backupService = new BackupService();

export class BackupController {
  async downloadBackup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { savePath } = req.body;

      if (!savePath || typeof savePath !== 'string' || savePath.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid save path (e.g., D:\\Backups)',
        });
        return;
      }

      const { filePath, fileName } = await backupService.generateBackup(savePath.trim());

      res.json({
        success: true,
        message: `Backup saved successfully`,
        data: { filePath, fileName },
      });
    } catch (error: any) {
      logger.error('Backup failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate backup',
      });
    }
  }
}
