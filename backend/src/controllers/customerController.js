const prisma = require('../utils/prismaClient'); // Use Singleton!

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    
    // Convert Mongoose $or cleanly to Prisma OR
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } }
        ]
      };
    }
    
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    
    // Payload naturally contains `_id` strings mapping identically to UI
    res.status(200).json(customers);
  } catch (err) {
    next(err);
  }
};

exports.getOrCreateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    let customer = null;
    
    // Replaces findOne()
    if (phone && !phone.includes('-')) {
      customer = await prisma.customer.findFirst({
        where: { phone: phone }
      });
    }
    
    if (!customer) {
      // Replaces new Model() + .save()
      customer = await prisma.customer.create({
        data: { name, phone, address, email }
      });
    } else {
      // Update logic replaces .save()
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { 
          name: name || undefined, 
          address: address || undefined, 
          email: email || undefined 
        }
      });
    }
    
    res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    // Replaces findById(). Zero parseInt() needed because CUID strings.
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id }
    });
    
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
};
