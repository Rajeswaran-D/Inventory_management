const Customer = require('../models/Customer');

// GET all customers
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(query).sort({ name: 1 });
    res.status(200).json(customers);
  } catch (err) {
    next(err);
  }
};

// POST check if customer exists or create new
exports.getOrCreateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({ name, phone, address, email });
      await customer.save();
    } else {
      // Update details if provided
      if (name) customer.name = name;
      if (address) customer.address = address;
      if (email) customer.email = email;
      await customer.save();
    }
    res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
};

// GET a single customer
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
};
