const { openSocket } = GlobalDataPublisher;

// WebSocket 연결 열기
fx.each(({ topic }) => openSocket(topic), this.socketMappings);
