/* Page Lifecycle: loaded
 * Purpose: Register global data mappings and fetch initial data
 * Note: This runs after all components have completed their register phase
 */

const { each } = fx;

// ======================
// GLOBAL DATA MAPPINGS
// ======================

// Define what data topics this page will publish
// Each topic can be subscribed by multiple components
this.globalDataMappings = [
    // Real-time sales data (refresh every 5 seconds)
    {
        topic: 'salesData',
        datasetInfo: {
            datasetName: 'salesapi',
            param: {
                endpoint: '/api/sales/realtime',
                period: '24h'
            }
        },
        refreshInterval: 5000  // 5 seconds
    },

    // Sales statistics (refresh every 15 seconds)
    {
        topic: 'salesStats',
        datasetInfo: {
            datasetName: 'salesapi',
            param: {
                endpoint: '/api/sales/stats',
                period: '24h'
            }
        },
        refreshInterval: 15000  // 15 seconds
    },

    // Product list (static data - fetch once)
    {
        topic: 'productList',
        datasetInfo: {
            datasetName: 'productapi',
            param: {
                endpoint: '/api/products/list',
                limit: 50
            }
        }
        // No refreshInterval - static data, fetch once only
    }
];

// ======================
// REGISTER & PUBLISH
// ======================

// Initialize param storage (for dynamic param updates)
this.currentParams = {};

// Register all mappings and fetch initial data (chaining pattern)
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),           // 1. Register
    each(({ topic }) => this.currentParams[topic] = {}), // 2. Init params
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this)) // 3. Fetch
);

// ======================
// INTERVAL MANAGEMENT
// ======================

// Start all refresh intervals (each topic has its own interval)
this.startAllIntervals = () => {
    this.refreshIntervals = {};  // Store interval IDs for cleanup

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            // Only set interval if refreshInterval is defined
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    // Pass currentParams to support dynamic param updates
                    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
                }, refreshInterval);

                console.log(`[Page] Started auto-refresh for topic '${topic}' (${refreshInterval}ms)`);
            }
        })
    );
};

// Stop all refresh intervals
this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );

    console.log('[Page] Stopped all refresh intervals');
};

// Start auto-refresh for all topics
this.startAllIntervals();

// Note: All components that subscribed to these topics
// will automatically receive the data on every refresh
