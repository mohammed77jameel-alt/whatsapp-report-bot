/**
 * whatsapp-report-bot-main/scripts/backup.js
 * MASTER ARCHITECTURE: Automated Log Archiver
 */

const fs = require('fs');
const path = require('path');

(() => {
    const primaryLog = path.join(__dirname, '../logs/engine-combined.log');
    const archiveDirectory = path.join(__dirname, '../backups');

    if (!fs.existsSync(primaryLog) || fs.statSync(primaryLog).size === 0) {
        console.log("📋 Tracking logs are clean. Archiving step omitted.");
        return;
    }

    if (!fs.existsSync(archiveDirectory)) {
        fs.mkdirSync(archiveDirectory, { recursive: true });
    }

    const ISOString = new Date().toISOString().slice(0, 10);
    const archiveTarget = path.join(archiveDirectory, `archive-${ISOString}.log`);

    try {
        fs.copyFileSync(primaryLog, archiveTarget);
        fs.writeFileSync(primaryLog, ''); // Truncates active engine stream atomically
        console.log(`💾 Operational snapshot successfully exported to: backups/archive-${ISOString}.log`);
    } catch (error) {
        console.error(`❌ Log archiving process failed: ${error.message}`);
    }
})();
