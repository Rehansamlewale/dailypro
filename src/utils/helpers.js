import { format } from 'date-fns';

export const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

export const calculateClosingBalance = (cash, bank, accounts) => {
  const totalCash = Object.entries(cash || {}).reduce((acc, [denom, count]) => {
    return acc + (Number(denom) * Number(count || 0));
  }, 0);

  const totalBank = Object.values(bank || {}).reduce((acc, amount) => {
    return acc + Number(amount || 0);
  }, 0);

  const totalAccounts = Object.values(accounts || {}).reduce((acc, amount) => {
    return acc + Number(amount || 0);
  }, 0);

  return {
    totalCash,
    totalBank,
    totalAccounts,
    closingBalance: totalCash + totalBank + totalAccounts
  };
};
