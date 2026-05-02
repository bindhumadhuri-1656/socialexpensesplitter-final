const Settlement = require('../models/Settlement');

exports.createSettlement = async (req, res) => {
  try {
    const { groupId, paidBy, paidTo, amount, date } = req.body;

    const newSettlement = new Settlement({
      groupId,
      paidBy,
      paidTo,
      amount,
      date
    });

    const savedSettlement = await newSettlement.save();
    res.status(201).json(savedSettlement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .sort({ date: -1 });
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
