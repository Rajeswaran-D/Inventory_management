const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },  // Unique on name, not phone
  phone: { type: String, sparse: true },  // Sparse index allows multiple null values
  address: { type: String },
  email: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
