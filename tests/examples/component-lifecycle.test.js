/**
 * 컴포넌트 라이프사이클 테스트 예제
 *
 * TEST_SCENARIOS.md의 다음 테스트 케이스 검증:
 * - TC-CL-001: 컴포넌트 register 기본 흐름
 * - TC-CL-002: beforeDestroy 리소스 정리
 * - TC-CL-003: register/beforeDestroy 매칭 검증
 */

const {
  Weventbus,
  GlobalDataPublisher,
  Wkit,
  fx,
  initTestEnvironment,
} = require('../__mocks__');

// ─────────────────────────────────────────────────────────────
// 테스트 헬퍼
// ─────────────────────────────────────────────────────────────

/**
 * Mock 컴포넌트 인스턴스 생성
 */
function createMockComponent(id, name) {
  return {
    id,
    name,
    appendElement: {
      addEventListener: function () {},
      removeEventListener: function () {},
      querySelector: function () {
        return null;
      },
    },
    customEvents: null,
    subscriptions: null,
    userHandlerList: null,
  };
}

// ─────────────────────────────────────────────────────────────
// TC-CL-001: 컴포넌트 register 기본 흐름
// ─────────────────────────────────────────────────────────────

function testComponentRegisterFlow() {
  console.log('\n=== TC-CL-001: 컴포넌트 register 기본 흐름 ===\n');
  initTestEnvironment();

  // Given: 컴포넌트 인스턴스
  const component = createMockComponent('comp-001', 'TestComponent');

  // When: register 로직 실행 (실제 register.js 패턴)
  const { subscribe } = GlobalDataPublisher;
  const { bindEvents } = Wkit;
  const { each } = fx;

  // 1. customEvents 정의 및 바인딩
  component.customEvents = {
    click: {
      '.my-button': '@buttonClicked',
      '.my-link': '@linkClicked',
    },
  };
  bindEvents(component, component.customEvents);

  // 2. subscriptions 정의 및 구독
  component.subscriptions = {
    sensorData: ['renderData', 'updateCount'],
  };

  component.renderData = function ({ response }) {
    console.log('renderData called with:', response);
  };
  component.updateCount = function ({ response }) {
    console.log('updateCount called with:', response);
  };

  fx.go(
    Object.entries(component.subscriptions),
    each(([topic, fnList]) =>
      each((fn) => component[fn] && subscribe(topic, component, component[fn]), fnList)
    )
  );

  // Then: 검증
  const results = {
    // 이벤트 바인딩 확인
    bindEventsCalled: Wkit.__wasBindEventsCalled(component),
    customEventsSet: component.customEvents !== null,

    // 구독 등록 확인
    subscriberCount: GlobalDataPublisher.__getSubscriberCount('sensorData'),
    isSubscribed: GlobalDataPublisher.__isSubscribed('sensorData', component),

    // 핸들러 바인딩 확인
    renderDataBound: typeof component.renderData === 'function',
    updateCountBound: typeof component.updateCount === 'function',
  };

  console.log('검증 결과:');
  console.log('- bindEvents 호출됨:', results.bindEventsCalled);
  console.log('- customEvents 설정됨:', results.customEventsSet);
  console.log('- sensorData 구독자 수:', results.subscriberCount);
  console.log('- 컴포넌트 구독 상태:', results.isSubscribed);
  console.log('- renderData 바인딩:', results.renderDataBound);
  console.log('- updateCount 바인딩:', results.updateCountBound);

  const passed =
    results.bindEventsCalled &&
    results.customEventsSet &&
    results.subscriberCount === 2 &&
    results.isSubscribed &&
    results.renderDataBound &&
    results.updateCountBound;

  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-CL-002: beforeDestroy 리소스 정리
// ─────────────────────────────────────────────────────────────

function testBeforeDestroyCleanup() {
  console.log('\n=== TC-CL-002: beforeDestroy 리소스 정리 ===\n');
  initTestEnvironment();

  // Given: register 완료된 컴포넌트
  const component = createMockComponent('comp-002', 'TestComponent');
  const { subscribe, unsubscribe } = GlobalDataPublisher;
  const { bindEvents, removeCustomEvents } = Wkit;
  const { each } = fx;

  // Register
  component.customEvents = {
    click: { '.btn': '@clicked' },
  };
  bindEvents(component, component.customEvents);

  component.subscriptions = { topic1: ['handler1'] };
  component.handler1 = function () {};
  subscribe('topic1', component, component.handler1);

  // When: beforeDestroy 로직 실행
  // 1. 이벤트 제거
  removeCustomEvents(component, component.customEvents);
  component.customEvents = null;

  // 2. 구독 해제
  fx.go(
    Object.entries(component.subscriptions),
    each(([topic, _]) => unsubscribe(topic, component))
  );
  component.subscriptions = null;

  // 3. 핸들러 참조 제거
  component.handler1 = null;

  // Then: 검증
  const results = {
    // 이벤트 제거 확인
    removeEventsCalled: Wkit.__wasRemoveEventsCalled(component),
    customEventsNull: component.customEvents === null,

    // 구독 해제 확인
    stillSubscribed: GlobalDataPublisher.__isSubscribed('topic1', component),
    subscriptionsNull: component.subscriptions === null,

    // 핸들러 제거 확인
    handlerNull: component.handler1 === null,
  };

  console.log('검증 결과:');
  console.log('- removeCustomEvents 호출됨:', results.removeEventsCalled);
  console.log('- customEvents null:', results.customEventsNull);
  console.log('- 여전히 구독 중:', results.stillSubscribed);
  console.log('- subscriptions null:', results.subscriptionsNull);
  console.log('- handler1 null:', results.handlerNull);

  const passed =
    results.removeEventsCalled &&
    results.customEventsNull &&
    !results.stillSubscribed && // 구독 해제되어야 함
    results.subscriptionsNull &&
    results.handlerNull;

  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-CL-003: register/beforeDestroy 매칭 검증
// ─────────────────────────────────────────────────────────────

function testRegisterDestroyMatching() {
  console.log('\n=== TC-CL-003: register/beforeDestroy 매칭 검증 ===\n');
  initTestEnvironment();

  // Given: 컴포넌트
  const component = createMockComponent('comp-003', 'TestComponent');

  // When: 전체 라이프사이클 실행
  // --- Register Phase ---
  const registerState = {};

  component.customEvents = { click: { '.btn': '@clicked' } };
  Wkit.bindEvents(component, component.customEvents);
  registerState.customEvents = { ...component.customEvents };

  component.subscriptions = { topic1: ['fn1'] };
  component.fn1 = function () {};
  GlobalDataPublisher.subscribe('topic1', component, component.fn1);
  registerState.subscriptions = { ...component.subscriptions };

  // --- beforeDestroy Phase ---
  Wkit.removeCustomEvents(component, component.customEvents);
  component.customEvents = null;

  GlobalDataPublisher.unsubscribe('topic1', component);
  component.subscriptions = null;
  component.fn1 = null;

  // Then: 매칭 검증
  const results = {
    // Wkit 매칭 검증
    wkitCleanupVerified: Wkit.__verifyCleanup(component),

    // 등록/해제 히스토리 비교
    bindCount: Wkit.__getBindEventsHistory().filter((h) => h.instance === component).length,
    removeCount: Wkit.__getRemoveEventsHistory().filter((h) => h.instance === component).length,

    subscribeCount: GlobalDataPublisher.__getSubscribeHistory().filter(
      (h) => h.instance === component
    ).length,
    unsubscribeCount: GlobalDataPublisher.__getUnsubscribeHistory().filter(
      (h) => h.instance === component
    ).length,
  };

  console.log('검증 결과:');
  console.log('- Wkit 정리 검증:', results.wkitCleanupVerified);
  console.log('- bindEvents 횟수:', results.bindCount);
  console.log('- removeCustomEvents 횟수:', results.removeCount);
  console.log('- subscribe 횟수:', results.subscribeCount);
  console.log('- unsubscribe 횟수:', results.unsubscribeCount);

  const passed =
    results.wkitCleanupVerified &&
    results.bindCount === results.removeCount &&
    results.subscribeCount === results.unsubscribeCount;

  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// 테스트 실행
// ─────────────────────────────────────────────────────────────

function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        컴포넌트 라이프사이클 테스트                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const results = [];

  results.push({ name: 'TC-CL-001', passed: testComponentRegisterFlow() });
  results.push({ name: 'TC-CL-002', passed: testBeforeDestroyCleanup() });
  results.push({ name: 'TC-CL-003', passed: testRegisterDestroyMatching() });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('                        최종 결과');
  console.log('══════════════════════════════════════════════════════════════');
  results.forEach((r) => {
    console.log(`  ${r.name}: ${r.passed ? 'PASS ✓' : 'FAIL ✗'}`);
  });

  const allPassed = results.every((r) => r.passed);
  console.log(`\n전체: ${allPassed ? 'ALL PASS ✓' : 'SOME FAILED ✗'}`);

  return allPassed;
}

// 직접 실행 시
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  testComponentRegisterFlow,
  testBeforeDestroyCleanup,
  testRegisterDestroyMatching,
  runAllTests,
};
