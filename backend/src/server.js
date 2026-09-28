const app = require('./app');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = () => {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDB();
  });
};

startServer();
