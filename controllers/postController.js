const { Post, Notification } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const where = req.society_id ? { society_id: req.society_id } : {};
    const posts = await Post.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { content, type } = req.body;
    const post = await Post.create({
      society_id: req.society_id,
      content,
      type: type || 'Community',
      author_name: req.user.name || req.user.username
    });

    // Notify society members
    await Notification.create({
      society_id: req.society_id,
      title: 'New Community Post',
      message: `${req.user.name || req.user.username} posted: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
      target_flat: null,
      type: 'Community',
      related_id: post.id
    });

    // Send FCM Push notification with sound to society members
    try {
      const { sendPushToSociety } = require('../utils/fcm');
      await sendPushToSociety(
        req.society_id,
        'New Community Post',
        `${req.user.name || req.user.username}: "${content.substring(0, 75)}${content.length > 75 ? '...' : ''}"`,
        'notice',
        { type: 'Community', postId: String(post.id) },
        req.user.id
      );
    } catch(e) {
      console.warn('FCM broadcast warning:', e.message);
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const post = await Post.findOne({ where });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && post.author_name !== req.user.username) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post', error: err.message });
  }
};
