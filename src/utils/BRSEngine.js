import { LedgerEngine } from './LedgerEngine.js';

export const BRSEngine = {
  /**
   * Run the Bank Reconciliation matching algorithm.
   * @param {Array} bankEntries - [{ id, date, description, ref, amount, type: 'Deposit'|'Withdrawal' }]
   * @param {String} asOfDate - 'YYYY-MM-DD'
   * @returns {Object} Reconciliation Result
   */
  reconcile(bankEntries, asOfDate) {
    // 1. Fetch book entries for the period
    const bookEntries = LedgerEngine.transactions.filter(t => 
      t.account === 'Cash and Bank' && new Date(t.date) <= new Date(asOfDate)
    );

    const matches = [];
    const unmatchedBank = [...bankEntries];
    let unmatchedBook = [...bookEntries];

    // Helper: Parse date to timestamp
    const toTs = (d) => new Date(d).getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const MAX_DAYS_DIFF = 5;

    // 2. Matching Logic
    // Loop through bank entries and try to find a matching book entry
    // Strategy: Exact Amount + Date Proximity (within 5 days) + Ref match if available
    for (let i = 0; i < unmatchedBank.length; i++) {
      const bankTx = unmatchedBank[i];
      if (!bankTx) continue;

      const expectedBookType = bankTx.type === 'Deposit' ? 'Debit' : 'Credit';

      // Find potential matches in books
      const potentialMatches = unmatchedBook.filter(bookTx => 
        bookTx &&
        bookTx.type === expectedBookType &&
        bookTx.amount === bankTx.amount &&
        Math.abs(toTs(bookTx.date) - toTs(bankTx.date)) <= (MAX_DAYS_DIFF * DAY_MS)
      );

      if (potentialMatches.length > 0) {
        // Sort matches: best match is exact ref, then closest date
        potentialMatches.sort((a, b) => {
          const aRefMatch = a.ref === bankTx.ref ? -1 : 1;
          const bRefMatch = b.ref === bankTx.ref ? -1 : 1;
          if (aRefMatch !== bRefMatch) return aRefMatch - bRefMatch;
          
          const aDateDiff = Math.abs(toTs(a.date) - toTs(bankTx.date));
          const bDateDiff = Math.abs(toTs(b.date) - toTs(bankTx.date));
          return aDateDiff - bDateDiff;
        });

        const bestMatch = potentialMatches[0];

        // Register match
        matches.push({
          bankEntryId: bankTx.id,
          bookEntryId: bestMatch.id,
          status: 'Auto-Matched'
        });

        // Remove from unmatched pools
        unmatchedBank[i] = null;
        const bookIdx = unmatchedBook.findIndex(b => b && b.id === bestMatch.id);
        if (bookIdx > -1) unmatchedBook[bookIdx] = null;
      }
    }

    const finalUnmatchedBank = unmatchedBank.filter(Boolean);
    const finalUnmatchedBook = unmatchedBook.filter(Boolean);

    // 3. Categorize Unmatched
    const outstandingCheques = finalUnmatchedBook.filter(b => b.type === 'Credit');
    const depositsInTransit = finalUnmatchedBook.filter(b => b.type === 'Debit');
    
    const bankOnlyItems = [];
    const unexplainedVariance = [];

    finalUnmatchedBank.forEach(b => {
      const desc = (b.description || '').toLowerCase();
      const ref = (b.ref || '').toLowerCase();
      // Heuristic to flag known bank items
      if (desc.includes('charge') || desc.includes('fee') || ref.includes('chg') || desc.includes('interest') || ref.includes('int')) {
        bankOnlyItems.push(b);
      } else {
        unexplainedVariance.push(b);
      }
    });

    return {
      matches,
      outstandingCheques,
      depositsInTransit,
      bankOnlyItems,
      unexplainedVariance,
      asOfDate
    };
  },

  /**
   * Compute Reconciled Balances based on the reconciliation result.
   */
  computeBalances(reconciliationResult, currentBankStatementBalance) {
    const bookBalance = LedgerEngine.getAccountBalance('Cash and Bank', reconciliationResult.asOfDate);
    
    // Outstanding cheques: Issued in books (reduced book bal), not in bank (so bank bal is higher).
    // To adjust bank balance down to match books: subtract outstanding cheques.
    const outstandingChequesTotal = reconciliationResult.outstandingCheques.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Deposits in transit: Deposited in books (increased book bal), not in bank (bank bal is lower).
    // To adjust bank balance up: add deposits in transit.
    const depositsInTransitTotal = reconciliationResult.depositsInTransit.reduce((sum, tx) => sum + tx.amount, 0);

    // Adjusted Bank Balance = Bank Statement Balance + Deposits in Transit - Outstanding Cheques
    const adjustedBankBalance = currentBankStatementBalance + depositsInTransitTotal - outstandingChequesTotal;

    // Bank-only items not yet booked (e.g. bank charges, interest)
    // Bank charges (Withdrawal): Not in books. Book balance is higher than it should be. Adjust book down.
    // Bank interest (Deposit): Not in books. Book balance is lower than it should be. Adjust book up.
    let unbookedDeposits = 0;
    let unbookedWithdrawals = 0;
    
    reconciliationResult.bankOnlyItems.forEach(tx => {
      if (tx.type === 'Deposit') unbookedDeposits += tx.amount;
      else if (tx.type === 'Withdrawal') unbookedWithdrawals += tx.amount;
    });
    
    reconciliationResult.unexplainedVariance.forEach(tx => {
      if (tx.type === 'Deposit') unbookedDeposits += tx.amount;
      else if (tx.type === 'Withdrawal') unbookedWithdrawals += tx.amount;
    });

    // Adjusted Book Balance = Book Balance + Unbooked Bank Deposits - Unbooked Bank Withdrawals
    const adjustedBookBalance = bookBalance + unbookedDeposits - unbookedWithdrawals;

    return {
      bookBalance,
      bankBalance: currentBankStatementBalance,
      adjustedBookBalance,
      adjustedBankBalance,
      difference: adjustedBookBalance - adjustedBankBalance,
      isReconciled: adjustedBookBalance === adjustedBankBalance
    };
  },

  /**
   * Post a Bank-only item (e.g., Bank Charges or Interest) to the ledger
   */
  postBankItem(bankEntry) {
    const desc = (bankEntry.description || '').toLowerCase();
    
    if (bankEntry.type === 'Withdrawal') {
      // Typically Bank Charges
      LedgerEngine.postTransaction(
        bankEntry.date,
        `Bank Entry: ${bankEntry.description}`,
        'Bank Charges',
        'Cash and Bank',
        bankEntry.amount,
        'Finance',
        bankEntry.ref || `BANK-W-${Date.now()}`
      );
    } else if (bankEntry.type === 'Deposit') {
      // Typically Interest Received or direct transfer
      const account = desc.includes('interest') ? 'Other Income' : 'Sales Revenue'; // Fallback
      LedgerEngine.postTransaction(
        bankEntry.date,
        `Bank Entry: ${bankEntry.description}`,
        'Cash and Bank',
        account,
        bankEntry.amount,
        'Receipts',
        bankEntry.ref || `BANK-D-${Date.now()}`
      );
    }
  }
};
