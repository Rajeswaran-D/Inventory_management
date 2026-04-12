const prisma = require('./utils/prismaClient');

async function validateModels() {
    console.log('🔍 Validating Database Models...');
    const models = ['user', 'customer', 'sale', 'productMaster', 'inventory'];
    
    for (const model of models) {
        try {
            const count = await prisma[model].count();
            console.log(`✅ Model [${model}] is accessible (Count: ${count})`);
        } catch (err) {
            console.error(`❌ Model [${model}] FAILED:`, err.message);
        }
    }
    
    console.log('\n📝 Performing Basic CRUD Test (User)...');
    try {
        // Create
        const testUser = await prisma.user.create({
            data: {
                name: 'Test Validator',
                email: `test_${Date.now()}@example.com`,
                password: 'password123',
                role: 'employee'
            }
        });
        console.log('✅ CREATE: Success');
        
        // Update
        await prisma.user.update({
            where: { id: testUser.id },
            data: { name: 'Test Validator (Updated)' }
        });
        console.log('✅ UPDATE: Success');
        
        // Delete
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('✅ DELETE: Success');
        
        console.log('\n🌟 ALL VALIDATIONS PASSED');
    } catch (err) {
        console.error('❌ CRUD Test FAILED:', err.message);
    }
}

validateModels()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
