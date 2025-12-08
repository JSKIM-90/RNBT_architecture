/*
 * Master - common_component - completed
 * Card Company Dashboard
 * Role: Acts as page loaded (since Master's page script doesn't work)
 *
 * Responsibilities:
 * - Register global data mappings
 * - Fetch and publish initial data
 * - Start auto-refresh intervals
 */

const { each } = fx;

// ======================
// GLOBAL DATA MAPPINGS (Master scope)
// ======================

this.globalDataMappings = [
    // Card info (static - no refresh)
    {
        topic: 'cardInfo',
        datasetInfo: {
            datasetName: 'cardapi',
            param: {}
        }
        // No refreshInterval - fetch once
    },

    // Menu (static - no refresh)
    {
        topic: 'menu',
        datasetInfo: {
            datasetName: 'menuapi',
            param: {}
        }
        // No refreshInterval - fetch once
    },

    // Alerts (refresh: 10s)
    {
        topic: 'alerts',
        datasetInfo: {
            datasetName: 'alertapi',
            param: { type: 'all' }
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
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this.page))
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
                    GlobalDataPublisher.fetchAndPublish(topic, this.page, this.currentParams[topic] || {});
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

console.log('[Master/common_component] completed - data publishing started');
