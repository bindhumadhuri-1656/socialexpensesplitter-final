const calculateBalances = (expenses, groupMembers, settlements = []) => {
  const balances = {};

  // Initialize balances for all group members to 0
  groupMembers.forEach(member => {
    balances[member._id.toString()] = 0;
  });

  // Calculate net balances based on expenses
  expenses.forEach(expense => {
    const paidById = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
    const amount = expense.amount;

    // The person who paid gets a positive balance equivalent to the total amount initially
    balances[paidById] = (balances[paidById] || 0) + amount;

    if (expense.splitType === 'EQUAL') {
      const splitAmount = amount / groupMembers.length;
      groupMembers.forEach(member => {
        const memberId = member._id.toString();
        // Everyone owes an equal portion, subtracting from their balance
        balances[memberId] = (balances[memberId] || 0) - splitAmount;
      });
    } else if (expense.splitType === 'EXACT' || expense.splitType === 'PERCENTAGE') {
      expense.splits.forEach(split => {
        const userId = split.user._id ? split.user._id.toString() : split.user.toString();
        balances[userId] = (balances[userId] || 0) - split.amount;
      });
    }
  });

  // Apply settlements
  settlements.forEach(settlement => {
    const fromId = settlement.paidBy._id ? settlement.paidBy._id.toString() : settlement.paidBy.toString();
    const toId = settlement.paidTo._id ? settlement.paidTo._id.toString() : settlement.paidTo.toString();

    // fromId paid toId
    balances[fromId] = (balances[fromId] || 0) + settlement.amount;
    balances[toId] = (balances[toId] || 0) - settlement.amount;
  });

  return balances;
};

const minimizeTransactions = (balances) => {
  const debtors = [];
  const creditors = [];

  // Separate people into those who owe money and those who are owed money
  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      debtors.push({ userId, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    }
  }

  // Sort descending by amount to minimize transactions greedy style
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0; // debtors index
  let j = 0; // creditors index
  const settlements = [];

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const minimalAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: minimalAmount
    });

    debtor.amount -= minimalAmount;
    creditor.amount -= minimalAmount;

    if (Math.abs(debtor.amount) < 0.01) i++;
    if (Math.abs(creditor.amount) < 0.01) j++;
  }

  return settlements;
};

module.exports = { calculateBalances, minimizeTransactions };
