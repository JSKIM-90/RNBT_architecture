/*
 * Page - loaded
 * Basic single page structure (no Master layer)
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
    // Sensor data (refresh: 5s)
    {
        topic: 'sensors',
        datasetInfo: {
            datasetName: 'iotSensors',
            param: {}
        },
        refreshInterval: 5000
    },

    // Active alerts (refresh: 5s)
    {
        topic: 'alerts',
        datasetInfo: {
            datasetName: 'iotAlerts',
            param: {}
        },
        refreshInterval: 5000
    },

    // 24h trend data (refresh: 60s)
    {
        topic: 'trend',
        datasetInfo: {
            datasetName: 'iotTrend',
            param: {}
        },
        refreshInterval: 60000
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
