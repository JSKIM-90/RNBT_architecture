const { each } = fx;

// ======================
// GLOBAL DATA MAPPINGS
// ======================

// Define what data topics this page will publish
// Each topic can be subscribed by multiple components
this.globalDataMappings = [
    // Sample: Real-time sensor data (refresh: 5s)
    {
        topic: 'sensorData',
        datasetInfo: {
            datasetName: 'iotapi',
            param: {
                endpoint: '/api/iot/realtime/sensors/current'
            }
        },
        refreshInterval: 5000  // 5 seconds
    },

    // Sample: Device status (refresh: 15s)
    {
        topic: 'deviceStatus',
        datasetInfo: {
            datasetName: 'iotapi',
            param: {
                endpoint: '/api/iot/shortterm/devices/status'
            }
        },
        refreshInterval: 15000  // 15 seconds
    }

    // Add more data topics here as needed
    // {
    //     topic: 'alerts',
    //     datasetInfo: {
    //         datasetName: 'iotapi',
    //         param: {
    //             endpoint: '/api/iot/realtime/alerts/active'
    //         }
    //     },
    //     refreshInterval: 5000  // 5 seconds
    // },
    // {
    //     topic: 'trends',
    //     datasetInfo: {
    //         datasetName: 'iotapi',
    //         param: {
    //             endpoint: '/api/iot/midterm/sensors/trend/24h'
    //         }
    //     },
    //     refreshInterval: 60000  // 60 seconds
    // },
    // {
    //     topic: 'deviceList',
    //     datasetInfo: {
    //         datasetName: 'iotapi',
    //         param: {
    //             endpoint: '/api/iot/static/devices/list'
    //         }
    //     }
    //     // No refreshInterval - static data, fetch once only
    // }
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
};

// Start auto-refresh for all topics
this.startAllIntervals();

// Note: All components that subscribed to these topics
// will automatically receive the data on every refresh
