/* Page Lifecycle: before_load
 * Purpose: Setup event handlers and Three.js raycasting before components are created
 */

const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

// Define event handlers that will respond to component events
this.eventBusHandlers = {
    // Header: Period filter changed
    '@periodFilterChanged': ({ event }) => {
        const period = event.target.value;  // '24h', '7d', '30d'
        console.log('[Page] Period filter changed to:', period);

        // Update all topics with new period parameter
        fx.go(
            this.globalDataMappings,
            fx.each(({ topic }) => {
                // Merge new period with existing params
                this.currentParams[topic] = {
                    ...this.currentParams[topic],
                    period
                };

                // Immediate fetch with updated params
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
            })
        );
    },

    // Header: User profile clicked
    '@userProfileClicked': ({ event, targetInstance }) => {
        console.log('[Page] User profile clicked:', targetInstance.name);
        // Show user profile modal/panel
    },

    // Header: Notification clicked
    '@notificationClicked': ({ event, targetInstance }) => {
        console.log('[Page] Notification clicked:', targetInstance.name);
        // Show notification panel
    },

    // Sidebar: Navigation clicked (all nav events use same pattern)
    '@navDashboardClicked': ({ event }) => {
        console.log('[Page] Dashboard nav clicked');
        // Navigate to dashboard page
    },

    '@navProductsClicked': ({ event }) => {
        console.log('[Page] Products nav clicked');
        // Navigate to products page
    },

    '@navAnalyticsClicked': ({ event }) => {
        console.log('[Page] Analytics nav clicked');
        // Navigate to analytics page
    },

    '@navSettingsClicked': ({ event }) => {
        console.log('[Page] Settings nav clicked');
        // Navigate to settings page
    },

    // ProductList: Product selected
    '@productSelected': async ({ event, targetInstance }) => {
        const { index, productId } = event.target.closest('.product-row').dataset;
        console.log('[Page] Product selected:', productId);

        // Fetch product details
        const productDetails = await fetchData(this, 'productDetails', { id: productId });
        console.log('[Page] Product details fetched:', productDetails);

        // Show product detail panel or navigate to detail page
        // Example: Update 3D viewer to highlight the selected product
    },

    // ProductList: Product delete clicked
    '@productDeleteClicked': async ({ event, targetInstance }) => {
        const { index } = event.target.dataset;
        const product = targetInstance.products[index];
        console.log('[Page] Delete requested for:', product);

        // Show confirmation dialog
        // If confirmed, delete product via API
    },

    // Product3DViewer: 3D object clicked
    '@product3DClicked': async ({ event, targetInstance }) => {
        console.log('[Page] 3D product clicked:', event);

        // Primitive composition: Extract datasetInfo from component
        const { datasetInfo } = targetInstance;

        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;

            // Get clicked object info from raycasting event
            const intersect = event.intersects?.[0];
            if (intersect) {
                const productId = intersect.object.userData.productId;

                // Fetch product details using WKit primitive
                const productData = await fetchData(this, datasetName, {
                    ...param,
                    productId
                });

                console.log('[Page] 3D product data fetched:', productData);

                // Show product detail panel
                // Update other components with selected product
            }
        }
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// ======================
// THREE.JS RAYCASTING (for 3D components)
// ======================

const canvas = this.element.querySelector('canvas');
if (canvas) {
    this.raycastingEvents = [
        { type: 'click' }
        // { type: 'mousemove' },  // Add more events as needed
        // { type: 'dblclick' }
    ];

    fx.go(
        this.raycastingEvents,
        fx.each(event => {
            event.handler = initThreeRaycasting(canvas, event.type);
        })
    );
}
