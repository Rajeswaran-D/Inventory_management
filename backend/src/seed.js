const prisma = require('./utils/prismaClient');
const bcrypt = require('bcryptjs');

/**
 * 👤 SEED SAMPLE USERS
 * Creates administrative and employee accounts if they don't exist.
 */
async function seedUsers() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // 1. Admin User
    const adminEmail = 'admin@swamy.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrator',
          email: adminEmail,
          password: hashedAdminPassword,
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Admin user created (admin@swamy.com / admin123)');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Employee User
    const employeeEmail = 'employee@swamy.com';
    const existingEmployee = await prisma.user.findUnique({
      where: { email: employeeEmail }
    });

    if (!existingEmployee) {
      const hashedEmployeePassword = await bcrypt.hash('employee123', 10);
      await prisma.user.create({
        data: {
          name: 'Staff Member',
          email: employeeEmail,
          password: hashedEmployeePassword,
          role: 'employee',
          isActive: true
        }
      });
      console.log('✅ Employee user created (employee@swamy.com / employee123)');
    } else {
      console.log('ℹ️ Employee user already exists');
    }

    // 3. Counter Initialization (For Bill Numbers)
    const existingCounter = await prisma.counter.findUnique({
        where: { id: 'sale' }
    });
    if (!existingCounter) {
        await prisma.counter.create({
            data: { id: 'sale', seq: 0 }
        });
        console.log('✅ Sales counter initialized');
    }

    console.log('🏁 User and Counter seeding completed');
  } catch (error) {
    console.error('❌ User seeding failed:', error);
    throw error;
  }
}

/**
 * 📦 SEED PRODUCT MASTERS
 * Creates the initial set of product types based on business categories.
 */
async function seedProductMasters() {
  console.log('🌱 Seeding Product Masters...');
  const { PRODUCT_RULES } = require('./utils/productUtils');

  try {
    const materialTypes = Object.keys(PRODUCT_RULES);

    for (const type of materialTypes) {
      const existing = await prisma.productMaster.findUnique({
        where: { name: type }
      });

      if (!existing) {
        const rule = PRODUCT_RULES[type];
        await prisma.productMaster.create({
          data: {
            name: type,
            materialType: type,
            hasGSM: rule.hasGSM,
            hasSize: rule.hasSize,
            hasColor: rule.hasColor
          }
        });
        console.log(`✅ Product Master created: ${type}`);
      }
    }
    console.log('🏁 Product Master seeding completed');
  } catch (err) {
    console.error('❌ Product Master seeding failed:', err);
  }
}

module.exports = { seedUsers, seedProductMasters };
