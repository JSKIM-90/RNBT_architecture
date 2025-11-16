const GlobalDataPublisher = (() => {
  const mappingTable = new Map();
  const subscriberTable = new Map();

  return {
    registerMapping({ topic, datasetInfo }) {
      mappingTable.set(topic, datasetInfo);
      return {
        topic,
        datasetInfo,
      };
    },

    unregisterMapping(topic) {
      mappingTable.delete(topic);
    },

    async fetchAndPublish(topic, page) {
      const datasetInfo = mappingTable.get(topic);
      if (!datasetInfo) {
        console.warn(`[GlobalDataPublisher] 등록되지 않은 topic: ${topic}`);
        return;
      }

      const data = await WKit.fetchData(page, datasetInfo.datasetName, datasetInfo.param);
      const subs = subscriberTable.get(topic) || new Set();

      for (const { instance, handler } of subs) {
        handler.call(instance, data);
      }
    },

    subscribe(topic, instance, handler) {
      if (!subscriberTable.has(topic)) subscriberTable.set(topic, new Set());
      subscriberTable.get(topic).add({ instance, handler });
    },

    unsubscribe(topic, instance) {
      const subs = subscriberTable.get(topic);
      if (!subs) return;
      for (const sub of subs) {
        if (sub.instance === instance) subs.delete(sub);
      }
    },
    getGlobalMappingSchema({
      topic = 'weather',
      datasetInfo = {
        datasetName: 'dummyjson',
        param: { dataType: 'weather', id: 'default' },
      },
    } = {}) {
      return {
        topic,
        datasetInfo,
      };
    },
  };
})();
