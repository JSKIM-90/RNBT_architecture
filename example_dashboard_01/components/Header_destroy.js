/* Component: Header - Cleanup */

const { removeCustomEvents } = WKit;
const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Unsubscribe from topics
    if (this.subscriptions) {
        fx.go(
            Object.entries(this.subscriptions),
            each(([topic, _]) => unsubscribe(topic, this))
        );
    }

    // Remove event listeners
    removeCustomEvents(this, this.customEvents);

    // Clear references
    this.subscriptions = null;
    this.customEvents = null;
    this.handlePeriodFilter = null;
    this.handleUserProfile = null;
    this.handleNotification = null;
    this.handleNotificationDismiss = null;
    this.renderUserInfo = null;
    this.renderNotifications = null;
}
