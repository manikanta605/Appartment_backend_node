const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize, testConnection } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const societyRoutes = require('./routes/societyRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const memberRoutes = require('./routes/memberRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const complaintRoutes = require('./routes/complaint');
const postRoutes = require('./routes/post');
const notificationRoutes = require('./routes/notification');
const eventRoutes = require('./routes/eventRoutes');
const amenityRoutes = require('./routes/amenityRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Allow base64 photos/media
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check & Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SaaS Apartment & Society Management Platform',
    version: '2.0.0',
    timestamp: new Date()
  });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/society', societyRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/razorpay', razorpayRoutes);

const { initMaintenanceCron } = require('./utils/cron');

// Database Sync & Server Start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await testConnection();

    // Initialize cron jobs for automated 1st-of-month dues generation
    initMaintenanceCron();
    console.log('Automated Multi-Tenant Maintenance Dues Scheduler initialized (Runs 1st of every month at 00:00)');

    // Sync models
    const isSqlite = (process.env.DB_DIALECT || '').toLowerCase() === 'sqlite';
    await sequelize.sync(isSqlite ? {} : { alter: true });
    console.log(`SaaS Multi-Tenant Database models synced successfully [${(process.env.DB_DIALECT || 'sqlite').toUpperCase()}]`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
