/* Pattern: 2D Component - Cleanup (Basic) */

const { removeCustomEvents } = WKit;

// Remove event listeners
removeCustomEvents(this, this.customEvents);

// Clear references
this.customEvents = null;
this.handleButtonClick = null;
this.handleLinkClick = null;
