const User = require('./models/User');

/**
 * Auto-seed default users on startup
 * Creates admin and demo employee accounts
 */
const autoSeedUsers = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@swamy.com' });
    if (adminExists) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create admin
    await User.create({
      name: 'Admin User',
      email: 'admin@swamy.com',
      password: 'admin@123',
      role: 'admin',
      isActive: true
    });
    console.log('✓ Admin user created (admin@swamy.com / admin@123)');

    // Create demo employee
    await User.create({
      name: 'Employee User',
      email: 'employee@swamy.com',
      password: 'employee@123',
      role: 'employee',
      isActive: true
    });
    console.log('✓ Employee user created (employee@swamy.com / employee@123)');
  } catch (error) {
    console.error('Error auto-seeding users:', error.message);
  }
};

module.exports = { autoSeedUsers };
