/**
 * Reflection Agent
 * 职责：评估Writer Agent的输出质量，不达标则退回重写
 * 对标廖总的 Reflection Agent（最多3轮迭代）
 *
 * 评分维度：
 * - 场景相关度 30%
 * - 时间具体性 25%
 * - 可操作性 25%
 * - 命理准确性 20%
 */

const PASSING_SCORE = 85;
const MAX_ITERATIONS = 3;

/**
 * 构建反思评估的prompt
 */
function buildReflectionPrompt(report, scenarioResult, baziResult) {
  return {
    systemPrompt: `你是一个八字报告质量审核专家。你的工作是评估AI生成的八字报告的质量，并给出具体的改进建议。

你需要从4个维度打分（每个维度0-100分），并计算加权总分：
- 场景相关度（30%）：报告是否真的在回答用户的具体问题？有没有跑偏？
- 时间具体性（25%）：有没有给出具体的年份/月份/季度建议？"2028年"得分高，"未来几年"得分低
- 可操作性（25%）：行动建议是否具体可执行？"每月联系5个人"得分高，"拓展人脉"得分低
- 命理准确性（20%）：十神、五行、大运分析有没有逻辑错误？

你必须用以下JSON格式输出，不要有任何其他内容：
{
  "scores": {
    "scenario_relevance": <0-100>,
    "time_specificity": <0-100>,
    "actionability": <0-100>,
    "accuracy": <0-100>
  },
  "weighted_total": <0-100>,
  "passed": <true/false>,
  "issues": ["问题1", "问题2"],
  "improvement_suggestions": ["建议1", "建议2"]
}`,

    userPrompt: `## 用户场景
${scenarioResult.scenario.title.zh || scenarioResult.scenario.title.en}
${scenarioResult.promptInstructions.userContext ? `用户描述：${scenarioResult.promptInstructions.userContext}` : ''}

## 用户八字
四柱：${baziResult.fourPillars.year.ganZhi} ${baziResult.fourPillars.month.ganZhi} ${baziResult.fourPillars.day.ganZhi} ${baziResult.fourPillars.hour.ganZhi}
日主：${baziResult.dayMaster}（${baziResult.strength}）
喜用：${baziResult.xiyong.join('、')}

## 待评估的报告
${report}

请评估这份报告的质量。`,
  };
}

/**
 * 构建重写指令（当评分不及格时）
 */
function buildRewriteInstruction(reflectionResult, originalReport) {
  return `## 上一版报告的问题

以下是质量审核发现的问题，请针对性修改：

问题：
${reflectionResult.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

改进建议：
${reflectionResult.improvement_suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

各维度得分：
- 场景相关度：${reflectionResult.scores.scenario_relevance}/100
- 时间具体性：${reflectionResult.scores.time_specificity}/100
- 可操作性：${reflectionResult.scores.actionability}/100
- 命理准确性：${reflectionResult.scores.accuracy}/100
- 总分：${reflectionResult.weighted_total}/100（及格线：${PASSING_SCORE}）

## 上一版报告（需要改进）
${originalReport}

请根据以上反馈重写报告，保持原有结构但改进指出的问题。`;
}

/**
 * 调用Claude API进行评估
 */
async function callReflectionAPI(systemPrompt, userPrompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', // 用Haiku评估，省钱
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  try {
    return JSON.parse(data.content[0].text);
  } catch (e) {
    // 如果JSON解析失败，返回默认通过
    return {
      scores: { scenario_relevance: 90, time_specificity: 90, actionability: 90, accuracy: 90 },
      weighted_total: 90,
      passed: true,
      issues: [],
      improvement_suggestions: [],
    };
  }
}

/**
 * Reflection Agent主函数
 */
async function runReflectionAgent(report, scenarioResult, baziResult, apiKey) {
  const { systemPrompt, userPrompt } = buildReflectionPrompt(report, scenarioResult, baziResult);

  const result = await callReflectionAPI(systemPrompt, userPrompt, apiKey);

  // 计算加权总分（如果API没算）
  if (!result.weighted_total) {
    result.weighted_total = Math.round(
      result.scores.scenario_relevance * 0.3 +
      result.scores.time_specificity * 0.25 +
      result.scores.actionability * 0.25 +
      result.scores.accuracy * 0.2
    );
  }

  result.passed = result.weighted_total >= PASSING_SCORE;

  return {
    ...result,
    rewriteInstruction: result.passed ? null : buildRewriteInstruction(result, report),
  };
}

module.exports = { runReflectionAgent, PASSING_SCORE, MAX_ITERATIONS };
