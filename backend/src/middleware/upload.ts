import multer from 'multer';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { fromFile as fileTypeFromFile } from 'file-type';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
    return;
  }
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('profilePhoto');

/**
 * Wraps multer's upload with a post-write magic-byte check, since multer's
 * fileFilter only sees the client-supplied (spoofable) Content-Type header.
 * Rejects the upload (and deletes the file) if the real file content isn't
 * one of the allowed raster image formats - this is what actually stops an
 * SVG-with-script or other disguised file from being stored.
 */
export const uploadProfilePhoto: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  multerUpload(req, res, async (err: any) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      next();
      return;
    }

    try {
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
        fs.unlinkSync(file.path);
        res.status(400).json({ success: false, error: 'File content does not match an allowed image type' });
        return;
      }
      next();
    } catch (error) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      next(error);
    }
  });
};
