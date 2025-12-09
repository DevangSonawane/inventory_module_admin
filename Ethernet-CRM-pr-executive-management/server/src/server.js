import os from 'os';
import app from './app.js';
import { connectDB } from './config/database.js';
// Import models to ensure associations are loaded
import './models/index.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const getLanAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  Object.values(interfaces).forEach((iface) => {
    iface?.forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        addresses.push(details.address);
      }
    });
  });

  return addresses;
};

const logAccessibleUrls = () => {
  const lanAddresses = getLanAddresses();
  const urls = [
    { label: 'Localhost', url: `http://localhost:${PORT}/api/v1` },
    { label: 'Loopback', url: `http://127.0.0.1:${PORT}/api/v1` },
  ];

  lanAddresses.forEach((address, index) => {
    urls.push({ label: `LAN ${index + 1}`, url: `http://${address}:${PORT}/api/v1` });
  });

  urls.push({
    label: 'Android emulator (10.0.2.2)',
    url: `http://10.0.2.2:${PORT}/api/v1`,
  });

  console.log('🌐 Accessible API endpoints:');
  urls.forEach(({ label, url }) => console.log(`   • ${label}: ${url}`));

  if (!lanAddresses.length) {
    console.log(
      '   • LAN: Connect your machine to Wi‑Fi or Ethernet to expose a LAN address.'
    );
  }
};

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (HOST === '0.0.0.0') {
        console.log('🔓 Host binding: 0.0.0.0 (accessible from LAN + emulator)');
      } else {
        console.log(`🔓 Host binding: ${HOST}`);
      }
      logAccessibleUrls();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});
