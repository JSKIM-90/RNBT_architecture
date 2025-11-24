const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Remove event listeners
    removeCustomEvents(this, this.customEvents);

    // Clear references
    this.customEvents = null;
}
