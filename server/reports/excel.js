const ExcelJS = require('exceljs');

async function generateExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Aceitações');

  // Define columns
  worksheet.columns = [
    { header: 'Data da Operação', key: 'operationDate', width: 15 },
    { header: 'Nº da Operação', key: 'operationNumber', width: 15 },
    { header: 'Cedente', key: 'payer', width: 30 },
    { header: 'Sacado', key: 'payee', width: 30 },
    { header: 'Valor', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Canal', key: 'channel', width: 15 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' }
  };

  // Add data and format cells
  data.forEach(row => {
    worksheet.addRow({
      operationDate: new Date(row.operationDate).toLocaleDateString('pt-BR'),
      operationNumber: row.operationNumber,
      payer: row.payer,
      payee: row.payee,
      amount: row.amount,
      status: row.status,
      channel: row.status === 'DISPENSADO' ? 'N/A' : (row.channel || '')
    });
  });

  // Format amount column as currency
  worksheet.getColumn('amount').numFmt = '"R$"#,##0.00';

  // Add borders
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = { generateExcel };