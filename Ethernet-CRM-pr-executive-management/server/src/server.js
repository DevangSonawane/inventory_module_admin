import os from 'os';
import app from './app.js';
import { connectDB } from './config/database.js';
// Import models to ensure associations are loaded
import './models/index.js';
// Import migration script
import runMigration from './scripts/migrateInventoryTables.js';

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

/**
 * Run all startup tasks in sequence
 * This ensures database, migrations, and other setup tasks complete before starting the server
 */
const runStartupTasks = async () => {
  const tasks = [];
  
  // Task 1: Connect to database
  tasks.push({
    name: 'Database Connection',
    task: async () => {
      await connectDB();
    }
  });
  
  // Task 2: Run database migrations
  tasks.push({
    name: 'Database Migrations',
    task: async () => {
      console.log('🔄 Running database migrations...');
      try {
        const migrationResult = await runMigration(true); // silent = true
        if (migrationResult && migrationResult.success === false) {
          console.warn('⚠️  Migration completed with warnings:', migrationResult.error);
        } else {
          console.log('✅ Database migrations completed');
        }
      } catch (migrationError) {
        console.error('❌ Migration error:', migrationError.message);
        // Don't exit - allow server to start even if migration has issues
        // This is useful for development where some migrations might fail
        console.warn('⚠️  Continuing server startup despite migration warnings...');
      }
    },
    optional: true // Don't fail startup if migrations have issues
  });
  
  // Task 3: Verify email configuration (non-blocking)
  tasks.push({
    name: 'Email Service Verification',
    task: async () => {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const { verifyEmailConfig } = await import('./utils/emailService.js');
          const emailStatus = await verifyEmailConfig();
          if (emailStatus.configured) {
            console.log('✅ Email service configured and ready');
          } else {
            console.warn('⚠️  Email service configuration issue:', emailStatus.message);
          }
        } catch (emailError) {
          console.warn('⚠️  Could not verify email configuration:', emailError.message);
        }
      } else {
        console.log('ℹ️  Email service not configured (optional)');
      }
    },
    optional: true
  });
  
  // Execute all tasks in sequence
  for (const { name, task, optional } of tasks) {
    try {
      await task();
    } catch (error) {
      if (optional) {
        console.warn(`⚠️  ${name} failed (non-critical):`, error.message);
      } else {
        console.error(`❌ ${name} failed:`, error.message);
        throw error; // Re-throw critical errors
      }
    }
  }
};

// Connect to database and start server
const startServer = async () => {
  try {
    // Run all startup tasks (database connection, migrations, email verification, etc.)
    await runStartupTasks();
    
    // Start the HTTP server
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
