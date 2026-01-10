/**
 * PopupMixin 테스트 예제
 *
 * TEST_SCENARIOS.md의 다음 테스트 케이스 검증:
 * - TC-PM-001: applyShadowPopupMixin 기본 적용
 * - TC-PM-007: destroyPopup 체이닝 순서
 * - TC-PM-011: applyEChartsMixin 차트 생성
 * - TC-PM-016: applyTabulatorMixin 테이블 생성
 */

const {
  PopupMixin,
  initTestEnvironment,
} = require('../__mocks__');

// ─────────────────────────────────────────────────────────────
// 테스트 헬퍼
// ─────────────────────────────────────────────────────────────

function createMockComponent(id, name) {
  return {
    id,
    name,
    page: {
      appendElement: {
        appendChild: function () {},
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// TC-PM-001: applyShadowPopupMixin 기본 적용
// ─────────────────────────────────────────────────────────────

function testApplyShadowPopupMixin() {
  console.log('\n=== TC-PM-001: applyShadowPopupMixin 기본 적용 ===\n');
  initTestEnvironment();

  // Given: 컴포넌트 인스턴스
  const component = createMockComponent('comp-001', 'TestComponent');
  let onCreatedCalled = false;

  // When: Mixin 적용
  PopupMixin.applyShadowPopupMixin(component, {
    getHTML: () => '<div class="popup-content">Hello</div>',
    getStyles: () => '.popup-content { background: #1a1f2e; }',
    onCreated: (shadowRoot) => {
      onCreatedCalled = true;
    },
  });

  // Then: 메서드 존재 확인
  const results = {
    hasCreatePopup: typeof component.createPopup === 'function',
    hasShowPopup: typeof component.showPopup === 'function',
    hasHidePopup: typeof component.hidePopup === 'function',
    hasPopupQuery: typeof component.popupQuery === 'function',
    hasBindPopupEvents: typeof component.bindPopupEvents === 'function',
    hasDestroyPopup: typeof component.destroyPopup === 'function',
    hasPopupState: component._popup !== undefined,
  };

  console.log('검증 결과:');
  console.log('- createPopup 메서드:', results.hasCreatePopup);
  console.log('- showPopup 메서드:', results.hasShowPopup);
  console.log('- hidePopup 메서드:', results.hasHidePopup);
  console.log('- popupQuery 메서드:', results.hasPopupQuery);
  console.log('- bindPopupEvents 메서드:', results.hasBindPopupEvents);
  console.log('- destroyPopup 메서드:', results.hasDestroyPopup);
  console.log('- _popup 상태 객체:', results.hasPopupState);

  // showPopup 호출하여 onCreated 콜백 확인
  component.showPopup();
  console.log('- onCreated 콜백 호출됨:', onCreatedCalled);

  const passed = Object.values(results).every(Boolean) && onCreatedCalled;
  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-PM-007: destroyPopup 체이닝 순서
// ─────────────────────────────────────────────────────────────

function testDestroyPopupChaining() {
  console.log('\n=== TC-PM-007: destroyPopup 체이닝 순서 ===\n');
  initTestEnvironment();

  // Given: 모든 Mixin 적용된 컴포넌트
  const component = createMockComponent('comp-007', 'FullComponent');

  PopupMixin.applyShadowPopupMixin(component, {
    getHTML: () => '<div></div>',
    getStyles: () => '',
  });
  PopupMixin.applyEChartsMixin(component);
  PopupMixin.applyTabulatorMixin(component);

  // 팝업 생성 및 차트/테이블 추가
  component.showPopup();
  component.createChart('.chart-container');
  component.createTable('.table-container');

  // When: destroyPopup 호출
  component.destroyPopup();

  // Then: 체이닝 순서 검증
  const verification = PopupMixin.__verifyDestroyChaining(component);
  const popupState = PopupMixin.__getPopupState(component);

  console.log('검증 결과:');
  console.log('- 체이닝 순서 유효:', verification.valid);
  if (!verification.valid) {
    console.log('- 실패 원인:', verification.reason);
  }
  console.log('- host 정리됨:', !popupState.hasHost);
  console.log('- shadowRoot 정리됨:', !popupState.hasShadowRoot);
  console.log('- 차트 수:', popupState.chartCount);
  console.log('- 테이블 수:', popupState.tableCount);

  // 히스토리에서 순서 확인
  const chartHistory = PopupMixin.__getChartHistory();
  const tableHistory = PopupMixin.__getTableHistory();
  const popupHistory = PopupMixin.__getPopupHistory();

  const chartDestroyAll = chartHistory.find((h) => h.action === 'destroyAll');
  const tableDestroyAll = tableHistory.find((h) => h.action === 'destroyAll');
  const popupDestroy = popupHistory.find((h) => h.action === 'destroy');

  const orderCorrect =
    chartDestroyAll &&
    tableDestroyAll &&
    popupDestroy &&
    tableDestroyAll.timestamp <= chartDestroyAll.timestamp && // Tabulator 먼저 (역순)
    chartDestroyAll.timestamp <= popupDestroy.timestamp; // 그 다음 ECharts, 마지막 Popup

  console.log('- 정리 순서 올바름:', orderCorrect);

  const passed = verification.valid && !popupState.hasHost && orderCorrect;
  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-PM-011: applyEChartsMixin 차트 생성
// ─────────────────────────────────────────────────────────────

function testEChartsMixin() {
  console.log('\n=== TC-PM-011: applyEChartsMixin 차트 생성 ===\n');
  initTestEnvironment();

  // Given: Shadow Popup + ECharts Mixin 적용
  const component = createMockComponent('comp-011', 'ChartComponent');

  PopupMixin.applyShadowPopupMixin(component, {
    getHTML: () => '<div class="chart-container"></div>',
    getStyles: () => '',
  });
  PopupMixin.applyEChartsMixin(component);

  component.showPopup();

  // When: 차트 생성 및 업데이트
  const chart = component.createChart('.chart-container');
  component.updateChart('.chart-container', {
    xAxis: { data: ['Mon', 'Tue', 'Wed'] },
    series: [{ type: 'line', data: [1, 2, 3] }],
  });

  // Then: 검증
  const retrievedChart = component.getChart('.chart-container');
  const chartHistory = PopupMixin.__getChartHistory();

  const results = {
    chartCreated: chart !== null,
    chartRetrievable: retrievedChart !== null,
    optionSet: retrievedChart?.options !== null,
    createInHistory: chartHistory.some((h) => h.action === 'create'),
    setOptionInHistory: chartHistory.some((h) => h.action === 'setOption'),
  };

  console.log('검증 결과:');
  console.log('- 차트 생성됨:', results.chartCreated);
  console.log('- 차트 조회 가능:', results.chartRetrievable);
  console.log('- 옵션 설정됨:', results.optionSet);
  console.log('- create 히스토리:', results.createInHistory);
  console.log('- setOption 히스토리:', results.setOptionInHistory);

  const passed = Object.values(results).every(Boolean);
  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-PM-016: applyTabulatorMixin 테이블 생성
// ─────────────────────────────────────────────────────────────

function testTabulatorMixin() {
  console.log('\n=== TC-PM-016: applyTabulatorMixin 테이블 생성 ===\n');
  initTestEnvironment();

  // Given: Shadow Popup + Tabulator Mixin 적용
  const component = createMockComponent('comp-016', 'TableComponent');

  PopupMixin.applyShadowPopupMixin(component, {
    getHTML: () => '<div class="table-container"></div>',
    getStyles: () => '',
  });
  PopupMixin.applyTabulatorMixin(component);

  component.showPopup();

  // When: 테이블 생성 및 데이터 설정
  const tableOptions = {
    columns: [
      { title: 'Name', field: 'name' },
      { title: 'Age', field: 'age' },
    ],
  };
  const table = component.createTable('.table-container', tableOptions);

  const testData = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
  ];
  component.updateTable('.table-container', testData);

  // Then: 검증
  const retrievedTable = component.getTable('.table-container');
  const tableHistory = PopupMixin.__getTableHistory();

  const results = {
    tableCreated: table !== null,
    tableRetrievable: retrievedTable !== null,
    dataSet: retrievedTable?.data?.length === 2,
    createInHistory: tableHistory.some((h) => h.action === 'create'),
    setDataInHistory: tableHistory.some((h) => h.action === 'setData'),
  };

  console.log('검증 결과:');
  console.log('- 테이블 생성됨:', results.tableCreated);
  console.log('- 테이블 조회 가능:', results.tableRetrievable);
  console.log('- 데이터 설정됨 (2행):', results.dataSet);
  console.log('- create 히스토리:', results.createInHistory);
  console.log('- setData 히스토리:', results.setDataInHistory);

  const passed = Object.values(results).every(Boolean);
  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-PM-ERR-001: applyShadowPopupMixin 없이 EChartsMixin 적용 시 에러
// ─────────────────────────────────────────────────────────────

function testMixinOrderError() {
  console.log('\n=== TC-PM-ERR-001: Mixin 순서 오류 검증 ===\n');
  initTestEnvironment();

  // Given: Shadow Popup 없는 컴포넌트
  const component = createMockComponent('comp-err', 'ErrorComponent');

  // When: EChartsMixin 먼저 적용 시도
  let errorThrown = false;
  let errorMessage = '';

  try {
    PopupMixin.applyEChartsMixin(component);
  } catch (e) {
    errorThrown = true;
    errorMessage = e.message;
  }

  // Then: 에러 발생 확인
  console.log('검증 결과:');
  console.log('- 에러 발생:', errorThrown);
  console.log('- 에러 메시지:', errorMessage);

  const passed = errorThrown && errorMessage.includes('applyShadowPopupMixin');
  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// 테스트 실행
// ─────────────────────────────────────────────────────────────

function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║               PopupMixin 테스트                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const results = [];

  results.push({ name: 'TC-PM-001', passed: testApplyShadowPopupMixin() });
  results.push({ name: 'TC-PM-007', passed: testDestroyPopupChaining() });
  results.push({ name: 'TC-PM-011', passed: testEChartsMixin() });
  results.push({ name: 'TC-PM-016', passed: testTabulatorMixin() });
  results.push({ name: 'TC-PM-ERR-001', passed: testMixinOrderError() });

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
  testApplyShadowPopupMixin,
  testDestroyPopupChaining,
  testEChartsMixin,
  testTabulatorMixin,
  testMixinOrderError,
  runAllTests,
};
