require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { generateExcel } = require('./reports/excel');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { parse, isValid, format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();

app.use(cors());
app.use(express.json());

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'client_acceptance_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    console.log('Please ensure XAMPP MySQL service is running and database is created');
  }
};

testConnection();

// Helper function to validate and format date
const formatDate = (dateStr) => {
  try {
    if (!dateStr) return null;
    
    // Handle YYYY-MM-DD format
    if (dateStr.includes('-')) {
      return dateStr;
    }
    
    // Handle DD/MM/YYYY format
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
};

// API Routes
app.post('/api/acceptances', async (req, res) => {
  try {
    const { operationDate, operationNumber, payer, payee, amount, status, channel } = req.body;
    
    if (!operationDate || !operationNumber || !payer || !payee || !amount || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (status !== 'DISPENSADO' && !channel) {
      return res.status(400).json({ error: 'Channel is required for non-DISPENSADO status' });
    }

    const formattedDate = formatDate(operationDate);
    if (!formattedDate) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const sql = `
      INSERT INTO acceptances 
      (operationDate, operationNumber, payer, payee, amount, status, channel) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(sql, [
      formattedDate,
      operationNumber,
      payer,
      payee,
      amount,
      status,
      status === 'DISPENSADO' ? null : channel
    ]);

    res.status(201).json({ message: 'Acceptance created successfully' });
  } catch (error) {
    console.error('Error creating acceptance:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/acceptances', async (req, res) => {
  try {
    const { startDate, endDate, status, payer, minAmount, maxAmount } = req.query;
    let sql = 'SELECT * FROM acceptances WHERE 1=1';
    const params = [];

    if (startDate) {
      const formattedStartDate = formatDate(startDate);
      if (formattedStartDate) {
        sql += ' AND DATE(operationDate) >= ?';
        params.push(formattedStartDate);
      }
    }
    
    if (endDate) {
      const formattedEndDate = formatDate(endDate);
      if (formattedEndDate) {
        sql += ' AND DATE(operationDate) <= ?';
        params.push(formattedEndDate);
      }
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (payer) {
      sql += ' AND payer LIKE ?';
      params.push(`%${payer}%`);
    }
    if (minAmount) {
      sql += ' AND amount >= ?';
      params.push(Number(minAmount));
    }
    if (maxAmount) {
      sql += ' AND amount <= ?';
      params.push(Number(maxAmount));
    }

    sql += ' ORDER BY createdAt DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching acceptances:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/acceptances/:id', async (req, res) => {
  try {
    const { operationDate, operationNumber, payer, payee, amount, status, channel } = req.body;
    const { id } = req.params;

    if (!operationDate || !operationNumber || !payer || !payee || !amount || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (status !== 'DISPENSADO' && !channel) {
      return res.status(400).json({ error: 'Channel is required for non-DISPENSADO status' });
    }

    const formattedDate = formatDate(operationDate);
    if (!formattedDate) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const sql = `
      UPDATE acceptances 
      SET operationDate = ?, 
          operationNumber = ?, 
          payer = ?, 
          payee = ?, 
          amount = ?, 
          status = ?, 
          channel = ?
      WHERE id = ?
    `;

    await pool.execute(sql, [
      formattedDate,
      operationNumber,
      payer,
      payee,
      amount,
      status,
      status === 'DISPENSADO' ? null : channel,
      id
    ]);

    res.json({ message: 'Acceptance updated successfully' });
  } catch (error) {
    console.error('Error updating acceptance:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/acceptances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM acceptances WHERE id = ?', [id]);
    res.json({ message: 'Acceptance deleted successfully' });
  } catch (error) {
    console.error('Error deleting acceptance:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/acceptances/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM acceptances WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Acceptance not found' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Acceptance');
    
    worksheet.columns = [
      { header: 'Data da Operação', key: 'operationDate' },
      { header: 'Número da Operação', key: 'operationNumber' },
      { header: 'Cedente', key: 'payer' },
      { header: 'Sacado', key: 'payee' },
      { header: 'Valor', key: 'amount' },
      { header: 'Status', key: 'status' },
      { header: 'Canal', key: 'channel' }
    ];

    worksheet.addRow({
      ...rows[0],
      operationDate: new Date(rows[0].operationDate).toISOString().split('T')[0],
      amount: Number(rows[0].amount)
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=aceite_${rows[0].operationNumber}.xlsx`);
    
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Error exporting single acceptance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced reports endpoint
app.get('/api/reports/:format', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      statuses,
      payer,
      payee,
      channel,
      operationNumber,
      minAmount,
      maxAmount,
      columns,
      groupBy
    } = req.query;

    let sql = 'SELECT * FROM acceptances WHERE 1=1';
    const params = [];

    if (startDate) {
      const [day, month, year] = startDate.split('/');
      sql += ' AND operationDate >= ?';
      params.push(`${year}-${month}-${day}`);
    }
    if (endDate) {
      const [day, month, year] = endDate.split('/');
      sql += ' AND operationDate <= ?';
      params.push(`${year}-${month}-${day}`);
    }
    if (statuses && statuses.length) {
      sql += ` AND status IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
    if (payer) {
      sql += ' AND payer LIKE ?';
      params.push(`%${payer}%`);
    }
    if (payee) {
      sql += ' AND payee LIKE ?';
      params.push(`%${payee}%`);
    }
    if (channel) {
      sql += ' AND channel LIKE ?';
      params.push(`%${channel}%`);
    }
    if (operationNumber) {
      sql += ' AND operationNumber = ?';
      params.push(operationNumber);
    }
    if (minAmount) {
      sql += ' AND amount >= ?';
      params.push(Number(minAmount));
    }
    if (maxAmount) {
      sql += ' AND amount <= ?';
      params.push(Number(maxAmount));
    }

    if (groupBy && groupBy !== 'none') {
      sql += ` ORDER BY ${groupBy}`;
    }

    const [rows] = await pool.execute(sql, params);

    let processedData = rows;
    if (groupBy && groupBy !== 'none') {
      processedData = processDataWithGroups(rows, groupBy);
    }

    if (req.params.format === 'pdf') {
      const pdfBuffer = await generatePDF(processedData, columns, groupBy);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      res.send(pdfBuffer);
    } else if (req.params.format === 'xlsx') {
      const excelBuffer = await generateExcel(processedData, columns, groupBy);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
      res.send(excelBuffer);
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.sql`;
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)){
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Execute mysqldump command
    const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ''} ${process.env.DB_NAME} > ${path.join(backupDir, backupFileName)}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup error:', error);
        return res.status(500).json({ error: 'Failed to create backup' });
      }
      res.json({ 
        message: 'Backup created successfully',
        filename: backupFileName
      });
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel export endpoint
app.get('/api/export/excel', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM acceptances ORDER BY createdAt DESC');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Acceptances');
    
    worksheet.columns = [
      { header: 'Data da Operação', key: 'operationDate' },
      { header: 'Número da Operação', key: 'operationNumber' },
      { header: 'Cedente', key: 'payer' },
      { header: 'Sacado', key: 'payee' },
      { header: 'Valor', key: 'amount' },
      { header: 'Status', key: 'status' },
      { header: 'Canal', key: 'channel' }
    ];

    rows.forEach(row => {
      worksheet.addRow({
        ...row,
        operationDate: new Date(row.operationDate).toISOString().split('T')[0],
        amount: Number(row.amount)
      });
    });

    // Format columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=dados_aceites.xlsx');
    
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// Excel import endpoint
app.post('/api/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const [operationDate, operationNumber, payer, payee, amount, status, channel] = row.values.slice(1);
      
      if (!operationDate || !operationNumber || !payer || !payee || !amount || !status || !channel) {
        throw new Error(`Linha ${rowNumber}: Dados incompletos`);
      }

      rows.push([
        new Date(operationDate).toISOString().split('T')[0],
        operationNumber.toString(),
        payer.toString(),
        payee.toString(),
        Number(amount),
        status.toString().toLowerCase(),
        channel.toString()
      ]);
    });

    // Insert data in batches
    const sql = `
      INSERT INTO acceptances 
      (operationDate, operationNumber, payer, payee, amount, status, channel)
      VALUES ?
    `;

    await pool.query(sql, [rows]);

    res.json({ message: 'Dados importados com sucesso' });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: `Erro ao importar dados: ${error.message}` });
  }
});

function processDataWithGroups(data, groupKey) {
  const groups = {};
  data.forEach(item => {
    const key = item[groupKey];
    if (!groups[key]) {
      groups[key] = {
        items: [],
        total: 0
      };
    }
    groups[key].items.push(item);
    groups[key].total += Number(item.amount);
  });

  return Object.entries(groups).map(([key, value]) => ({
    group: key,
    count: value.items.length,
    total: value.total,
    items: value.items
  }));
}

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../dist')));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure XAMPP MySQL service is running`);
  console.log(`Frontend URL: http://localhost:5173`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});