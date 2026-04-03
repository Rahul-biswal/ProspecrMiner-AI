const ExcelJS = require('exceljs');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

const EXPORT_DIR = path.join(__dirname, '../../exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

function formatLeadForExport(lead) {
  return {
    businessName: lead.businessName || '',
    address: lead.address || '',
    phone: lead.phoneNumber || '',
    website: lead.websiteUrl || '',
    rating: lead.rating || '',
    reviewCount: lead.reviewCount || '',
    qualificationScore: lead.qualificationScore || '',
    overallScore: lead.scoreBreakdown?.overallScore || 0,
    services: (lead.servicesOffered || []).join('; '),
    keyInsights: (lead.keyInsights || []).join('; '),
    aiSummary: lead.aiSummary || '',
    emailFormats: (lead.emailFormats || []).slice(0, 3).join('; '),
    mxValid: lead.mxRecordValid ? 'Yes' : 'No',
  };
}

/**
 * Export leads as CSV
 */
async function exportAsCSV(leads, jobId) {
  const filePath = path.join(EXPORT_DIR, `leads_${jobId}.csv`);
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'businessName', title: 'Business Name' },
      { id: 'address', title: 'Address' },
      { id: 'phone', title: 'Phone' },
      { id: 'website', title: 'Website' },
      { id: 'rating', title: 'Rating' },
      { id: 'reviewCount', title: 'Reviews' },
      { id: 'qualificationScore', title: 'Score' },
      { id: 'overallScore', title: 'Score Points' },
      { id: 'services', title: 'Services Offered' },
      { id: 'keyInsights', title: 'Key Insights' },
      { id: 'aiSummary', title: 'AI Summary' },
      { id: 'emailFormats', title: 'Email Formats' },
      { id: 'mxValid', title: 'MX Valid' },
    ],
  });

  await csvWriter.writeRecords(leads.map(formatLeadForExport));
  return filePath;
}

/**
 * Export leads as XLSX — multi-sheet, color-coded
 */
async function exportAsXLSX(leads, jobId) {
  const filePath = path.join(EXPORT_DIR, `leads_${jobId}.xlsx`);
  const workbook = new ExcelJS.Workbook();

  const scoreColors = {
    High: 'FF10B981',   // Green
    Medium: 'FFFBBF24', // Yellow
    Low: 'FFEF4444',    // Red
    Unscored: 'FFD1D5DB',
  };

  const sheets = {
    'All Leads': leads,
    'High Priority': leads.filter(l => l.qualificationScore === 'High'),
    'Medium Priority': leads.filter(l => l.qualificationScore === 'Medium'),
  };

  const headers = [
    'Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews',
    'Score', 'Score Points', 'Services', 'Key Insights', 'AI Summary', 'Email Formats', 'MX Valid'
  ];

  for (const [sheetName, sheetLeads] of Object.entries(sheets)) {
    const sheet = workbook.addWorksheet(sheetName);

    // Header row styling
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };

    // Data rows
    sheetLeads.forEach((lead) => {
      const d = formatLeadForExport(lead);
      const row = sheet.addRow([
        d.businessName, d.address, d.phone, d.website, d.rating, d.reviewCount,
        d.qualificationScore, d.overallScore, d.services, d.keyInsights,
        d.aiSummary, d.emailFormats, d.mxValid
      ]);

      // Color-code rows by score
      const color = scoreColors[lead.qualificationScore] || scoreColors.Unscored;
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    });

    // Auto-width columns
    sheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 60);
    });
  }

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

module.exports = { exportAsCSV, exportAsXLSX };
