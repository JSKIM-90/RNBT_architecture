const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
    this.customEvents = getCustomEvents.call(this);
    bindEvents(this, this.customEvents);
}

function getCustomEvents() {
    return {
        click: {
            '.nav-link': '@navLinkClicked'
        }
    };
}
