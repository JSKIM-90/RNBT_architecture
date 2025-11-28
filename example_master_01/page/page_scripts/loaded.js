/*
 * Page - loaded
 * Normal page area (NOT Master)
 *
 * Responsibilities:
 * - Register global data mappings (Page scope)
 * - Fetch and publish initial data
 * - Start auto-refresh intervals
 */

const { each } = fx;

// ======================
// GLOBAL DATA MAPPINGS (Page scope)
// ======================

this.globalDataMappings = [
    // Stats (refresh: 10s)
    {
        topic: 'stats',
        datasetInfo: {
            datasetName: 'statsapi',
            param: { period: '24h' }
        },
        refreshInterval: 10000
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

// Start auto-refresh
this.startAllIntervals();

console.log('[Page] loaded - data publishing started');
