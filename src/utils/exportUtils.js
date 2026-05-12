import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (title, headers, data, filename = 'report.pdf') => {
  const doc = jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(11, 20, 38); // Navy
  doc.text('LedgerAI', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(136, 153, 170); // Muted
  doc.text('Professional Financial Reporting', 14, 25);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 40);
  
  doc.autoTable({
    startY: 50,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [11, 20, 38] },
    alternateRowStyles: { fillColor: [244, 245, 247] },
  });
  
  doc.save(filename);
};
