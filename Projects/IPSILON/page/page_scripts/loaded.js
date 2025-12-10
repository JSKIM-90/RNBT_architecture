/*
 * Page - loaded
 * IPSILON Temperature Monitoring Dashboard
 *
 * Responsibilities:
 * - Register global data mappings
 * - Fetch and publish initial data
 * - Start 15-second auto-refresh
 */

const { each } = fx;

// ======================
// GLOBAL DATA MAPPINGS
// ======================

this.globalDataMappings = [
    // Temperature sensors (refresh: 15s)
    {
        topic: 'temperatureSensors',
        datasetInfo: {
            datasetName: 'temperatureSensors',
            param: {}
        },
        refreshInterval: 15000
    }
];

// ======================
// REGISTER & PUBLISH
// ======================

this.currentParams = {};

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => this.currentParams[topic] = {}),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// ======================
// INTERVAL MANAGEMENT
// ======================

this.startAllIntervals = () => {
    this.refreshIntervals = {};

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
                    console.log(`[Page] Auto-refresh: ${topic}`);
                }, refreshInterval);
            }
        })
    );
};

this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

// Start auto-refresh (15 seconds)
this.startAllIntervals();

console.log('[Page] loaded - data publishing started (15s refresh)');
