/*
 * Page - loaded
 * Card Company Dashboard
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
    // Summary (refresh: 30s)
    {
        topic: 'summary',
        datasetInfo: {
            datasetName: 'summaryapi',
            param: {}
        },
        refreshInterval: 30000
    },

    // Transactions (refresh: 30s, with pagination)
    {
        topic: 'transactions',
        datasetInfo: {
            datasetName: 'transactionapi',
            param: { page: 1, pageSize: 10, category: 'all' }
        },
        refreshInterval: 30000
    },

    // Spending chart (refresh: 60s)
    {
        topic: 'spending',
        datasetInfo: {
            datasetName: 'spendingapi',
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
