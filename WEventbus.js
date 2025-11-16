const WEventBus = (() => {
  // controller
  const listeners = new Map();

  return {
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(callback);
    },

    off(event, callback) {
      if (!listeners.has(event)) return;
      const newList = listeners.get(event).filter((cb) => cb !== callback);
      listeners.set(event, newList);
    },

    emit(event, data) {
      if (!listeners.has(event)) return;
      for (const callback of listeners.get(event)) {
        callback(data);
      }
    },

    once(event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    },
  };
})();
