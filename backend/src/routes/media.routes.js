import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  uploadMedia,
  listMedia,
  listPublicMedia,
  getMediaInfo,
  getMediaById,
  deleteMedia,
  updateMedia,
  serveMedia,
} from '../controllers/media.controller.js';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadMedia);

router.get('/', authenticate, listMedia);

router.get('/public', listPublicMedia);

router.get('/:id/info', optionalAuthenticate, getMediaInfo);

router.get('/:id/serve', optionalAuthenticate, serveMedia);

router.get('/:id', authenticate, getMediaById);

router.delete('/:id', authenticate, deleteMedia);

router.put('/:id', authenticate, updateMedia);

export default router;
