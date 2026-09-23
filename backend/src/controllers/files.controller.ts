import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../types';
import { resolveFileOwnerOrgId } from '../utils/pdfOwnership';

const PDFS_ROOT = path.join(process.cwd(), 'public', 'pdfs');
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

function safeResolve(root: string, relativePath: string): string | null {
  const normalized = relativePath.replace(/^\/+/, '');
  const resolved = path.resolve(root, normalized);
  if (!resolved.startsWith(root)) return null; // path traversal attempt
  return resolved;
}

export class FilesController {
  async getPdf(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedPath = String(req.query.path || '');
      if (!requestedPath.startsWith('/pdfs/')) {
        res.status(400).json({ success: false, error: 'Invalid path' });
        return;
      }

      const ownerOrgId = await resolveFileOwnerOrgId(requestedPath);
      if (!ownerOrgId) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const isMasterAdmin = req.user?.role === 'master_admin';
      if (!isMasterAdmin && ownerOrgId !== req.organizationId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const relativeToRoot = requestedPath.replace(/^\/pdfs\//, '');
      const filePath = safeResolve(PDFS_ROOT, relativeToRoot);
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      res.type('application/pdf');
      res.sendFile(filePath);
    } catch (error: any) {
      next(error);
    }
  }

  async getUpload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedPath = String(req.query.path || '');
      if (!requestedPath.startsWith('/uploads/')) {
        res.status(400).json({ success: false, error: 'Invalid path' });
        return;
      }

      // Uploads today are profile photos only; any authenticated user may
      // view them (same trust level as before, minus fully-anonymous access).
      const relativeToRoot = requestedPath.replace(/^\/uploads\//, '');
      const filePath = safeResolve(UPLOADS_ROOT, relativeToRoot);
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (error: any) {
      next(error);
    }
  }
}

export const filesController = new FilesController();
