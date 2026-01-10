/**
 * GlobalDataPublisher 테스트 예제
 *
 * TEST_SCENARIOS.md의 다음 테스트 케이스 검증:
 * - TC-GDP-001: Topic 등록 및 해제
 * - TC-GDP-002: 구독자에게 데이터 발행
 * - TC-GDP-003: 다중 구독자 동시 발행
 */

const {
  GlobalDataPublisher,
  fx,
  initTestEnvironment,
} = require('../__mocks__');

// ─────────────────────────────────────────────────────────────
// 테스트 헬퍼
// ─────────────────────────────────────────────────────────────

function createMockPage(id) {
  return {
    id,
    name: 'TestPage',
    dataService: {
      call: () => ({
        on: () => this,
      }),
    },
  };
}

function createMockComponent(id, name) {
  return { id, name };
}

// ─────────────────────────────────────────────────────────────
// TC-GDP-001: Topic 등록 및 해제
// ─────────────────────────────────────────────────────────────

function testTopicRegistration() {
  console.log('\n=== TC-GDP-001: Topic 등록 및 해제 ===\n');
  initTestEnvironment();

  // Given: 데이터 매핑 정의
  const mappings = [
    {
      topic: 'sensorData',
      datasetInfo: {
        datasetName: 'sensor-api',
        param: { type: 'temperature' },
      },
    },
    {
      topic: 'alertData',
      datasetInfo: {
        datasetName: 'alert-api',
        param: { level: 'critical' },
      },
    },
  ];

  // When: 등록
  mappings.forEach((mapping) => {
    GlobalDataPublisher.registerMapping(mapping);
  });

  // Then: 등록 확인
  const afterRegister = {
    sensorRegistered: GlobalDataPublisher.__isRegistered('sensorData'),
    alertRegistered: GlobalDataPublisher.__isRegistered('alertData'),
    registerHistory: GlobalDataPublisher.__getRegisterHistory().length,
  };

  console.log('등록 후:');
  console.log('- sensorData 등록됨:', afterRegister.sensorRegistered);
  console.log('- alertData 등록됨:', afterRegister.alertRegistered);
  console.log('- 등록 기록 수:', afterRegister.registerHistory);

  // When: 해제
  GlobalDataPublisher.unregisterMapping('sensorData');
  GlobalDataPublisher.unregisterMapping('alertData');

  // Then: 해제 확인
  const afterUnregister = {
    sensorRegistered: GlobalDataPublisher.__isRegistered('sensorData'),
    alertRegistered: GlobalDataPublisher.__isRegistered('alertData'),
    unregisterHistory: GlobalDataPublisher.__getUnregisterHistory().length,
  };

  console.log('\n해제 후:');
  console.log('- sensorData 등록됨:', afterUnregister.sensorRegistered);
  console.log('- alertData 등록됨:', afterUnregister.alertRegistered);
  console.log('- 해제 기록 수:', afterUnregister.unregisterHistory);

  const passed =
    afterRegister.sensorRegistered &&
    afterRegister.alertRegistered &&
    !afterUnregister.sensorRegistered &&
    !afterUnregister.alertRegistered &&
    afterUnregister.unregisterHistory === 2;

  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-GDP-002: 구독자에게 데이터 발행
// ─────────────────────────────────────────────────────────────

async function testDataPublishing() {
  console.log('\n=== TC-GDP-002: 구독자에게 데이터 발행 ===\n');
  initTestEnvironment();

  // Given: 컴포넌트가 topic 구독
  const page = createMockPage('page-001');
  const component = createMockComponent('comp-001', 'SensorDisplay');

  let receivedData = null;
  const handler = ({ response }) => {
    receivedData = response;
  };

  GlobalDataPublisher.registerMapping({
    topic: 'sensorData',
    datasetInfo: { datasetName: 'sensor-api', param: {} },
  });
  GlobalDataPublisher.subscribe('sensorData', component, handler);

  // When: Mock 응답 설정 및 발행
  const mockResponse = {
    data: {
      temperature: 25.5,
      humidity: 60,
      timestamp: Date.now(),
    },
  };
  GlobalDataPublisher.__setMockResponse('sensorData', mockResponse);

  await GlobalDataPublisher.fetchAndPublish('sensorData', page, {});

  // Then: 검증
  const results = {
    dataReceived: receivedData !== null,
    correctData: receivedData?.data?.temperature === 25.5,
    publishHistory: GlobalDataPublisher.__getPublishHistory().length,
    wasPublished: GlobalDataPublisher.__wasPublished('sensorData'),
  };

  console.log('검증 결과:');
  console.log('- 데이터 수신됨:', results.dataReceived);
  console.log('- 올바른 데이터:', results.correctData);
  console.log('- 발행 히스토리 수:', results.publishHistory);
  console.log('- sensorData 발행됨:', results.wasPublished);

  const passed = Object.values(results).every(Boolean);
  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-GDP-003: 다중 구독자 동시 발행
// ─────────────────────────────────────────────────────────────

async function testMultipleSubscribers() {
  console.log('\n=== TC-GDP-003: 다중 구독자 동시 발행 ===\n');
  initTestEnvironment();

  // Given: 여러 컴포넌트가 같은 topic 구독
  const page = createMockPage('page-002');
  const comp1 = createMockComponent('comp-001', 'SensorCard');
  const comp2 = createMockComponent('comp-002', 'SensorChart');
  const comp3 = createMockComponent('comp-003', 'SensorTable');

  const receivedBy = {
    comp1: null,
    comp2: null,
    comp3: null,
  };

  GlobalDataPublisher.registerMapping({
    topic: 'sharedTopic',
    datasetInfo: { datasetName: 'shared-api', param: {} },
  });

  GlobalDataPublisher.subscribe('sharedTopic', comp1, ({ response }) => {
    receivedBy.comp1 = response;
  });
  GlobalDataPublisher.subscribe('sharedTopic', comp2, ({ response }) => {
    receivedBy.comp2 = response;
  });
  GlobalDataPublisher.subscribe('sharedTopic', comp3, ({ response }) => {
    receivedBy.comp3 = response;
  });

  // When: Mock 응답 설정 및 발행
  const mockResponse = { data: { value: 100 } };
  GlobalDataPublisher.__setMockResponse('sharedTopic', mockResponse);

  await GlobalDataPublisher.fetchAndPublish('sharedTopic', page);

  // Then: 모든 구독자가 수신했는지 검증
  const results = {
    comp1Received: receivedBy.comp1?.data?.value === 100,
    comp2Received: receivedBy.comp2?.data?.value === 100,
    comp3Received: receivedBy.comp3?.data?.value === 100,
    subscriberCount: GlobalDataPublisher.__getSubscriberCount('sharedTopic'),
    publishCount: GlobalDataPublisher.__getPublishCount('sharedTopic'),
  };

  console.log('검증 결과:');
  console.log('- comp1 수신:', results.comp1Received);
  console.log('- comp2 수신:', results.comp2Received);
  console.log('- comp3 수신:', results.comp3Received);
  console.log('- 총 구독자 수:', results.subscriberCount);
  console.log('- 발행 횟수:', results.publishCount);

  const passed =
    results.comp1Received &&
    results.comp2Received &&
    results.comp3Received &&
    results.subscriberCount === 3;

  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// TC-GDP-004: 구독 해제 후 발행 시 수신 안 됨
// ─────────────────────────────────────────────────────────────

async function testUnsubscribeStopsReceiving() {
  console.log('\n=== TC-GDP-004: 구독 해제 후 수신 중단 ===\n');
  initTestEnvironment();

  // Given: 구독 중인 컴포넌트
  const page = createMockPage('page-003');
  const component = createMockComponent('comp-001', 'TestComponent');

  let receiveCount = 0;
  GlobalDataPublisher.registerMapping({
    topic: 'testTopic',
    datasetInfo: { datasetName: 'test-api', param: {} },
  });
  GlobalDataPublisher.subscribe('testTopic', component, () => {
    receiveCount++;
  });
  GlobalDataPublisher.__setMockResponse('testTopic', { data: {} });

  // When: 첫 번째 발행
  await GlobalDataPublisher.fetchAndPublish('testTopic', page);
  const countAfterFirst = receiveCount;

  // When: 구독 해제 후 두 번째 발행
  GlobalDataPublisher.unsubscribe('testTopic', component);
  await GlobalDataPublisher.fetchAndPublish('testTopic', page);
  const countAfterSecond = receiveCount;

  // Then: 검증
  const results = {
    receivedFirst: countAfterFirst === 1,
    notReceivedAfterUnsub: countAfterSecond === 1, // 여전히 1이어야 함
    isStillSubscribed: GlobalDataPublisher.__isSubscribed('testTopic', component),
  };

  console.log('검증 결과:');
  console.log('- 첫 번째 발행 수신:', results.receivedFirst);
  console.log('- 해제 후 수신 안 됨:', results.notReceivedAfterUnsub);
  console.log('- 여전히 구독 중:', results.isStillSubscribed);

  const passed =
    results.receivedFirst && results.notReceivedAfterUnsub && !results.isStillSubscribed;

  console.log('\n결과:', passed ? 'PASS ✓' : 'FAIL ✗');
  return passed;
}

// ─────────────────────────────────────────────────────────────
// 테스트 실행
// ─────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           GlobalDataPublisher 테스트                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const results = [];

  results.push({ name: 'TC-GDP-001', passed: testTopicRegistration() });
  results.push({ name: 'TC-GDP-002', passed: await testDataPublishing() });
  results.push({ name: 'TC-GDP-003', passed: await testMultipleSubscribers() });
  results.push({ name: 'TC-GDP-004', passed: await testUnsubscribeStopsReceiving() });

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
  runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  testTopicRegistration,
  testDataPublishing,
  testMultipleSubscribers,
  testUnsubscribeStopsReceiving,
  runAllTests,
};
