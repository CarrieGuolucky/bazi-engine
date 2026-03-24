/**
 * Report Writer Agent
 * 职责：汇总三路Agent结果 → 调用Claude API → 生成完整报告
 * 对标廖总的 Listing Writer Agent
 */

/**
 * 构建发送给Claude的完整prompt
 */
function buildWriterPrompt(baziResult, liuNianResult, scenarioResult, lang = 'zh') {
  const { scenario, promptInstructions } = scenarioResult;

  const systemPrompt = lang === 'zh' ? `你是一位融合东方命理和现代人生规划的AI顾问。你的工作是根据用户的八字命盘，结合他们当前面临的具体处境，给出个性化的、有时间节点的、可操作的建议。

## 你的核心原则
1. 先共情，再分析——用户是来解决问题的，不是来听术语的
2. 必须给出具体的时间建议——"2028年"比"未来几年"强100倍
3. 必须给出可操作的行动——"每月联系5个人"比"拓展人脉"强100倍
4. 用"适合/不适合"代替"好/坏"
5. 用"你的命盘显示"代替"命中注定"
6. 不要堆砌术语——每个术语出现时都要翻译成人话
7. 结尾必须赋权——让用户觉得自己有选择权
8. 语气像一个既懂命理又懂职场的朋友，不是一个高高在上的大师

## 格式要求
用markdown格式输出。标题用#，小标题用##或###。
表格用markdown表格。重点用**加粗**。` :

`You are an AI advisor who combines Eastern destiny analysis (BaZi) with modern life planning. Your job is to give personalized, time-specific, actionable guidance based on the user's birth chart and current situation.

## Core Principles
1. Lead with empathy, then analyze — users want solutions, not jargon
2. Give specific timing — "2028" is 100x better than "in a few years"
3. Give actionable steps — "contact 5 people monthly" beats "expand your network"
4. Use "suits you / doesn't suit you" instead of "good / bad"
5. Use "your chart suggests" instead of "destiny says"
6. Don't pile on jargon — translate every term into plain language
7. End with empowerment — the user has the final say
8. Tone: like a friend who understands both destiny analysis and career strategy

## Format
Output in markdown. Use # for title, ## or ### for sections.
Use markdown tables. Bold **key points**.`;

  const userPrompt = `## 用户八字数据

四柱：${baziResult.fourPillars.year.ganZhi} ${baziResult.fourPillars.month.ganZhi} ${baziResult.fourPillars.day.ganZhi} ${baziResult.fourPillars.hour.ganZhi}
日主：${baziResult.dayMaster}（${baziResult.dayMasterElement}）
身强/弱：${baziResult.strength}
喜用神：${baziResult.xiyong.join('、')}
五行分布：金${baziResult.wuxing['金']} 木${baziResult.wuxing['木']} 水${baziResult.wuxing['水']} 火${baziResult.wuxing['火']} 土${baziResult.wuxing['土']}

十神：
- 年干 ${baziResult.fourPillars.year.gan}=${baziResult.tenGods.yearGan}
- 月干 ${baziResult.fourPillars.month.gan}=${baziResult.tenGods.monthGan}
- 时干 ${baziResult.fourPillars.hour.gan}=${baziResult.tenGods.hourGan}

出生信息：${baziResult.input.original}，${baziResult.input.birthCity}，${baziResult.input.gender === 'female' ? '女' : '男'}
真太阳时：${baziResult.input.trueSolarTime}

## 格局分析
${baziResult.geJu ? baziResult.geJu.summary : '未分析'}

## 神煞
${baziResult.shenSha ? baziResult.shenSha.summary + '\n' + baziResult.shenSha.details.join('\n') : '未分析'}

## 墓库
${baziResult.muKu ? baziResult.muKu.summary : '未分析'}

## 刑破害
${baziResult.xingPoHai ? baziResult.xingPoHai.summary : '无'}

## 十二长生
${baziResult.changSheng ? baziResult.changSheng.summary : '未分析'}

## 空亡
${baziResult.kongWangAnalysis ? baziResult.kongWangAnalysis.summary : '未分析'}

## 大运流年分析

当前大运：${liuNianResult.currentDaYun.ganZhi}（${liuNianResult.currentDaYun.period}，${liuNianResult.currentDaYun.age}）
- 天干${liuNianResult.currentDaYun.gan.char}（${liuNianResult.currentDaYun.gan.wuxing}，${liuNianResult.currentDaYun.gan.tenGod}）${liuNianResult.currentDaYun.gan.isXiyong ? '✓喜用' : '✗忌神'}
- 地支${liuNianResult.currentDaYun.zhi.char}（${liuNianResult.currentDaYun.zhi.wuxing}，${liuNianResult.currentDaYun.zhi.tenGod}）${liuNianResult.currentDaYun.zhi.isXiyong ? '✓喜用' : '✗忌神'}

${liuNianResult.nextDaYun ? `下步大运：${liuNianResult.nextDaYun.ganZhi}（${liuNianResult.nextDaYun.startYear}年起）` : ''}
${liuNianResult.daYunTransitionYear ? `大运交接年：${liuNianResult.daYunTransitionYear}` : ''}

未来流年分析：
${liuNianResult.liuNianAnalysis.map(y => {
  const marker = y.isCurrent ? ' ◀今年' : '';
  const favorable = y.overallFavorable === 'very_good' ? '★★★' : y.overallFavorable === 'mixed' ? '★★' : '★';
  const events = y.events.length > 0 ? `  事件：${y.events.join('；')}` : '';
  const interactions = y.interactions.length > 0 ? `  关系：${y.interactions.join('；')}` : '';
  return `- ${y.year}年 ${y.ganZhi} [${favorable}]${marker}${events}${interactions}`;
}).join('\n')}

关键年份：${liuNianResult.keyYears.map(y => `${y.year}(重要度${y.importance}/10)`).join('、')}

## 用户场景

场景：${scenario.title.zh || scenario.title.en}
${promptInstructions.userContext ? `用户补充描述：${promptInstructions.userContext}` : ''}

## 解读指令

${promptInstructions.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

${promptInstructions.strengthContext}

## 输出结构

请按以下结构生成报告：

1. **标题**：直接回应用户的核心问题（不超过15字）
2. **你现在的处境**（2-3句话共情，用场景的emotionalHook作为参考但要根据用户的具体情况修改）
   参考hook：${scenario.emotionalHook.zh || scenario.emotionalHook.en}
3. **你的命盘怎么看这件事**（结合八字数据分析，每个分析点都要翻译成人话）
4. **时间表：什么时候该动**（用表格形式，列出未来3-5年每年的关键词和建议）
5. **你现在就能做的3件事**（每件事都要有命理依据+现实逻辑，不超过3-4句话）
6. **最后**（一句赋权的话+免责声明）

免责声明固定文字：本报告基于传统命理文化，仅供自我探索与参考，不构成职业、财务或法律建议。重大决策请咨询专业人士。`;

  return { systemPrompt, userPrompt };
}

/**
 * 调用Claude API生成报告
 */
async function callClaudeAPI(systemPrompt, userPrompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

/**
 * Writer Agent主函数
 */
async function runWriterAgent(baziResult, liuNianResult, scenarioResult, apiKey, lang = 'zh') {
  const { systemPrompt, userPrompt } = buildWriterPrompt(baziResult, liuNianResult, scenarioResult, lang);

  const report = await callClaudeAPI(systemPrompt, userPrompt, apiKey);

  return {
    report,
    metadata: {
      model: 'claude-sonnet-4-20250514',
      scenario: scenarioResult.scenario.id,
      lang,
      generatedAt: new Date().toISOString(),
    },
    prompts: { systemPrompt, userPrompt }, // 用于debug
  };
}

module.exports = { runWriterAgent, buildWriterPrompt };
