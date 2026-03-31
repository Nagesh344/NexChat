const express = require('express');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rooms
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rooms
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    const existing = await Room.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Room name already taken' });
    }

    const room = await Room.create({
      name: name.trim(),
      description,
      isPrivate: isPrivate || false,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await room.populate('createdBy', 'username');
    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rooms/:id/join
router.post('/:id/join', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
