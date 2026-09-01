import { LedgerEngine } from './LedgerEngine.js';
import { InventoryEngine } from './InventoryEngine.js';
import { InvoiceEngine } from './InvoiceEngine.js';

/**
 * CFA-Grounded Financial Forecasting & Analysis Engine for Meso
 * Strictly computes ratios, trends, and projections from platform's actual ledger figures.
 */
export const FinancialAnalysisEngine = {
  /**
   * Compute comprehensive CFA-Level financial metrics
   */
  computeMetrics() {
    const kpis = LedgerEngine.calcKPIs('Full Year');
    const bs = LedgerEngine.calcBalanceSheet('Full Year');
    const is = LedgerEngine.calcIncomeStatement('Full Year');

    // Balance Sheet Line Items
    const cash = LedgerEngine.getAccountBalance('Cash and Bank');
    const ar = LedgerEngine.getAccountBalance('Accounts Receivable');
    const inventory = LedgerEngine.getAccountBalance('Inventory');
    const inputCGST = LedgerEngine.getAccountBalance('Input CGST');
    const inputSGST = LedgerEngine.getAccountBalance('Input SGST');
    const inputIGST = LedgerEngine.getAccountBalance('Input IGST');
    const otherCurrentAssets = inputCGST + inputSGST + inputIGST;

    const currentAssets = cash + ar + inventory + otherCurrentAssets;
    const quickAssets = cash + ar; // Conservative quick assets (cash + trade receivables)

    const ap = LedgerEngine.getAccountBalance('Accounts Payable');
    const taxPayable = LedgerEngine.getAccountBalance('Tax Payable');
    const stProv = LedgerEngine.getAccountBalance('Short-Term Provisions');
    const outCGST = LedgerEngine.getAccountBalance('Output CGST');
    const outSGST = LedgerEngine.getAccountBalance('Output SGST');
    const outIGST = LedgerEngine.getAccountBalance('Output IGST');
    const currentLiabilities = ap + taxPayable + stProv + outCGST + outSGST + outIGST;

    const bankLoan = LedgerEngine.getAccountBalance('Bank Loan');
    const totalDebt = bankLoan;

    const shareCapital = LedgerEngine.getAccountBalance('Share Capital');
    const retainedEarnings = LedgerEngine.getAccountBalance('Retained Earnings');
    const netProfit = kpis.netProfit || 0;
    const totalEquity = shareCapital + retainedEarnings + netProfit;

    const faGross = LedgerEngine.getAccountBalance('Fixed Assets (Gross)');
    const accDep = LedgerEngine.getAccountBalance('Accumulated Depreciation');
    const netFixedAssets = faGross - accDep;

    const totalAssetsRow = bs.find(r => r.name.toLowerCase().includes('total assets'));
    const totalAssets = totalAssetsRow ? totalAssetsRow.value : (currentAssets + netFixedAssets);

    // Income Statement Line Items
    const revenue = kpis.totalRevenue || 0;
    const cogs = LedgerEngine.getAccountBalance('Cost of Goods Sold');
    const grossProfit = revenue - cogs;
    const financeCost = LedgerEngine.getAccountBalance('Finance Cost');
    const taxExpense = LedgerEngine.getAccountBalance('Tax Expense');
    const salaries = LedgerEngine.getAccountBalance('Salary Expense');
    const rent = LedgerEngine.getAccountBalance('Rent Expense');
    const dep = LedgerEngine.getAccountBalance('Depreciation Expense');
    const otherExp = LedgerEngine.getAccountBalance('Other Expenses');
    const bankChg = LedgerEngine.getAccountBalance('Bank Charges');

    const totalExpenses = kpis.totalExpenses || 0;
    const ebit = revenue - (cogs + salaries + rent + otherExp + bankChg + dep);

    // 1. LIQUIDITY RATIOS
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0;
    const quickRatio = currentLiabilities > 0 ? (quickAssets / currentLiabilities) : 0;
    const cashRatio = currentLiabilities > 0 ? (cash / currentLiabilities) : 0;
    const netWorkingCapital = currentAssets - currentLiabilities;

    // 2. ACTIVITY & EFFICIENCY RATIOS
    const dso = revenue > 0 ? Math.round((ar / (revenue / 365))) : 0;
    const dpo = cogs > 0 ? Math.round((ap / (cogs / 365))) : 0;
    const dio = cogs > 0 ? Math.round((inventory / (cogs / 365))) : 0;
    const ccc = dio + dso - dpo; // Cash Conversion Cycle
    const inventoryTurnover = inventory > 0 ? (cogs / inventory) : 0;
    const assetTurnover = totalAssets > 0 ? (revenue / totalAssets) : 0;
    const fixedAssetTurnover = netFixedAssets > 0 ? (revenue / netFixedAssets) : 0;

    // 3. SOLVENCY & LEVERAGE RATIOS
    const debtToEquity = totalEquity > 0 ? (totalDebt / totalEquity) : 0;
    const debtToAssets = totalAssets > 0 ? (totalDebt / totalAssets) : 0;
    const equityMultiplier = totalEquity > 0 ? (totalAssets / totalEquity) : 1;
    const interestCoverage = financeCost > 0 ? (ebit / financeCost) : 0;

    // 4. PROFITABILITY & DUPONT DECOMPOSITION
    const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100) : 0;
    const operatingMargin = revenue > 0 ? ((ebit / revenue) * 100) : 0;
    const netMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;
    const roa = totalAssets > 0 ? ((netProfit / totalAssets) * 100) : 0;
    const roe = totalEquity > 0 ? ((netProfit / totalEquity) * 100) : 0;

    // DuPont 3-Step: ROE = Net Margin * Asset Turnover * Equity Multiplier
    const dupontNetMargin = revenue > 0 ? (netProfit / revenue) : 0;
    const dupontAssetTurnover = totalAssets > 0 ? (revenue / totalAssets) : 0;
    const dupontLeverage = equityMultiplier;
    const dupontCalculatedROE = (dupontNetMargin * dupontAssetTurnover * dupontLeverage) * 100;

    // 5. MONTHLY TIME SERIES (12 Months of FY 2025-26)
    const monthlyData = this.getMonthlyTimeSeries();

    // 6. FORECASTING (Next Month & Next Quarter Projections)
    const forecast = this.generateForecast(monthlyData, cash, revenue, totalExpenses);

    return {
      financials: {
        revenue,
        cogs,
        grossProfit,
        ebit,
        financeCost,
        taxExpense,
        totalExpenses,
        netProfit,
        cash,
        ar,
        inventory,
        currentAssets,
        quickAssets,
        ap,
        currentLiabilities,
        totalDebt,
        totalEquity,
        netFixedAssets,
        totalAssets,
        netWorkingCapital
      },
      ratios: {
        liquidity: {
          currentRatio: Number(currentRatio.toFixed(2)),
          quickRatio: Number(quickRatio.toFixed(2)),
          cashRatio: Number(cashRatio.toFixed(2)),
          netWorkingCapital
        },
        efficiency: {
          dso,
          dpo,
          dio,
          ccc,
          inventoryTurnover: Number(inventoryTurnover.toFixed(2)),
          assetTurnover: Number(assetTurnover.toFixed(2)),
          fixedAssetTurnover: Number(fixedAssetTurnover.toFixed(2))
        },
        solvency: {
          debtToEquity: Number(debtToEquity.toFixed(2)),
          debtToAssets: Number(debtToAssets.toFixed(2)),
          equityMultiplier: Number(equityMultiplier.toFixed(2)),
          interestCoverage: Number(interestCoverage.toFixed(2))
        },
        profitability: {
          grossMargin: Number(grossMargin.toFixed(1)),
          operatingMargin: Number(operatingMargin.toFixed(1)),
          netMargin: Number(netMargin.toFixed(1)),
          roa: Number(roa.toFixed(1)),
          roe: Number(roe.toFixed(1))
        },
        dupont: {
          netProfitMarginPct: Number((dupontNetMargin * 100).toFixed(2)),
          assetTurnover: Number(dupontAssetTurnover.toFixed(2)),
          equityMultiplier: Number(dupontLeverage.toFixed(2)),
          roeResult: Number(dupontCalculatedROE.toFixed(2))
        }
      },
      monthlyData,
      forecast
    };
  },

  /**
   * Extract month-by-month financial series from actual transactions
   */
  getMonthlyTimeSeries() {
    const txs = LedgerEngine.transactions || [];
    
    // Extract all unique year-months from ledger transactions in chronological order
    const monthKeysSet = new Set();
    for (let year = 2024; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        monthKeysSet.add(`${year}-${month.toString().padStart(2, '0')}`);
      }
    }
    const monthKeys = Array.from(monthKeysSet).sort();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return monthKeys.map(key => {
      const [y, mStr] = key.split('-');
      const mName = `${monthNames[parseInt(mStr, 10) - 1]} ${y}`;

      let revenue = 0;
      let expenses = 0;
      let cashInflow = 0;
      let cashOutflow = 0;

      txs.forEach(t => {
        if (t.date && t.date.startsWith(key)) {
          if (t.account === 'Sales Revenue' && t.type === 'Credit') {
            revenue += Number(t.amount);
          }
          if (['Cost of Goods Sold', 'Rent Expense', 'Salary Expense', 'Depreciation Expense', 'Finance Cost', 'Tax Expense', 'Other Expenses', 'Bank Charges'].includes(t.account) && t.type === 'Debit') {
            expenses += Number(t.amount);
          }
          if (t.account === 'Cash and Bank') {
            if (t.type === 'Debit') cashInflow += Number(t.amount);
            else if (t.type === 'Credit') cashOutflow += Number(t.amount);
          }
        }
      });

      return {
        month: mName,
        monthKey: key,
        revenue,
        expenses,
        netOperating: revenue - expenses,
        cashInflow,
        cashOutflow,
        netCashFlow: cashInflow - cashOutflow
      };
    });
  },


  /**
   * Linear run-rate and moving-average forecasting grounded in historical data
   */
  generateForecast(monthlyData, currentCash, totalRevenue, totalExpenses) {
    const validMonths = monthlyData.filter(m => m.revenue > 0);
    const n = validMonths.length || 12;

    const avgMonthlyRevenue = totalRevenue > 0 ? (totalRevenue / n) : (validMonths.reduce((s, m) => s + m.revenue, 0) / n);
    const avgMonthlyExpenses = totalExpenses > 0 ? (totalExpenses / n) : (validMonths.reduce((s, m) => s + m.expenses, 0) / n);
    const avgMonthlyNetCash = validMonths.reduce((s, m) => s + m.netCashFlow, 0) / n;

    // Near-term 30-day projection (Apr 2026)
    const nextMonthRevenue = Math.round(avgMonthlyRevenue);
    const nextMonthExpenses = Math.round(avgMonthlyExpenses);
    const nextMonthEstimatedCash = Math.round(currentCash + (avgMonthlyNetCash || (nextMonthRevenue - nextMonthExpenses) * 0.4));

    // Next Quarter 90-day projection (Q1 FY 2026-27)
    const nextQuarterRevenue = Math.round(avgMonthlyRevenue * 3);
    const nextQuarterExpenses = Math.round(avgMonthlyExpenses * 3);
    const nextQuarterEstimatedCash = Math.round(currentCash + ((avgMonthlyNetCash || (nextMonthRevenue - nextMonthExpenses) * 0.4) * 3));

    return {
      basis: '12-Month Historical Moving Average (FY 2025-26)',
      disclaimer: 'Statistical estimate based on historical 12-month run-rate; not a guarantee of future financial performance.',
      nextMonth: {
        period: 'April 2026 (Next 30 Days)',
        estimatedRevenue: nextMonthRevenue,
        estimatedExpenses: nextMonthExpenses,
        estimatedCashBalance: nextMonthEstimatedCash,
        projectedNetChange: nextMonthRevenue - nextMonthExpenses
      },
      nextQuarter: {
        period: 'Q1 FY 2026-27 (Next 90 Days)',
        estimatedRevenue: nextQuarterRevenue,
        estimatedExpenses: nextQuarterExpenses,
        estimatedCashBalance: nextQuarterEstimatedCash,
        projectedNetChange: nextQuarterRevenue - nextQuarterExpenses
      }
    };
  }
};
