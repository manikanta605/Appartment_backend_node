const { User, Society, Member } = require('../models');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password, society_code, fcm_token } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({ where: { username: cleanUsername } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Load Society information
    let society = null;
    if (user.society_id) {
      society = await Society.findByPk(user.society_id);
      
      // If user provided a society code, verify it matches
      if (society_code && society && society.code.toUpperCase() !== society_code.toUpperCase().trim()) {
        return res.status(403).json({ message: `User does not belong to society ${society_code}` });
      }

      if (society && society.status === 'Suspended') {
        return res.status(403).json({ message: 'This society account has been suspended. Please contact platform support.' });
      }
    }

    // Update FCM token if provided
    if (fcm_token) {
      user.fcm_token = fcm_token;
      await user.save();
    }

    // Generate JWT containing user and society details
    const tokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      flat_no: user.flat_no,
      society_id: user.society_id,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '7d', // 7 days session
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role,
        flat_no: user.flat_no,
        society_id: user.society_id,
        fcm_token: user.fcm_token
      },
      society: society ? {
        id: society.id,
        name: society.name,
        code: society.code,
        city: society.city,
        maintenance_amount: Number(society.maintenance_amount),
        due_day: society.due_day,
        late_fine: Number(society.late_fine),
        upi_id: society.upi_id,
        logo_url: society.logo_url
      } : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
};

exports.updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.fcm_token = fcm_token;
    await user.save();
    res.json({ message: 'FCM token updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a new user (Society Admin creates guard or resident account)
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, flat_no, name, phone, email } = req.body;
    
    // Non-superadmins can only create users in their own society
    const targetSocietyId = req.user.role === 'superadmin' && req.body.society_id 
      ? req.body.society_id 
      : req.society_id;

    if (!targetSocietyId && role !== 'superadmin') {
      return res.status(400).json({ message: 'Society ID is required' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: `Username ${username} is already taken` });
    }

    const newUser = await User.create({
      society_id: targetSocietyId,
      username,
      password: password || 'password123',
      role: role || 'member',
      flat_no: flat_no || null,
      name: name || username,
      phone: phone || null,
      email: email || null,
      status: 'Active'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        flat_no: newUser.flat_no,
        society_id: newUser.society_id
      }
    });
  } catch (err) {
    res.status(400).json({ message: 'Error creating user', error: err.message });
  }
};
