/* Pattern: 3D Component - Basic Event Binding */

const { bind3DEvents } = WKit;

// Event schema for 3D
this.customEvents = {
    click: '@3dObjectClicked'
};

// Data mapping (optional - if component needs data)
this.dataMapping = [
    {
        ownerId: this.id,
        visualInstanceList: ['DataVisualizer3D'],
        datasetInfo: {
            datasetName: 'myDataset',
            param: {
                type: 'geometry',
                id: this.id
            }
        }
    }
];

// Bind 3D events
bind3DEvents(this, this.customEvents);

// Note: Event handler is defined in page_loaded.js
// This component just declares what events it emits
