/**
 * 测试脚本 — 用Carrie的八字跑一遍完整流程
 *
 * 用法：
 * CLAUDE_API_KEY=你的key node test.js
 *
 * 或者不带key跑本地计算测试（不生成AI报告）：
 * node test.js --local
 */

const { orchestrate } = require('./src/orchestrator');
const { runBaziAgent } = require('./src/agents/baziAgent');
const { runLiuNianAgent } = require('./src/agents/liuNianAgent');
const { runScenarioAgent } = require('./src/agents/scenarioAgent');

const isLocal = process.argv.includes('--local');
const apiKey = process.env.CLAUDE_API_KEY;

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     八字AI引擎 — Agentic System     ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ======= 测试1: 本地Agent测试（不需要API） =======
  console.log('=== 测试1: 排盘Agent ===');
  const carrie = runBaziAgent({
    year: 2000, month: 3, day: 11, hour: 9, minute: 10,
    birthCity: '郴州', gender: 'female',
  });
  console.log('Carrie八字:', carrie.fourPillars.year.ganZhi, carrie.fourPillars.month.ganZhi, carrie.fourPillars.day.ganZhi, carrie.fourPillars.hour.ganZhi);
  console.log('日主:', carrie.dayMaster, `(${carrie.dayMasterElement})`);
  console.log('身强/弱:', carrie.strength);
  console.log('喜用神:', carrie.xiyong.join(', '));
  console.log('五行:', JSON.stringify(carrie.wuxing));
  console.log('真太阳时:', carrie.input.trueSolarTime);
  console.log('');

  // ======= 测试2: 流年Agent =======
  console.log('=== 测试2: 流年Agent ===');
  const liuNian = runLiuNianAgent(carrie);
  console.log('当前大运:', liuNian.currentDaYun.ganZhi, `(${liuNian.currentDaYun.period})`);
  console.log('关键年份:');
  for (const ky of liuNian.keyYears) {
    console.log(`  ${ky.year}年 ${ky.ganZhi} [重要度:${ky.importance}/10] ${ky.events.join('; ')}`);
  }
  console.log('');

  // ======= 测试3: 场景Agent =======
  console.log('=== 测试3: 场景Agent ===');
  const scenario = runScenarioAgent({
    scenarioId: 'ai-replace',
    userContext: '我在硅谷做市场数据分析，自己开了公司年入11万美元，但担心AI会替代我的工作',
    baziData: carrie,
  });
  console.log('场景:', scenario.scenario.title.zh);
  console.log('解读框架:', scenario.scenario.framework);
  console.log('分析重点:');
  scenario.promptInstructions.keyQuestions.forEach((q, i) => console.log(`  ${i+1}. ${q}`));
  console.log('');

  // ======= 测试4: 宇航排盘 =======
  console.log('=== 测试4: 宇航排盘 ===');
  const yuhang = runBaziAgent({
    year: 1991, month: 11, day: 7, hour: 4, minute: 8,
    birthCity: '大庆', gender: 'male',
  });
  console.log('宇航八字:', yuhang.fourPillars.year.ganZhi, yuhang.fourPillars.month.ganZhi, yuhang.fourPillars.day.ganZhi, yuhang.fourPillars.hour.ganZhi);
  console.log('日主:', yuhang.dayMaster, `(${yuhang.dayMasterElement})`);
  console.log('身强/弱:', yuhang.strength);
  console.log('喜用神:', yuhang.xiyong.join(', '));
  console.log('');

  // ======= 测试5: 虚拟用户完整流程 =======
  console.log('=== 测试5: 虚拟用户 (张伟) ===');
  const zhangwei = runBaziAgent({
    year: 1992, month: 10, day: 15, hour: 14, minute: 0,
    birthCity: '北京', gender: 'male',
  });
  console.log('张伟八字:', zhangwei.fourPillars.year.ganZhi, zhangwei.fourPillars.month.ganZhi, zhangwei.fourPillars.day.ganZhi, zhangwei.fourPillars.hour.ganZhi);

  const zhangweiLiuNian = runLiuNianAgent(zhangwei);
  const zhangweiScenario = runScenarioAgent({
    scenarioId: 'golden-handcuffs',
    userContext: '在Google做SWE 5年了，TC 40万但不开心，有个startup给我offer但薪水少40%，老婆怀孕了',
    baziData: zhangwei,
  });
  console.log('场景:', zhangweiScenario.scenario.title.zh);
  console.log('');

  // ======= 测试6: 完整Orchestrator流程（需要API Key） =======
  if (!isLocal && apiKey) {
    console.log('=== 测试6: 完整Orchestrator流程 (调用Claude API) ===');
    console.log('⏳ 正在生成AI报告...\n');

    const result = await orchestrate({
      year: 1992, month: 10, day: 15, hour: 14, minute: 0,
      birthCity: '北京', gender: 'male',
      scenarioId: 'golden-handcuffs',
      userContext: '在Google做SWE 5年了，TC 40万但不开心，有个startup给我offer但薪水少40%，老婆怀孕了',
    }, apiKey, {
      lang: 'zh',
      enableReflection: true,
      verbose: true,
    });

    console.log('\n' + '='.repeat(60));
    console.log('最终报告：');
    console.log('='.repeat(60));
    console.log(result.report);
    console.log('\n' + '='.repeat(60));

    if (result.quality) {
      console.log(`质量评分: ${result.quality.finalScore}/100 (${result.quality.passed ? '通过' : '未通过'})`);
      console.log(`迭代次数: ${result.quality.iterations}`);
    }
    console.log(`总耗时: ${result.metadata.totalTimeMs}ms`);
  } else if (!isLocal) {
    console.log('=== 测试6: 跳过（未设置CLAUDE_API_KEY） ===');
    console.log('运行完整测试: CLAUDE_API_KEY=sk-ant-... node test.js');
  }

  console.log('\n✅ 所有本地测试通过！');
}

main().catch(console.error);
