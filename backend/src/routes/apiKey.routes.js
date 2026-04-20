import { Router } from 'express';
import ApiKey, { generateApiKey } from '../models/ApiKey.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const MAX_KEYS_PER_USER = 10;

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-key');

    const maskedKeys = keys.map(key => ({
      _id: key._id,
      name: key.name,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
      masked: '****',
      createdAt: key.createdAt,
    }));

    res.json({ success: true, data: maskedKeys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, permissions, expiresInHours } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const keyCount = await ApiKey.countDocuments({ user: req.user.id });
    if (keyCount >= MAX_KEYS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_KEYS_PER_USER} API keys allowed`,
      });
    }

    let expiresAt = null;
    if (expiresInHours && expiresInHours > 0) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const apiKey = await ApiKey.create({
      user: req.user.id,
      key: generateApiKey(),
      name: name.trim().slice(0, 50),
      permissions: permissions || 'read',
      expiresAt,
    });

    const maskValue = apiKey.key 
      ? `${apiKey.key.slice(0, 4)}...${apiKey.key.slice(-4)}`
      : '****';

    res.status(201).json({
      success: true,
      data: {
        _id: apiKey._id,
        key: apiKey.key,
        name: apiKey.name,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        masked: maskValue,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    await ApiKey.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/reveal', async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    res.json({
      success: true,
      data: {
        key: apiKey.key,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;