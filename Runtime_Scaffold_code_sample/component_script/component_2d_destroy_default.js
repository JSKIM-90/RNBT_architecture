 const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    removeCustomEvents(this, this.customEvents);
};