/**
 * Log Management Utility
 * 
 * Commands:
 * - node log-manager.js clear       # Clear all logs
 * - node log-manager.js backup      # Backup current logs
 * - node log-manager.js restore     # Restore from backup
 * - node log-manager.js stats       # Show log statistics
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const TRADES_FILE = path.join(LOGS_DIR, 'trades.json');
const BACKUP_DIR = path.join(LOGS_DIR, 'backups');

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Clear all logs
 */
function clearLogs() {
  try {
    if (fs.existsSync(TRADES_FILE)) {
      fs.writeFileSync(TRADES_FILE, '[]', 'utf8');
      console.log('✅ Logs cleared successfully');
    } else {
      console.log('⚠️  No logs to clear');
    }
  } catch (error) {
    console.error(`❌ Error clearing logs: ${error.message}`);
  }
}

/**
 * Backup current logs
 */
function backupLogs() {
  try {
    ensureDirectories();
    
    if (!fs.existsSync(TRADES_FILE)) {
      console.log('⚠️  No logs to backup');
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(BACKUP_DIR, `trades-backup-${timestamp}.json`);
    
    fs.copyFileSync(TRADES_FILE, backupFile);
    console.log(`✅ Logs backed up to: ${backupFile}`);
  } catch (error) {
    console.error(`❌ Error backing up logs: ${error.message}`);
  }
}

/**
 * Restore logs from latest backup
 */
function restoreLogs() {
  try {
    ensureDirectories();
    
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('⚠️  No backups found');
      return;
    }
    
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('trades-backup-'))
      .sort()
      .reverse();
    
    if (backups.length === 0) {
      console.log('⚠️  No backups available');
      return;
    }
    
    const latestBackup = path.join(BACKUP_DIR, backups[0]);
    fs.copyFileSync(latestBackup, TRADES_FILE);
    
    console.log(`✅ Logs restored from: ${latestBackup}`);
  } catch (error) {
    console.error(`❌ Error restoring logs: ${error.message}`);
  }
}

/**
 * Show log statistics
 */
function showStats() {
  try {
    if (!fs.existsSync(TRADES_FILE)) {
      console.log('⚠️  No logs found');
      return;
    }
    
    const fileStats = fs.statSync(TRADES_FILE);
    const fileContent = fs.readFileSync(TRADES_FILE, 'utf8');
    const logs = fileContent.trim() ? JSON.parse(fileContent) : [];
    
    console.log('\n📊 Log Statistics');
    console.log('='.repeat(50));
    console.log(`File Size:      ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`Total Entries:  ${logs.length}`);
    console.log(`Created:        ${fileStats.birthtime.toISOString()}`);
    console.log(`Modified:       ${fileStats.mtime.toISOString()}`);
    
    if (logs.length > 0) {
      const firstTrade = new Date(logs[0].timestamp);
      const lastTrade = new Date(logs[logs.length - 1].timestamp);
      const duration = (lastTrade - firstTrade) / (1000 * 60 * 60);
      
      console.log(`First Trade:    ${logs[0].timestamp}`);
      console.log(`Last Trade:     ${logs[logs.length - 1].timestamp}`);
      console.log(`Period:         ${duration.toFixed(2)} hours`);
    }
    
    // Backup statistics
    if (fs.existsSync(BACKUP_DIR)) {
      const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('trades-backup-'));
      console.log(`\nBackups:        ${backups.length} found`);
    }
    
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error(`❌ Error showing stats: ${error.message}`);
  }
}

/**
 * Main command handler
 */
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'clear':
      clearLogs();
      break;
    case 'backup':
      backupLogs();
      break;
    case 'restore':
      restoreLogs();
      break;
    case 'stats':
      showStats();
      break;
    default:
      console.log('Usage:');
      console.log('  node log-manager.js clear      # Clear all logs');
      console.log('  node log-manager.js backup     # Backup current logs');
      console.log('  node log-manager.js restore    # Restore from backup');
      console.log('  node log-manager.js stats      # Show log statistics');
  }
}

main();
