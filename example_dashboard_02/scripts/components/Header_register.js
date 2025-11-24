const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
    this.customEvents = getCustomEvents.call(this);
    bindEvents(this, this.customEvents);
}

function getCustomEvents() {
    return {
        change: {
            '.period-select': '@periodChanged'
        },
        click: {
            '.notification-icon': '@notificationClicked',
            '.user-profile': '@userProfileClicked'
        }
    };
}
