/*
 * LogViewer Component - beforeDestroy
 * 실시간 로그 뷰어
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each } = fx;

// ======================
// SUBSCRIPTION CLEANUP
// ======================

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// ======================
// EVENT CLEANUP
// ======================

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// ======================
// STATE CLEANUP
// ======================

this._autoScroll = null;

// ======================
// HANDLER CLEANUP
// ======================

this.renderData = null;
this.appendLog = null;
this.clearLogs = null;
this.toggleAutoScroll = null;
