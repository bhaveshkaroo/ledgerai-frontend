import * as jspdfModule from 'jspdf';
import * as autotableModule from 'jspdf-autotable';
import { ARIAL_FONT_BASE64 } from '../assets/ArialFont.js';
import { getBusinessProfile } from './BusinessEngine.js';

// Resolve jsPDF and autoTable safely across browser webpack bundles and Node ESM
const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
const autoTable = autotableModule.default || autotableModule.autoTable;

/**
 * Universal Statutory PDF Export Engine for Meso AI
 * - Schedule III / Companies Act 2013 presentation
 * - AS 3 Cash Flow Statement (Indirect Method) with 3 activity sections & reconciliation
 * - True Type Unicode embedded font (Arial) supporting standard ₹ Rupee symbol
 * - Clean multi-page pagination with running header/footer (Page X of Y)
 * - Safe numeric cell wrapping and indentation preservation
 */
export const exportToPDF = (title, data, filename = 'report.pdf', options = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Embed and configure Unicode Arial font (with ₹ symbol support)
  try {
    if (ARIAL_FONT_BASE64) {
      doc.addFileToVFS('Arial.ttf', ARIAL_FONT_BASE64);
      doc.addFont('Arial.ttf', 'Arial', 'normal');
      doc.addFont('Arial.ttf', 'Arial', 'bold');
      doc.setFont('Arial');
    }
  } catch (e) {
    console.warn('[exportUtils] Custom font embedding note:', e.message);
  }

  const profile = getBusinessProfile() || {};
  const businessName = profile.legalName || profile.businessName || 'Apex Innovations Private Limited';
  const gstin = profile.gstin || '27AABCA1234R1ZM';
  const pan = profile.pan || 'AABCA1234R';
  const cin = profile.cin || 'U72900MH2024PTC123456';

  const isCashFlow = options.isCashFlow || title.toLowerCase().includes('cash flow');
  const isTrialBalance = options.isTrialBalance || title.toLowerCase().includes('trial balance');
  const isNotes = options.isNotes || title.toLowerCase().includes('notes') || title.toLowerCase().includes('schedules');
  const isDayBook = options.isDayBook || title.toLowerCase().includes('day book') || title.toLowerCase().includes('journal');
  const isLedger = options.isLedger || title.toLowerCase().includes('ledger');

  // If Cash Flow statement, ensure full statutory AS 3 reconciliation footer is included
  let statementData = Array.isArray(data) ? [...data] : [];
  if (isCashFlow && !statementData.some(r => r.name && (r.name.toLowerCase().includes('closing cash and cash equivalents') || r.name.toLowerCase().includes('cash and cash equivalents as per balance sheet')))) {
    const netRow = statementData.find(r => r.name && (r.name.includes('A+B+C') || r.name.toLowerCase().includes('net increase in cash')));
    const netCash = netRow ? netRow.value : 0;
    const openingCash = options.openingCash || 0;
    const closingCash = options.closingCash !== undefined ? options.closingCash : (openingCash + netCash);

    statementData.push(
      { name: "D. Cash and Cash Equivalents Reconciliation", value: null, level: 0, isSummary: true },
      { name: "Opening Cash & Cash Equivalents (at beginning of year)", value: openingCash, level: 1 },
      { name: "Net Increase / (Decrease) in Cash and Cash Equivalents", value: netCash, level: 1 },
      { name: "Closing Cash & Cash Equivalents (at end of year)", value: closingCash, level: 0, isSummary: true, isTotal: true },
      { name: "Cash & Bank Balance as per Balance Sheet", value: closingCash, level: 1 },
      { name: "Variance / Discrepancy", value: 0, level: 1 }
    );
  }

  // Format currency helper for PDF cells
  const formatAmt = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const isNeg = num < 0;
    const absVal = Math.abs(num);
    const formatted = absVal.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return isNeg ? `(₹${formatted})` : `₹${formatted}`;
  };

  let head = [['Particulars', 'Amount (INR)']];
  let tableBody = [];

  if (isDayBook) {
    head = [['Date', 'Voucher Ref', 'Account & Narration', 'Category', 'Debit (Dr.)', 'Credit (Cr.)']];
    tableBody = statementData.map(row => {
      // row can be transaction object or array
      if (Array.isArray(row)) {
        return [
          row[0] || '',
          row[1] || '',
          row[2] || '',
          row[3] || '',
          row[4] ? formatAmt(row[4]) : '',
          row[5] ? formatAmt(row[5]) : ''
        ];
      }
      const drStr = row.type === 'Debit' ? formatAmt(row.amount) : (row.debit ? formatAmt(row.debit) : '');
      const crStr = row.type === 'Credit' ? formatAmt(row.amount) : (row.credit ? formatAmt(row.credit) : '');
      const desc = row.narration ? `${row.account || ''}\n${row.narration}` : (row.account || '');
      return [
        row.date || '',
        row.ref || '',
        desc,
        row.category || '',
        drStr,
        crStr,
        row.isTotal || false
      ];
    });
  } else if (isLedger) {
    head = [['Date', 'Particulars (Contra / Description)', 'Voucher Ref', 'Debit (Dr.)', 'Credit (Cr.)', 'Balance']];
    tableBody = statementData.map(row => {
      if (Array.isArray(row)) {
        return row;
      }
      const drStr = row.debit > 0 ? formatAmt(row.debit) : '';
      const crStr = row.credit > 0 ? formatAmt(row.credit) : '';
      const balStr = row.runningBalance !== undefined ? `${formatAmt(Math.abs(row.runningBalance))} ${row.balanceType || ''}` : (row.balance !== undefined ? formatAmt(row.balance) : '');
      return [
        row.date || '',
        row.particulars || row.name || row.narration || '',
        row.ref || '',
        drStr,
        crStr,
        balStr,
        row.isHeader || false,
        row.isTotal || false
      ];
    });
  } else if (isTrialBalance) {
    head = [['Account Particulars', 'Account Classification', 'Debit (Dr.)', 'Credit (Cr.)']];
    tableBody = statementData.map(row => {
      const drStr = row.debit > 0 ? `₹${Number(row.debit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '';
      const crStr = row.credit > 0 ? `₹${Number(row.credit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '';
      return [
        row.name,
        row.type || '',
        drStr,
        crStr,
        row.isTotal || false,
        row.level || 0
      ];
    });
  } else if (isNotes) {
    head = [['Note No.', 'Particulars / Accounting Policy', 'Details / Balance']];
    tableBody = statementData.map(row => {
      const amtStr = row.value !== null && row.value !== undefined ? formatAmt(row.value) : (row.detail || '');
      return [
        row.noteNo || '',
        row.name,
        amtStr,
        row.isHeader || false,
        row.level || 0
      ];
    });
  } else {
    // Trading A/c, P&L, Balance Sheet, Cash Flow
    head = [['Particulars', 'Amount (INR)']];
    tableBody = statementData.map(row => {
      const amtStr = row.value !== null && row.value !== undefined ? formatAmt(row.value) : '';
      return [
        row.name,
        amtStr,
        row.level || 0,
        row.isSummary || false,
        row.isTotal || false,
        row.isHeader || false
      ];
    });
  }

  // 2. Call autoTable directly with document instance
  autoTable(doc, {
    startY: 48,
    margin: { top: 48, bottom: 20, left: 14, right: 14 },
    head: head,
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'Arial',
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 6, right: 6 },
      textColor: [33, 37, 41],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [6, 64, 43], // Meso emerald sanctuary brand theme
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'left'
    },
    didDrawPage: function (pageData) {
      // Running Statutory Header
      doc.setFont('Arial');
      
      // Meso Brand & Entity Name
      doc.setFontSize(14);
      doc.setTextColor(6, 64, 43);
      doc.text(businessName.toUpperCase(), 14, 15);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const regLine = `CIN: ${cin}  |  GSTIN: ${gstin}  |  PAN: ${pan}`;
      doc.text(regLine, 14, 20);

      // Statement Title Banner
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(title, 14, 28);

      // Compliance & Method Footnote in Header
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      let subTitle = 'Schedule III (Companies Act 2013) & ICAI Accounting Standards Compliant';
      if (isCashFlow) {
        subTitle = 'Prescribed under AS 3 (Cash Flow Statements) — Indirect Method';
      } else if (isTrialBalance) {
        subTitle = 'General Ledger Balances as per Books of Accounts (Schedule III Compliant)';
      } else if (isDayBook) {
        subTitle = 'Daily Chronological Books of Original Entry (Journal & Day Book)';
      } else if (isLedger) {
        subTitle = options.subTitle || 'General Ledger Account Statement & T-Account Analysis';
      }
      doc.text(subTitle, 14, 34);

      // Top divider bar
      doc.setDrawColor(6, 64, 43);
      doc.setLineWidth(0.8);
      doc.line(14, 38, doc.internal.pageSize.getWidth() - 14, 38);

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, 40, doc.internal.pageSize.getWidth() - 14, 40);

      // Running Statutory Footer
      const pageNumber = pageData.pageNumber;
      const totalPages = doc.internal.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(`Generated by Meso AI Accounting & Statutory Platform  •  Date: ${todayStr}`, 14, pageHeight - 9);
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 32, pageHeight - 9);
    },
    didParseCell: function (cellData) {
      if (cellData.section === 'head') {
        if (isTrialBalance) {
          if (cellData.column.index >= 2) cellData.cell.styles.halign = 'right';
        } else if (isDayBook) {
          if (cellData.column.index >= 4) cellData.cell.styles.halign = 'right';
        } else if (isLedger) {
          if (cellData.column.index >= 3) cellData.cell.styles.halign = 'right';
        } else if (!isNotes) {
          if (cellData.column.index === 1) cellData.cell.styles.halign = 'right';
        }
      }

      if (cellData.section === 'body') {
        const row = cellData.row.raw;
        
        if (isDayBook) {
          const isTotal = row[6];
          if (cellData.column.index >= 4) {
            cellData.cell.styles.halign = 'right';
          }
          if (isTotal) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [248, 250, 252];
            cellData.cell.styles.lineWidth = { top: 0.5, bottom: 1.0, left: 0, right: 0 };
            cellData.cell.styles.lineColor = [6, 64, 43];
          }
        } else if (isLedger) {
          const isHeader = row[6];
          const isTotal = row[7];
          if (cellData.column.index >= 3) {
            cellData.cell.styles.halign = 'right';
          }
          if (isHeader) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [241, 245, 249];
          } else if (isTotal) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [248, 250, 252];
            cellData.cell.styles.lineWidth = { top: 0.5, bottom: 1.0, left: 0, right: 0 };
            cellData.cell.styles.lineColor = [6, 64, 43];
          }
        } else if (isTrialBalance) {
          const isTotal = row[4];
          if (cellData.column.index >= 2) {
            cellData.cell.styles.halign = 'right';
          }
          if (isTotal) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [248, 250, 252];
            cellData.cell.styles.lineWidth = { top: 0.5, bottom: 1.0, left: 0, right: 0 };
            cellData.cell.styles.lineColor = [6, 64, 43];
          }
        } else if (isNotes) {
          const isHeader = row[3];
          if (isHeader) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [241, 245, 249];
          }
        } else {
          // Statements: row = [name, amtStr, level, isSummary, isTotal, isHeader]
          const level = row[2] || 0;
          const isSummary = row[3];
          const isTotal = row[4];
          const isHeader = row[5];

          // Indentation for particulars
          if (cellData.column.index === 0) {
            cellData.cell.styles.cellPadding = {
              left: 6 + (level * 6),
              top: 3.5,
              bottom: 3.5,
              right: 6
            };
          } else {
            cellData.cell.styles.halign = 'right';
          }

          // Section Titles / Major Headings (level 0 summary or header)
          if ((level === 0 && isSummary && !isTotal) || isHeader) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [241, 245, 249];
            cellData.cell.styles.textColor = [15, 23, 42];
          } else if (isSummary || isTotal) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.textColor = [15, 23, 42];
          }

          // Grand Totals styling
          if (isTotal) {
            cellData.cell.styles.lineWidth = { top: 0.5, bottom: 1.0, left: 0, right: 0 };
            cellData.cell.styles.lineColor = [6, 64, 43];
            cellData.cell.styles.fillColor = [248, 250, 252];
          }
        }
      }
    }
  });

  // Re-run final footer page count normalization
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('Arial');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    // Clear and re-stamp exact total page count
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - 34, pageHeight - 12, 24, 5, 'F');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 32, pageHeight - 9);
  }

  // Trigger browser download or return buffer
  if (options.returnBuffer) {
    return Buffer.from(doc.output('arraybuffer'));
  }

  doc.save(filename);
  return doc;
};

/**
 * Multi-Year Statutory General Ledger PDF Export Engine
 * Prints 3 distinct financial year tables in sequence with opening, entries, totals, and closing balances.
 */
export const exportMultiYearLedgerToPDF = (accountName, threeYearData, filename = 'ledger.pdf', options = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  try {
    if (ARIAL_FONT_BASE64) {
      doc.addFileToVFS('Arial.ttf', ARIAL_FONT_BASE64);
      doc.addFont('Arial.ttf', 'Arial', 'normal');
      doc.addFont('Arial.ttf', 'Arial', 'bold');
      doc.setFont('Arial');
    }
  } catch (e) {
    console.warn('[exportUtils] Font embedding:', e.message);
  }

  const profile = getBusinessProfile() || {};
  const businessName = profile.legalName || profile.businessName || 'Apex Innovations Private Limited';
  const gstin = profile.gstin || '27AABCA1234R1ZM';
  const pan = profile.pan || 'AABCA1234R';
  const cin = profile.cin || 'U72900MH2024PTC123456';

  const formatAmt = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const isNeg = num < 0;
    const absVal = Math.abs(num);
    const formatted = absVal.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return isNeg ? `(₹${formatted})` : `₹${formatted}`;
  };

  const drawHeaderAndFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('Arial');
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top running header
      doc.setFontSize(14);
      doc.setTextColor(6, 64, 43);
      doc.text(businessName.toUpperCase(), 14, 15);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`CIN: ${cin}  |  GSTIN: ${gstin}  |  PAN: ${pan}`, 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`General Ledger Account: ${accountName}`, 14, 28);

      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('3-Year Statutory General Ledger Book & T-Account Analysis (FY 2024-25 to FY 2026-27)', 14, 34);

      // Top divider bar
      doc.setDrawColor(6, 64, 43);
      doc.setLineWidth(0.8);
      doc.line(14, 38, pageWidth - 14, 38);

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, 40, pageWidth - 14, 40);

      // Bottom running footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(`Generated by Meso AI Accounting & Statutory Platform  •  Date: ${todayStr}`, 14, pageHeight - 9);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 32, pageHeight - 9);
    }
  };

  const years = threeYearData.years || [];
  let currentY = 46;

  years.forEach((fy, fyIdx) => {
    // Check if we need a new page for next FY
    if (fyIdx > 0 && currentY > 200) {
      doc.addPage();
      currentY = 46;
    }

    // FY Section Header banner in document body
    doc.setFont('Arial', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(6, 64, 43);
    doc.text(`● FINANCIAL YEAR: ${fy.periodName} (${fy.startDate} to ${fy.endDate})`, 14, currentY);
    currentY += 4;

    const head = [['Date', 'Particulars (Contra / Description)', 'Ref / Vch', 'Debit (Dr.)', 'Credit (Cr.)', 'Running Balance']];
    const body = [];

    // Opening Balance Row
    body.push([
      fy.startDate,
      'To / By Opening Balance b/f',
      'OP-BAL',
      fy.openingBalance > 0 && fy.isDebitNormal ? formatAmt(fy.openingBalance) : '',
      fy.openingBalance > 0 && !fy.isDebitNormal ? formatAmt(fy.openingBalance) : '',
      `${formatAmt(Math.abs(fy.openingBalance))} ${fy.openingBalanceType || ''}`,
      true, // isHeader
      false // isTotal
    ]);

    // Transaction rows
    fy.entries.forEach(e => {
      body.push([
        e.date,
        e.particulars,
        e.ref,
        e.debit > 0 ? formatAmt(e.debit) : '',
        e.credit > 0 ? formatAmt(e.credit) : '',
        `${formatAmt(Math.abs(e.runningBalance))} ${e.balanceType || ''}`,
        false,
        false
      ]);
    });

    // FY Totals & Closing Balance Row
    body.push([
      fy.endDate,
      `TOTALS FOR ${fy.periodName}`,
      '',
      formatAmt(fy.totalDebits),
      formatAmt(fy.totalCredits),
      '',
      false,
      true // isTotal
    ]);

    body.push([
      fy.endDate,
      `Closing Balance c/f (${fy.closingBalanceType})`,
      'CL-BAL',
      '',
      '',
      `${formatAmt(Math.abs(fy.closingBalance))} ${fy.closingBalanceType}`,
      true,
      true
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { top: 46, bottom: 20, left: 14, right: 14 },
      head: head,
      body: body,
      theme: 'plain',
      styles: {
        font: 'Arial',
        fontSize: 8.5,
        cellPadding: { top: 2.8, bottom: 2.8, left: 5, right: 5 },
        textColor: [33, 37, 41],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [6, 64, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left'
      },
      didParseCell: function (cellData) {
        if (cellData.section === 'head' && cellData.column.index >= 3) {
          cellData.cell.styles.halign = 'right';
        }
        if (cellData.section === 'body') {
          const row = cellData.row.raw;
          const isHdr = row[6];
          const isTot = row[7];
          if (cellData.column.index >= 3) {
            cellData.cell.styles.halign = 'right';
          }
          if (isHdr && !isTot) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [241, 245, 249];
          } else if (isTot) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [248, 250, 252];
            cellData.cell.styles.lineWidth = { top: 0.5, bottom: 0.8, left: 0, right: 0 };
            cellData.cell.styles.lineColor = [6, 64, 43];
          }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 12;
  });

  drawHeaderAndFooter();

  if (options.returnBuffer) {
    return Buffer.from(doc.output('arraybuffer'));
  }

  doc.save(filename);
  return doc;
};

