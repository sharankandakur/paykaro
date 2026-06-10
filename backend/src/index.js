require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payroll',    require('./routes/payroll'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n🚀 PayKaro API → http://localhost:${PORT}\n`));