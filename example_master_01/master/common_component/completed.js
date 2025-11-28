/*
 * Master - common_component - completed
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
    // User info (static - no refresh)
    {
        topic: 'userInfo',
        datasetInfo: {
            datasetName: 'userapi',
            param: {}
        }
        // No refreshInterval - fetch once
    },

    // Notifications (refresh: 5s)
    {
        topic: 'notifications',
        datasetInfo: {
            datasetName: 'notificationapi',
            param: { limit: 5 }
        },
        refreshInterval: 5000
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

console.log('[Master/common_component] completed - data publishing started');
