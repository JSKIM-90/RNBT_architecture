/* Pattern: 2D Component - Basic Event Binding */

const { bindEvents } = WKit;

// Event schema
this.customEvents = {
    click: {
        '.my-button': '@buttonClicked',
        '.my-link': '@linkClicked'
    }
};

// Event handlers (bind to this)
this.handleButtonClick = handleButtonClick.bind(this);
this.handleLinkClick = handleLinkClick.bind(this);

// Bind events to DOM
bindEvents(this, this.customEvents);

// Handler functions
function handleButtonClick(data) {
    console.log(`[Button Clicked] ${this.name}`, data);
}

function handleLinkClick(data) {
    console.log(`[Link Clicked] ${this.name}`, data);
}
