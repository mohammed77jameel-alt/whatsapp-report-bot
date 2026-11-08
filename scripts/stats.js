/**
 * whatsapp-report-bot-main/scripts/stats.js
 * MASTER ARCHITECTURE: System Metrics and Data Forensics Console
 */

const fs = require('fs');
const path = require('path');

(() => {
    const registryFile = path.join(__dirname, '../logs/engine-combined.log');
    console.log("🔍 Running telemetry log analysis...");

    if (!fs.existsSync(registryFile)) {
        console.log("❌ Log tracking repository unavailable.");
        return;
    }

    const logHistory = fs.readFileSync(registryFile, 'utf8').split('\n').filter(Boolean);
    let successCount = 0, failCount = 0;

    logHistory.forEach(record => {
        if (record.includes('successfully processed')) successCount++;
        if (record.includes('Fatal Engine Fault')) failCount++;
    });

    const combinedVolume = successCount + failCount || 1;
    const performanceCoefficient = ((successCount / combinedVolume) * 100).toFixed(1);

    console.log(`\n========================================`);
    console.log(`📊 CORE OPERATIONAL TELEMETRY REPORT`);
    console.log(`========================================`);
    console.log(`📈 Success Volume      : ${successCount}`);
    console.log(`📉 Interrupted Volume  : ${failCount}`);
    console.log(`🛡️ Delivery Coefficient : ${performanceCoefficient}%`);
    console.log(`========================================\n`);
})();
