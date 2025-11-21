/* Pattern: 3D Component - Basic Event Binding */

const { bind3DEvents } = WKit;

// Event schema
this.customEvents = {
    click: '@3dObjectClicked'
};

// Data source info (optional - if component needs data on interaction)
this.datasetInfo = {
    datasetName: 'myDataset',
    param: {
        type: 'geometry',
        id: this.id
    }
};

// Bind 3D events
bind3DEvents(this, this.customEvents);

// Note: Event handler is defined in page_loaded.js
// Page can use this.datasetInfo to fetch data when event occurs
