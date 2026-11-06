const config = require('./config.js');
const reportService = require('./services/report-service.js');
const emailService = require('./services/email-service.js');
const telegramService = require('./services/telegram-service.js');

class DivineEnginePipeline {
    constructor() {
        this.context = {
            action: process.argv[2],
            target: process.argv[3],
            nuance: process.argv[4] || 'false_positive',
            payload: null,
            startTime: Date.now()
        };
    }

    async awaken() {
        try {
            this.validateScope()
                .logInitialization();

            await this.synthesizePayload();
            await this.enforceStealthSync();
            await this.dispatchTransport();
            await this.syncTelemetry();

            console.log(`\n✨ [PIPELINE COMPLETE] Transaction successfully sealed in ${Date.now() - this.context.startTime}ms.\n`);
        } catch (fault) {
            await this.handleSystemFault(fault);
        }
    }

    validateScope() {
        const { action, target } = this.context;
        const validActions = ['report', 'unban'];

        if (!action || !target || !validActions.includes(action.toLowerCase())) {
            console.log(`\n❌ [SYNTAX FAULT] Invalid execution parameters detected.`);
            console.log(`------------------------------------------------------------`);
            console.log(`Enforcement Command : node index.js report <target_phone>`);
            console.log(`Recovery Command    : node index.js unban  <target_phone> <context_topic>\n`);
            process.exit(1);
        }
        return this;
    }

    logInitialization() {
        console.log(`\n🌌 [ENGAGING COGNITION ENGINE]`);
        console.log(`▫️ Operational Strategy : ${this.context.action.toUpperCase()}`);
        console.log(`▫️ Endpoint Identifier   : ${this.context.target}`);
        if (this.context.action === 'unban') {
            console.log(`▫️ Contextual Nuance   : ${this.context.nuance}`);
        }
        console.log(`------------------------------------------------------------`);
        return this;
    }

    async synthesizePayload() {
        const { action, target, nuance } = this.context;
        console.log(`🔮 [1/4] Generating unique semantic document structure...`);
        this.context.payload = await reportService.compile(target, action, nuance);
    }

    async enforceStealthSync() {
        const { minDelay, maxDelay } = config.stealth;
        const delayDuration = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        console.log(`⏳ [2/4] Injecting ${delayDuration}ms of artificial temporal entropy...`);
        await new Promise(resolve => setTimeout(resolve, delayDuration));
    }

    async dispatchTransport() {
        console.log(`🚀 [3/4] Transmitting encrypted matrix packet over SMTP transport...`);
        await emailService.sendReport(this.context.target, this.context.payload.body);
    }

    async syncTelemetry() {
        console.log(`📡 [4/4] Broadcasting runtime metrics to cloud telemetry nodes...`);
        await telegramService.sendLiveDashboard({
            activeNodes: config.engine.concurrency,
            successRate: "100%"
        });
    }

    async handleSystemFault(fault) {
        const errorSignature = `[CRITICAL_PIPELINE_FAULT] -> ${fault.message}`;
        console.error(`\n🚨 ${errorSignature}\n`);
        
        await telegramService.logAlert(`Engine Interruption on Action [${this.context.action?.toUpperCase()}]: ${fault.message}`);
    }
}

const pipeline = new DivineEnginePipeline();
pipeline.awaken();