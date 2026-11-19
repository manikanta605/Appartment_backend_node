const cron = require('node-cron');
const { generateMonthlyDues } = require('./duesEngine');

/**
 * Automates maintenance due generation on the 1st of every month at 00:00.
 * Computes: Current Month Maintenance + Previous Unpaid Dues = Total Payable
 */
const initMaintenanceCron = () => {
  // schedule for: 0 0 1 * * (Minute 0, Hour 0, Day 1 of every month)
  cron.schedule('0 0 1 * *', async () => {
    console.log('--- STARTING AUTOMATIC SAAS MAINTENANCE GENERATION ---');
    try {
      const summary = await generateMonthlyDues();
      console.log(`--- COMPLETED SAAS MAINTENANCE GENERATION: ${summary.totalRecordsCreated} bills generated across ${summary.societiesProcessed} societies for ${summary.period} ---`);
    } catch (err) {
      console.error('CRON ERROR: Failed to generate monthly dues:', err);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};

module.exports = { initMaintenanceCron };
