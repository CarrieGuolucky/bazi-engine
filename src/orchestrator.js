/**
 * Orchestrator Agent
 * 职责：编排整个流程
 *
 * 流程：
 * 1. 解析用户输入
 * 2. 并发调度三个子Agent（排盘/流年/场景）
 * 3. 汇总结果 → 注入Writer Agent
 * 4. Reflection Agent评估 → 不及格退回重写（最多3轮）
 * 5. 输出最终报告
 */

const { runBaziAgent } = require('./agents/baziAgent');
const { runLiuNianAgent } = require('./agents/liuNianAgent');
const { runScenarioAgent } = require('./agents/scenarioAgent');
const { runWriterAgent } = require('./agents/writerAgent');
const { runReflectionAgent, MAX_ITERATIONS } = require('./agents/reflectionAgent');
const { runDynamicEngine } = require('./dynamicEngine');

/**
 * 主编排函数
 * @param {Object} userInput - 用户输入
 * @param {string} apiKey - Claude API Key
 * @param {Object} options - 配置选项
 */
async function orchestrate(userInput, apiKey, options = {}) {
  const {
    lang = 'zh',
    enableReflection = true,
    verbose = false,
  } = options;

  const log = verbose ? console.log : () => {};
  const startTime = Date.now();

  log('🎯 Orchestrator: 开始处理...');

  // ====== Step 1: 解析输入 ======
  const {
    year, month, day, hour = 12, minute = 0,
    birthCity = '', gender = 'male', isLunar = false,
    scenarioId, userContext = '',
  } = userInput;

  log('📥 输入:', { year, month, day, hour, minute, birthCity, gender, scenarioId });

  // ====== Step 2: 并发执行三个子Agent ======
  log('⚡ 并发启动 3 个子Agent...');

  // Agent 1: 八字排盘（纯本地计算，不需要API）
  const baziResult = runBaziAgent({ year, month, day, hour, minute, birthCity, gender, isLunar });
  log('✅ 八字排盘Agent完成:', baziResult.fourPillars.year.ganZhi, baziResult.fourPillars.month.ganZhi, baziResult.fourPillars.day.ganZhi, baziResult.fourPillars.hour.ganZhi);

  // Agent 2: 流年分析（基于排盘结果，纯本地计算）
  const liuNianResult = runLiuNianAgent(baziResult);
  log('✅ 流年分析Agent完成:', `当前大运${liuNianResult.currentDaYun.ganZhi}，关键年份${liuNianResult.keyYears.length}个`);

  // Agent 3: 场景匹配（纯本地匹配）
  const scenarioResult = runScenarioAgent({ scenarioId, userContext, baziData: baziResult });
  log('✅ 场景匹配Agent完成:', scenarioResult.scenario.title.zh || scenarioResult.scenario.title.en);

  // Agent 4: 动态引擎（逐年交叉分析）
  const dynamicResult = runDynamicEngine(baziResult, new Date().getFullYear(), new Date().getFullYear() + 20);
  log('✅ 动态引擎完成:', dynamicResult.yearAnalysis.length, '年分析，最佳年份:', dynamicResult.bestYears.map(y => y.year).join(','));

  // ====== Step 3: Writer Agent 生成报告 ======
  log('✍️  Writer Agent 生成报告...');

  let writerResult = await runWriterAgent(baziResult, liuNianResult, scenarioResult, apiKey, lang);
  let finalReport = writerResult.report;

  log('✅ Writer Agent完成，报告长度:', finalReport.length, '字');

  // ====== Step 4: Reflection Agent 评估（可选） ======
  let reflectionResults = [];

  if (enableReflection) {
    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
      log(`🔍 Reflection Agent 第${iteration}轮评估...`);

      const reflectionResult = await runReflectionAgent(finalReport, scenarioResult, baziResult, apiKey);
      reflectionResults.push(reflectionResult);

      log(`   得分: ${reflectionResult.weighted_total}/100 (及格线85)`);

      if (reflectionResult.passed) {
        log(`✅ 第${iteration}轮通过！`);
        break;
      }

      if (iteration < MAX_ITERATIONS) {
        log(`❌ 未通过，退回重写...`);
        log(`   问题: ${reflectionResult.issues.join('; ')}`);

        // 用反思结果重新生成
        const rewriteResult = await runWriterAgent(
          baziResult, liuNianResult,
          {
            ...scenarioResult,
            promptInstructions: {
              ...scenarioResult.promptInstructions,
              rewriteFeedback: reflectionResult.rewriteInstruction,
            },
          },
          apiKey, lang
        );

        finalReport = rewriteResult.report;
        log(`✅ 重写完成，新报告长度: ${finalReport.length} 字`);
      } else {
        log(`⚠️  达到最大迭代次数(${MAX_ITERATIONS})，使用当前版本`);
      }
    }
  }

  // ====== Step 5: 组装最终输出 ======
  const totalTime = Date.now() - startTime;
  log(`🎉 完成！总耗时: ${totalTime}ms`);

  return {
    report: finalReport,
    chart: baziResult,
    dynamic: dynamicResult,
    timeline: {
      currentDaYun: liuNianResult.currentDaYun,
      nextDaYun: liuNianResult.nextDaYun,
      keyYears: liuNianResult.keyYears,
      liuNianAnalysis: liuNianResult.liuNianAnalysis,
    },
    scenario: scenarioResult.scenario,
    quality: reflectionResults.length > 0 ? {
      finalScore: reflectionResults[reflectionResults.length - 1].weighted_total,
      iterations: reflectionResults.length,
      passed: reflectionResults[reflectionResults.length - 1].passed,
    } : null,
    metadata: {
      totalTimeMs: totalTime,
      lang,
      generatedAt: new Date().toISOString(),
    },
  };
}

module.exports = { orchestrate };
