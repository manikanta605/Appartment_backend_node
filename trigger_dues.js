const { User, Payment } = require('./models');
const { sequelize } = require('./config/database');

async function triggerDues() {
  console.log('--- MANUALLY TRIGGERING DUES FOR ALL MEMBERS ---');
  try {
    await sequelize.authenticate();
    
    const users = await User.findAll({ where: { role: 'member' } });
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const period = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    let count = 0;
    for (const user of users) {
      // Idempotency: Check if already exists
      const exists = await Payment.findOne({ where: { flat_no: user.flat_no, period: period } });
      
      if (!exists) {
        await Payment.create({
          date: now,
          flat_no: user.flat_no,
          resident_name: user.username,
          period: period,
          amount: 2500,
          status: 'Pending',
          mode: null
        });
        console.log(`✅ Generated due for ${user.username} (Flat ${user.flat_no})`);
        count++;
      } else {
        console.log(`ℹ️ Due already exists for ${user.username} (Flat ${user.flat_no})`);
      }
    }
    console.log(`\n\nDONE! Created ${count} new pending records.`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

triggerDues();
