const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

pdfMake.vfs = pdfFonts.pdfMake.vfs;

async function generatePDF(data) {
  // Configure document fonts
  const fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };

  // Configure default styles
  const styles = {
    header: {
      fontSize: 18,
      bold: true,
      margin: [0, 0, 0, 10],
      color: '#C5A572',
      font: 'Roboto'
    },
    subheader: {
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 5],
      color: '#666666',
      font: 'Roboto'
    },
    tableHeader: {
      bold: true,
      fontSize: 10,
      color: '#333333',
      fillColor: '#F5F5F5',
      font: 'Roboto'
    },
    tableRow: {
      fontSize: 9,
      font: 'Roboto'
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const defaultStyle = {
    font: 'Roboto',
    fontSize: 10,
    lineHeight: 1.2
  };

  const documentDefinition = {
    pageOrientation: 'landscape',
    defaultStyle: defaultStyle,
    footer: function(currentPage, pageCount) {
      return {
        text: `Página ${currentPage.toString()} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0],
        font: 'Roboto'
      };
    },
    content: [
      {
        text: 'Relatório de Aceitações',
        style: 'header'
      },
      {
        text: `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        style: 'subheader'
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', '*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Data', style: 'tableHeader' },
              { text: 'Operação', style: 'tableHeader' },
              { text: 'Cedente', style: 'tableHeader' },
              { text: 'Sacado', style: 'tableHeader' },
              { text: 'Valor', style: 'tableHeader' },
              { text: 'Status', style: 'tableHeader' },
              { text: 'Canal', style: 'tableHeader' }
            ],
            ...data.map(row => [
              { text: formatDate(row.operationDate), style: 'tableRow' },
              { text: row.operationNumber, style: 'tableRow' },
              { text: row.payer, style: 'tableRow' },
              { text: row.payee, style: 'tableRow' },
              { text: formatCurrency(row.amount), style: 'tableRow', alignment: 'right' },
              { text: row.status, style: 'tableRow' },
              { text: row.status === 'DISPENSADO' ? 'N/A' : (row.channel || ''), style: 'tableRow' }
            ])
          ]
        },
        layout: {
          hLineWidth: function(i, node) {
            return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function(i, node) {
            return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
          },
          hLineColor: function(i, node) {
            return (i === 0 || i === node.table.body.length) ? '#666666' : '#999999';
          },
          vLineColor: function(i, node) {
            return (i === 0 || i === node.table.widths.length) ? '#666666' : '#999999';
          },
          paddingLeft: function(i) { return 4; },
          paddingRight: function(i) { return 4; },
          paddingTop: function(i) { return 4; },
          paddingBottom: function(i) { return 4; }
        }
      }
    ],
    styles: styles,
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20]
  };

  return new Promise((resolve) => {
    const pdfDoc = pdfMake.createPdf(documentDefinition);
    pdfDoc.getBuffer((buffer) => {
      resolve(buffer);
    });
  });
}

module.exports = { generatePDF };