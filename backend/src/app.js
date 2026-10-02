const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');

dotenv.config();

const app = express();

app.use(cors(process.env.ORIGIN));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/monuments', require('./routes/monumentRoutes'));
app.use('/api/admin/monuments', require('./routes/adminMonumentRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/queues', require('./routes/queueRoutes'));
app.use('/api/staff/queues', require('./routes/staffQueueRoutes'));
app.use('/api/staff/tickets', require('./routes/staffTicketRoutes'));
app.use('/api/admin/dashboard', require('./routes/adminDashboardRoutes'));
app.use('/api/admin/predictions', require('./routes/predictionRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));

app.use(errorHandler);

module.exports = app;
