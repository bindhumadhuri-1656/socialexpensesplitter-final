const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  percentage: { type: Number }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: { type: String, enum: ['EQUAL', 'EXACT', 'PERCENTAGE'], required: true },
  splits: [splitSchema],
  date: { type: Date, default: Date.now },
  notes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
