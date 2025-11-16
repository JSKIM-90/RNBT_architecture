const { go, L } = fx;
const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
    this.customEvents = getCustomEvents.call(this);
    this.myMethod = myMethod.bind(this);
    bindEvents(this, this.customEvents);
};

function getCustomEvents() {
    return {
        click: {
            [`selector`]: '@myEvent'
        }
    }
};

function myMethod(data) {
    console.log(`[myMethod] ${this.name}`, data);
};

