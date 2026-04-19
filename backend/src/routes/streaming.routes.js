import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
  getMasterPlaylist,
  getQualityPlaylist,
  getSegment,
  getVideoThumbnail,
  getScrubSprite,
  getStreamStatus,
  getAvailableQualities
} from '../controllers/streaming.controller.js';

const router = Router();

router.get('/:id/master.m3u8', optionalAuthenticate, getMasterPlaylist);

router.get('/:id/:quality.m3u8', optionalAuthenticate, getQualityPlaylist);

router.get('/:id/:quality/:segment', optionalAuthenticate, getSegment);

router.get('/:id/thumbnail', optionalAuthenticate, getVideoThumbnail);

router.get('/:id/scrub.jpg', optionalAuthenticate, getScrubSprite);

router.get('/:id/status', optionalAuthenticate, getStreamStatus);

router.get('/:id/qualities', optionalAuthenticate, getAvailableQualities);

export default router;
