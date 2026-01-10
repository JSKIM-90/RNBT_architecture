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

    async fetchAndPublish(topic, page, paramUpdates = null) {
      const datasetInfo = mappingTable.get(topic);
      if (!datasetInfo) {
        console.warn(`[GlobalDataPublisher] 등록되지 않은 topic: ${topic}`);
        return;
      }

      // paramUpdates가 있으면 기존 param과 병합 (얕은 병합)
      const param = paramUpdates
        ? { ...datasetInfo.param, ...paramUpdates }
        : datasetInfo.param;

      const subs = subscriberTable.get(topic) || new Set();

      try {
        const data = await Wkit.fetchData(page, datasetInfo.datasetName, param);

        fx.each(({ instance, handler }) => handler.call(instance, data), subs);
      } catch (error) {
        console.error(`[GlobalDataPublisher] ${topic} fetch 실패:`, error);
        throw error;
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
