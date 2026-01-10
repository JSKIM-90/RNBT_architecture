/**
 * RNBT Architecture Test Mocks - 통합 인덱스
 *
 * 모든 Mock 모듈을 한 곳에서 import할 수 있습니다.
 *
 * 사용법:
 * const {
 *   Weventbus, createWeventbusMock,
 *   GlobalDataPublisher, createGlobalDataPublisherMock,
 *   Wkit, createWkitMock,
 *   PopupMixin, createPopupMixinMock,
 *   fx,
 *   resetAllMocks
 * } = require('./__mocks__');
 */

const { Weventbus, createWeventbusMock } = require('./Weventbus.mock');
const { GlobalDataPublisher, createGlobalDataPublisherMock } = require('./GlobalDataPublisher.mock');
const { Wkit, createWkitMock } = require('./Wkit.mock');
const { PopupMixin, createPopupMixinMock } = require('./PopupMixin.mock');
const { fx } = require('./fx.mock');

/**
 * 모든 Mock 상태 초기화
 * 테스트 beforeEach에서 호출
 */
function resetAllMocks() {
  Weventbus.__reset();
  GlobalDataPublisher.__reset();
  Wkit.__reset();
  PopupMixin.__reset();
}

/**
 * 의존성 연결 설정
 * Wkit이 Weventbus를 사용하도록 연결
 */
function setupDependencies() {
  Wkit.__setWeventbus(Weventbus);
}

/**
 * 테스트 환경 완전 초기화
 * resetAllMocks + setupDependencies
 */
function initTestEnvironment() {
  resetAllMocks();
  setupDependencies();
}

module.exports = {
  // 싱글톤 Mock 인스턴스
  Weventbus,
  GlobalDataPublisher,
  Wkit,
  PopupMixin,
  fx,

  // Factory 함수 (독립 인스턴스 필요 시)
  createWeventbusMock,
  createGlobalDataPublisherMock,
  createWkitMock,
  createPopupMixinMock,

  // 유틸리티
  resetAllMocks,
  setupDependencies,
  initTestEnvironment,
};
