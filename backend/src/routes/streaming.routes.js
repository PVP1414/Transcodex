import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMasterPlaylist,
  getQualityPlaylist,
  getSegment,
  getVideoThumbnail,
  getStreamStatus,
  getAvailableQualities
} from '../controllers/streaming.controller.js';

const router = Router();

router.get('/:id/master.m3u8', authenticate, getMasterPlaylist);

router.get('/:id/:quality.m3u8', authenticate, getQualityPlaylist);

router.get('/:id/:quality/:segment', authenticate, getSegment);

router.get('/:id/thumbnail', getVideoThumbnail);

router.get('/:id/status', authenticate, getStreamStatus);

router.get('/:id/qualities', authenticate, getAvailableQualities);

export default router;