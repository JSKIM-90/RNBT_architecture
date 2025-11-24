const { onEventBusHandlers } = WKit;

// Setup event bus handlers
this.eventBusHandlers = {
    '@periodChanged': async ({ event, targetInstance }) => {
        console.log('[Page] Period changed:', event.target.value);
        // Re-fetch data with new period filter
        const period = event.target.value;
        // Could update GlobalDataPublisher params here
        // GlobalDataPublisher.fetchAndPublish('salesData', this, { period });
    },

    '@notificationClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Notification clicked');
        // Handle notification display
    },

    '@userProfileClicked': async ({ event, targetInstance }) => {
        console.log('[Page] User profile clicked');
        // Handle user profile menu
    },

    '@navLinkClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Nav link clicked:', event.target.dataset.page);
        // Handle navigation
        event.preventDefault();

        // Update active state
        const navItems = targetInstance.element.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        event.target.closest('.nav-item').classList.add('active');
    },

    '@productEditClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Product edit clicked:', event.target.dataset.productId);
        // Handle product edit
    },

    '@productDeleteClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Product delete clicked:', event.target.dataset.productId);
        // Handle product delete
    },

    '@addProductClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Add product clicked');
        // Handle add product
    },

    '@paginationClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Pagination clicked:', event.target.textContent);
        // Handle pagination
    },

    '@searchInputChanged': async ({ event, targetInstance }) => {
        console.log('[Page] Search input changed:', event.target.value);
        // Handle search
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);
