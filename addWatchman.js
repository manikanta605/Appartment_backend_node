const { User, sequelize } = require('./models');

async function addWatchman() {
  try {
    // Sync to ensure model changes (like ENUM watchman) are applied
    await sequelize.sync({ alter: true });
    
    const count = await User.count({ where: { username: 'watchman' } });
    if (count === 0) {
      await User.create({
        username: 'watchman',
        password: 'gatekeeper123',
        role: 'watchman',
        flat_no: null
      });
      console.log('Watchman user created successfully!');
      console.log('Username: watchman');
      console.log('Password: gatekeeper123');
    } else {
      console.log('Watchman user already exists.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to create watchman:', err);
    process.exit(1);
  }
}

addWatchman();
