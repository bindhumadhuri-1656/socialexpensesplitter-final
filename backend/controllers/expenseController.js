const Expense = require('../models/Expense');
const Group = require('../models/Group');

exports.addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, splitType, splits, date, notes } = req.body;
    let paidBy = req.body.paidBy || req.user;

    // Validate if the user is in the group (simple check)
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // In a real scenario, you'd validate the splits (e.g. percentages sum to 100, exact amounts sum to total amount)
    
    // Process splits based on type if not provided correctly (assuming frontend handles calculation for now)
    let processedSplits = splits;
    if (splitType === 'EQUAL' && (!splits || splits.length === 0)) {
      const membersCount = group.members.length;
      if (membersCount > 0) {
        const splitAmount = amount / membersCount;
        processedSplits = group.members.map(memberId => ({
          user: memberId,
          amount: splitAmount
        }));
      }
    }

    const newExpense = new Expense({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      splits: processedSplits,
      date,
      notes
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
