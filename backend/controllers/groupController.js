const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const { calculateBalances, minimizeTransactions } = require('../utils/balanceCalculator');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    // Always include the creator in the group members
    const memberIds = members ? [...new Set([...members, req.user])] : [req.user];
    
    const newGroup = new Group({
      name,
      description,
      members: memberIds,
      createdBy: req.user
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user })
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Ensure the current user is a member of the group
    if (!group.members.some(member => member._id.toString() === req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // We can calculate balances here or let the client do it by fetching expenses
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGroupMembers = async (req, res) => {
  try {
    const { members } = req.body;
    // member shouldn't remove themselves easily but for simplicity we overwrite
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { members },
      { new: true }
    ).populate('members', 'name email');
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupBalances = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    if (!group.members.some(member => member._id.toString() === req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const expenses = await Expense.find({ groupId: req.params.id });
    const settlements = await Settlement.find({ groupId: req.params.id });
    
    const netBalances = calculateBalances(expenses, group.members, settlements);
    const suggestedSettlements = minimizeTransactions(netBalances);

    // Map userIds in settlements back to user objects for the frontend
    const mappedSettlements = suggestedSettlements.map(settlement => {
      const fromUser = group.members.find(m => m._id.toString() === settlement.from);
      const toUser = group.members.find(m => m._id.toString() === settlement.to);
      return {
        from: { id: fromUser._id, name: fromUser.name },
        to: { id: toUser._id, name: toUser.name },
        amount: settlement.amount
      };
    });

    res.json({ balances: netBalances, suggestedSettlements: mappedSettlements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
