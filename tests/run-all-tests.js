/**
 * RNBT Architecture Test Runner
 *
 * 모든 테스트 예제를 순차적으로 실행합니다.
 *
 * 사용법:
 *   node tests/run-all-tests.js
 */

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                   ║');
  console.log('║            RNBT Architecture Test Suite                           ║');
  console.log('║                                                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log();

  const suites = [
    {
      name: 'Component Lifecycle Tests',
      module: './examples/component-lifecycle.test',
    },
    {
      name: 'GlobalDataPublisher Tests',
      module: './examples/global-data-publisher.test',
    },
    {
      name: 'PopupMixin Tests',
      module: './examples/popup-mixin.test',
    },
  ];

  const results = [];

  for (const suite of suites) {
    console.log(`\n${'─'.repeat(67)}`);
    console.log(`  ${suite.name}`);
    console.log(`${'─'.repeat(67)}`);

    try {
      const testModule = require(suite.module);
      const passed = await testModule.runAllTests();
      results.push({ name: suite.name, passed, error: null });
    } catch (error) {
      console.error(`\nError running ${suite.name}:`, error.message);
      results.push({ name: suite.name, passed: false, error: error.message });
    }
  }

  // 최종 결과
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        FINAL RESULTS                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log();

  let allPassed = true;
  results.forEach((r) => {
    const status = r.passed ? 'PASS ✓' : 'FAIL ✗';
    console.log(`  ${r.name}: ${status}`);
    if (r.error) {
      console.log(`    └─ Error: ${r.error}`);
    }
    if (!r.passed) allPassed = false;
  });

  console.log();
  console.log('═'.repeat(67));
  if (allPassed) {
    console.log('  ALL TEST SUITES PASSED ✓');
  } else {
    console.log('  SOME TEST SUITES FAILED ✗');
  }
  console.log('═'.repeat(67));

  return allPassed;
}

// 직접 실행 시
if (require.main === module) {
  runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests };
