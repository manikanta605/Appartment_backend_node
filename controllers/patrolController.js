const { PatrolCheckpoint, PatrolLog, Notification } = require('../models');
const { Op } = require('sequelize');

const DEFAULT_CHECKPOINTS = [
  { code: 'CP-01', name: 'Main Gate & Security Post', location: 'Ground Floor, North Gate', order: 1 },
  { code: 'CP-02', name: 'Block A - Ground Floor Lobby', location: 'Block A Entrance & Lift', order: 2 },
  { code: 'CP-03', name: 'Block A - Terrace & Solar Area', location: 'Block A Top Floor / Roof', order: 3 },
  { code: 'CP-04', name: 'Basement Parking (Level -1)', location: 'Basement North-East Section', order: 4 },
  { code: 'CP-05', name: 'Generator & Transformer Yard', location: 'South Perimeter Utility Area', order: 5 },
  { code: 'CP-06', name: 'Clubhouse, Gym & Pool Area', location: 'Central Amenity Complex', order: 6 },
  { code: 'CP-07', name: 'Back Gate & Perimeter Wall', location: 'South-West Boundary', order: 7 }
];

// Helper to seed default checkpoints for a society if none exist
async function ensureCheckpoints(societyId) {
  const count = await PatrolCheckpoint.count({ where: { society_id: societyId } });
  if (count === 0) {
    const records = DEFAULT_CHECKPOINTS.map(cp => ({
      ...cp,
      society_id: societyId,
      qr_data: `RESIDEX:PATROL:${cp.code}:${cp.name.replace(/[^a-zA-Z0-9]/g, '_')}`
    }));
    await PatrolCheckpoint.bulkCreate(records);
  }
}

// ─── 1. Get All Checkpoints for Society ─────────────────────────────────────────
exports.getCheckpoints = async (req, res) => {
  try {
    const societyId = req.society_id;
    if (societyId) {
      await ensureCheckpoints(societyId);
    }

    const where = societyId ? { society_id: societyId, status: 'Active' } : {};
    const checkpoints = await PatrolCheckpoint.findAll({
      where,
      order: [['order', 'ASC']]
    });

    res.json(checkpoints);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching checkpoints', error: err.message });
  }
};

// ─── 2. Watchman Scans QR / Records Checkpoint Patrol ─────────────────────────
exports.recordScan = async (req, res) => {
  try {
    const societyId = req.society_id;
    const { qr_data, checkpoint_code, status, notes } = req.body;

    let checkpoint = null;

    if (qr_data) {
      checkpoint = await PatrolCheckpoint.findOne({
        where: { society_id: societyId, qr_data: qr_data.trim() }
      });
      // Fallback: match by code inside the qr string (e.g. RESIDEX:PATROL:CP-01:...)
      if (!checkpoint && qr_data.includes(':')) {
        const parts = qr_data.split(':');
        const code = parts[2] || parts[1];
        checkpoint = await PatrolCheckpoint.findOne({
          where: { society_id: societyId, code }
        });
      }
    }

    if (!checkpoint && checkpoint_code) {
      checkpoint = await PatrolCheckpoint.findOne({
        where: { society_id: societyId, code: checkpoint_code.trim() }
      });
    }

    if (!checkpoint) {
      return res.status(404).json({
        message: 'Invalid patrol QR code or checkpoint not found in this society'
      });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = now.toISOString().split('T')[0];

    const guardName = req.user?.name || req.user?.username || 'Security Guard';

    const log = await PatrolLog.create({
      society_id: societyId,
      checkpoint_code: checkpoint.code,
      checkpoint_name: checkpoint.name,
      guard_name: guardName,
      guard_id: req.user?.id || null,
      scanned_at: now,
      date: dateStr,
      time: timeStr,
      status: status || 'All Clear',
      notes: notes || 'Checkpoint verified during security patrol round'
    });

    // Optional alert if an issue is reported during rounds
    if (status && status !== 'All Clear') {
      await Notification.create({
        society_id: societyId,
        title: `Security Alert at ${checkpoint.name}`,
        message: `${guardName} reported: "${notes || status}" during security patrol.`,
        type: 'PatrolAlert',
        related_id: log.id,
        is_read: false
      });
    }

    res.status(201).json({
      message: `Checkpoint ${checkpoint.name} verified successfully`,
      log,
      checkpoint
    });
  } catch (err) {
    res.status(500).json({ message: 'Error recording patrol scan', error: err.message });
  }
};

// ─── 3. Get Patrol Logs (Public to all residents, watchman & admin) ────────────
exports.getLogs = async (req, res) => {
  try {
    const societyId = req.society_id;
    const { date, limit = 50 } = req.query;

    const where = {};
    if (societyId) where.society_id = societyId;
    if (date) where.date = date;

    const logs = await PatrolLog.findAll({
      where,
      order: [['id', 'DESC']],
      limit: parseInt(limit)
    });

    // Calculate Summary Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayScans = await PatrolLog.count({
      where: {
        ...(societyId && { society_id: societyId }),
        date: todayStr
      }
    });

    const totalCheckpoints = await PatrolCheckpoint.count({
      where: {
        ...(societyId && { society_id: societyId }),
        status: 'Active'
      }
    });

    const latestLog = logs[0] || null;

    res.json({
      logs,
      stats: {
        todayScans,
        totalCheckpoints,
        lastPatrolTime: latestLog ? `${latestLog.time} (${latestLog.date})` : 'No recent patrol',
        lastGuard: latestLog ? latestLog.guard_name : null,
        lastCheckpoint: latestLog ? latestLog.checkpoint_name : null,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patrol logs', error: err.message });
  }
};

// ─── 4. Admin Management: Add or Update Checkpoints ─────────────────────────
exports.createCheckpoint = async (req, res) => {
  try {
    const societyId = req.society_id;
    const { code, name, location, order } = req.body;

    if (!code || !name) {
      return res.status(400).json({ message: 'Code and name are required' });
    }

    const qr_data = `RESIDEX:PATROL:${code.toUpperCase().trim()}:${name.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const cp = await PatrolCheckpoint.create({
      society_id: societyId,
      code: code.toUpperCase().trim(),
      name,
      location: location || '',
      qr_data,
      order: order ? parseInt(order) : 10
    });

    res.status(201).json(cp);
  } catch (err) {
    res.status(500).json({ message: 'Error creating checkpoint', error: err.message });
  }
};

exports.deleteCheckpoint = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const cp = await PatrolCheckpoint.findOne({ where });
    if (!cp) return res.status(404).json({ message: 'Checkpoint not found' });

    await cp.destroy();
    res.json({ message: 'Checkpoint deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting checkpoint', error: err.message });
  }
};
