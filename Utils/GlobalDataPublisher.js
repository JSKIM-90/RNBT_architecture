const GlobalDataPublisher = (() => {
  const mappingTable = new Map();
  const socketTable = new Map();
  const subscriberTable = new Map();

  // ========== Internal ==========
  function notifySubscribers(topic, data) {
    const subs = subscriberTable.get(topic);
    if (!subs) return;

    for (const { instance, handler } of subs) {
      try {
        handler.call(instance, data);
      } catch (error) {
        console.error(`[GlobalDataPublisher] Subscriber error (${topic}):`, error);
      }
    }
  }

  function buildSocketUrl(url, param) {
    if (!param || Object.keys(param).length === 0) return url;
    const queryString = new URLSearchParams(param).toString();
    return `${url}?${queryString}`;
  }

  function connectSocket(topic, param) {
    const socketInfo = socketTable.get(topic);
    if (!socketInfo) return;

    const { url, options } = socketInfo;
    const { protocols, reconnect, reconnectInterval, maxReconnectAttempts, transform } = options;

    // param 병합 후 URL 생성
    const mergedParam = param
      ? { ...socketInfo.param, ...param }
      : socketInfo.param;
    const fullUrl = buildSocketUrl(url, mergedParam);

    const ws = new WebSocket(fullUrl, protocols);

    ws.onopen = () => {
      console.log(`[GlobalDataPublisher] Socket connected: ${topic}`);
      socketInfo.reconnectAttempts = 0;
      socketInfo.currentParam = mergedParam; // 재연결용 저장
    };

    ws.onmessage = (event) => {
      try {
        const data = transform(event.data);
        notifySubscribers(topic, data);
      } catch (error) {
        console.error(`[GlobalDataPublisher] Transform error (${topic}):`, error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[GlobalDataPublisher] Socket error (${topic}):`, error);
    };

    ws.onclose = (event) => {
      console.log(`[GlobalDataPublisher] Socket closed (${topic}):`, event.code);

      if (reconnect && socketTable.has(topic)) {
        scheduleReconnect(topic);
      }
    };

    socketInfo.ws = ws;
  }

  function scheduleReconnect(topic) {
    const socketInfo = socketTable.get(topic);
    if (!socketInfo) return;

    const { options, currentParam } = socketInfo;
    const { reconnectInterval, maxReconnectAttempts } = options;

    if (maxReconnectAttempts > 0 && socketInfo.reconnectAttempts >= maxReconnectAttempts) {
      console.error(`[GlobalDataPublisher] Max reconnect attempts reached: ${topic}`);
      return;
    }

    socketInfo.reconnectAttempts++;
    console.log(`[GlobalDataPublisher] Reconnecting (${socketInfo.reconnectAttempts}/${maxReconnectAttempts || '∞'}): ${topic}`);

    socketInfo.reconnectTimer = setTimeout(() => {
      connectSocket(topic, currentParam);
    }, reconnectInterval);
  }

  return {
    // ========== HTTP API ==========
    registerMapping({ topic, datasetInfo }) {
      mappingTable.set(topic, datasetInfo);
      return { topic, datasetInfo };
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

      const param = paramUpdates
        ? { ...datasetInfo.param, ...paramUpdates }
        : datasetInfo.param;

      const subs = subscriberTable.get(topic) || new Set();

      try {
        const data = await WKit.fetchData(page, datasetInfo.datasetName, param);

        for (const { instance, handler } of subs) {
          handler.call(instance, data);
        }
      } catch (error) {
        console.error(`[GlobalDataPublisher] ${topic} fetch 실패:`, error);
        throw error;
      }
    },

    // ========== Subscribe API (공유) ==========
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

    // ========== WebSocket API ==========
    registerSocket({ topic, url, param = {}, options = {} }) {
      const defaultOptions = {
        protocols: [],
        reconnect: true,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        transform: (data) => JSON.parse(data),
      };

      socketTable.set(topic, {
        url,
        param,
        options: { ...defaultOptions, ...options },
        ws: null,
        reconnectAttempts: 0,
        reconnectTimer: null,
        currentParam: null,
      });

      return { topic, url };
    },

    openSocket(topic, paramUpdates = null) {
      const socketInfo = socketTable.get(topic);
      if (!socketInfo) {
        console.warn(`[GlobalDataPublisher] 등록되지 않은 socket topic: ${topic}`);
        return;
      }

      // 이미 연결된 경우 무시
      if (socketInfo.ws && socketInfo.ws.readyState === WebSocket.OPEN) {
        console.warn(`[GlobalDataPublisher] Socket already open: ${topic}`);
        return;
      }

      connectSocket(topic, paramUpdates);
    },

    closeSocket(topic) {
      const socketInfo = socketTable.get(topic);
      if (!socketInfo) return;

      // 재연결 타이머 정리
      if (socketInfo.reconnectTimer) {
        clearTimeout(socketInfo.reconnectTimer);
      }

      // WebSocket 연결 종료
      if (socketInfo.ws) {
        socketInfo.ws.onclose = null; // 재연결 방지
        socketInfo.ws.close();
      }

      socketTable.delete(topic);
    },

    // ========== Schema ==========
    getGlobalMappingSchema({
      topic = 'weather',
      datasetInfo = {
        datasetName: 'dummyjson',
        param: { dataType: 'weather', id: 'default' },
      },
    } = {}) {
      return { topic, datasetInfo };
    },

    getSocketMappingSchema({
      topic = 'realtime',
      url = 'ws://localhost:3000',
      param = {},
      options = {},
    } = {}) {
      return { topic, url, param, options };
    },
  };
})();
