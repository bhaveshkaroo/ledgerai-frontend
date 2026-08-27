import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (title, data, filename = 'report.pdf') => {
  const doc = jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(11, 20, 38); // Navy
  doc.text('Meso', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(136, 153, 170); // Muted
  doc.text('Schedule III / Ind AS Compliant Financial Statement', 14, 25);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 40);
  
  // Prepare flat data for autotable, but keep track of levels
  const tableData = data.map(row => {
    // Format amount if exists, otherwise blank
    const amountStr = row.value !== null && row.value !== undefined 
      ? Number(row.value).toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
      : '';
    return [row.name, amountStr, row.level, row.isSummary, row.isTotal];
  });

  doc.autoTable({
    startY: 50,
    head: [['Particulars', 'Amount (INR)']],
    body: tableData,
    theme: 'plain', // Use plain to control borders manually
    headStyles: { fillColor: [244, 245, 247], textColor: [0, 0, 0], fontStyle: 'bold' },
    
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rowData = data.row.raw;
        const level = rowData[2];
        const isSummary = rowData[3];
        const isTotal = rowData[4];
        
        // Indentation for the Particulars column (index 0)
        if (data.column.index === 0) {
          data.cell.styles.cellPadding = { 
            left: 14 + (level * 8), // Indent based on level
            top: 4, bottom: 4, right: 4 
          };
        } else {
          // Right align amount column
          data.cell.styles.halign = 'right';
        }
        
        // Font styling
        if (isSummary || isTotal) {
          data.cell.styles.fontStyle = 'bold';
        }
        
        // Add top border for totals
        if (isTotal) {
          data.cell.styles.lineWidth = { top: 0.5, bottom: 0, left: 0, right: 0 };
          data.cell.styles.lineColor = [0, 0, 0];
        }
      }
    }
  });
  
  doc.save(filename);
};
