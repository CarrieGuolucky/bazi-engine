/**
 * 合盘 Agent — 感情关系分析
 *
 * 核心原则：做"教练"不做"判官"
 * - 永远不说"你们不合适"
 * - 只说"你们的模式是什么、怎么经营"
 * - 把冲突变成可解决的问题
 * - 把合的力量变成可利用的优势
 */

const { runBaziAgent } = require('./baziAgent');

// 天干合
const GAN_HE = {
  '甲己': '土', '己甲': '土', '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水', '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
};

// 地支六合
const ZHI_HE = {
  '子丑': '土', '丑子': '土', '寅亥': '木', '亥寅': '木',
  '卯戌': '火', '戌卯': '火', '辰酉': '金', '酉辰': '金',
  '巳申': '水', '申巳': '水', '午未': '火', '未午': '火',
};

// 地支冲
const ZHI_CHONG = [
  '子午', '午子', '丑未', '未丑', '寅申', '申寅',
  '卯酉', '酉卯', '辰戌', '戌辰', '巳亥', '亥巳',
];

// 地支半合
const ZHI_BANHE = {
  '寅午': '火', '午戌': '火', '申子': '水', '子辰': '水',
  '巳酉': '金', '酉丑': '金', '亥卯': '木', '卯未': '木',
  '午寅': '火', '戌午': '火', '子申': '水', '辰子': '水',
  '酉巳': '金', '丑酉': '金', '卯亥': '木', '未卯': '木',
};

// 五行关系
const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

const POS_NAMES = ['年', '月', '日', '时'];

// 日主关系描述
function getDayMasterRelation(dm1, dm2) {
  const wx1 = GAN_WUXING[dm1];
  const wx2 = GAN_WUXING[dm2];

  if (wx1 === wx2) return { type: 'same', desc: '同五行——你们本质相似，容易理解彼此，但也容易争' };
  if (WUXING_SHENG[wx1] === wx2) return { type: 'a_sheng_b', desc: `${dm1}(${wx1})生${dm2}(${wx2})——A方在付出和支持B方` };
  if (WUXING_SHENG[wx2] === wx1) return { type: 'b_sheng_a', desc: `${dm2}(${wx2})生${dm1}(${wx1})——B方在付出和支持A方` };
  if (WUXING_KE[wx1] === wx2) return { type: 'a_ke_b', desc: `${dm1}(${wx1})克${dm2}(${wx2})——A方对B方有约束力` };
  if (WUXING_KE[wx2] === wx1) return { type: 'b_ke_a', desc: `${dm2}(${wx2})克${dm1}(${wx1})——B方对A方有约束力` };
  return { type: 'unknown', desc: '关系复杂' };
}

/**
 * 合盘分析主函数
 */
function runHePanAgent(personA, personB) {
  // 1. 分别排盘
  const baziA = runBaziAgent(personA);
  const baziB = runBaziAgent(personB);

  const gansA = [baziA.fourPillars.year.gan, baziA.fourPillars.month.gan, baziA.fourPillars.day.gan, baziA.fourPillars.hour.gan];
  const gansB = [baziB.fourPillars.year.gan, baziB.fourPillars.month.gan, baziB.fourPillars.day.gan, baziB.fourPillars.hour.gan];
  const zhisA = [baziA.fourPillars.year.zhi, baziA.fourPillars.month.zhi, baziA.fourPillars.day.zhi, baziA.fourPillars.hour.zhi];
  const zhisB = [baziB.fourPillars.year.zhi, baziB.fourPillars.month.zhi, baziB.fourPillars.day.zhi, baziB.fourPillars.hour.zhi];

  // 2. 找所有合
  const hes = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const ganKey = gansA[i] + gansB[j];
      if (GAN_HE[ganKey]) {
        hes.push({
          type: 'tianGanHe',
          detail: `${gansA[i]}${gansB[j]}合${GAN_HE[ganKey]}`,
          posA: POS_NAMES[i] + '干',
          posB: POS_NAMES[j] + '干',
          samePosition: i === j,
          meaning: i === 2 && j === 2 ? '日干合——最强的灵魂吸引' :
                   i === j ? '同位合——天然默契' : '跨位合——需要主动靠近才能感受到',
        });
      }

      const zhiKey = zhisA[i] + zhisB[j];
      if (ZHI_HE[zhiKey]) {
        hes.push({
          type: 'diZhiHe',
          detail: `${zhisA[i]}${zhisB[j]}合${ZHI_HE[zhiKey]}`,
          posA: POS_NAMES[i] + '支',
          posB: POS_NAMES[j] + '支',
          samePosition: i === j,
          meaning: i === 2 && j === 2 ? '日支合——生活上非常契合' :
                   i === j ? '同位合——这个层面很默契' : '跨位合——互相激发',
        });
      }

      if (ZHI_BANHE[zhiKey]) {
        hes.push({
          type: 'banHe',
          detail: `${zhisA[i]}${zhisB[j]}半合${ZHI_BANHE[zhiKey]}`,
          posA: POS_NAMES[i] + '支',
          posB: POS_NAMES[j] + '支',
          samePosition: i === j,
          meaning: '半合——有缘分但需要第三方力量完成',
        });
      }
    }
  }

  // 3. 找所有冲
  const chongs = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const zhiKey = zhisA[i] + zhisB[j];
      if (ZHI_CHONG.includes(zhiKey)) {
        const meaning = (i === 2 && j === 2) ? '日支冲——生活习惯/家庭观念容易冲突' :
                        (i === 1 || j === 1) ? '涉及月支——内心世界/价值观冲突' :
                        (i === 0 || j === 0) ? '涉及年支——家庭背景/成长环境冲突' :
                        '涉及时支——未来规划/子女观念冲突';
        chongs.push({
          type: 'diZhiChong',
          detail: `${zhisA[i]}${zhisB[j]}冲`,
          posA: POS_NAMES[i] + '支',
          posB: POS_NAMES[j] + '支',
          samePosition: i === j,
          meaning,
        });
      }
    }
  }

  // 4. 找相同的柱
  const sameElements = [];
  for (let i = 0; i < 4; i++) {
    if (gansA[i] === gansB[i] && zhisA[i] === zhisB[i]) {
      sameElements.push({ position: POS_NAMES[i] + '柱', value: gansA[i] + zhisA[i], meaning: POS_NAMES[i] + '柱完全相同——这个层面高度共振' });
    } else if (zhisA[i] === zhisB[i]) {
      sameElements.push({ position: POS_NAMES[i] + '支', value: zhisA[i], meaning: POS_NAMES[i] + '支相同——这个层面有共鸣' });
    } else if (gansA[i] === gansB[i]) {
      sameElements.push({ position: POS_NAMES[i] + '干', value: gansA[i], meaning: POS_NAMES[i] + '干相同——思维方式接近' });
    }
  }

  // 5. 日主关系
  const dayMasterRelation = getDayMasterRelation(baziA.dayMaster, baziB.dayMaster);

  // 6. 天地双合检测（宽松版：只要同时存在天干合和地支合就算）
  const hasTianHe = hes.some(h => h.type === 'tianGanHe');
  const hasDiHe = hes.some(h => h.type === 'diZhiHe');
  let tianDiShuangHe = hasTianHe && hasDiHe;
  // 严格版：同一柱位天干地支都合
  let tianDiShuangHeStrict = false;
  for (let i = 0; i < 4; i++) {
    const ganHe = GAN_HE[gansA[i] + gansB[i]];
    const zhiHe = ZHI_HE[zhisA[i] + zhisB[i]];
    if (ganHe && zhiHe) {
      tianDiShuangHeStrict = true;
      break;
    }
  }

  // 7. 关系评分（教练模式——不是好坏，是需要经营的程度）
  const heScore = hes.filter(h => h.type === 'tianGanHe').length * 15 +
                  hes.filter(h => h.type === 'diZhiHe').length * 12 +
                  hes.filter(h => h.type === 'banHe').length * 5 +
                  sameElements.length * 8 +
                  (tianDiShuangHe ? 20 : 0);
  const chongScore = chongs.length * 10;

  let relationshipMode;
  if (heScore > 40 && chongScore < 10) {
    relationshipMode = { level: 'smooth', label: '自然流畅型', desc: '你们天然默契多，冲突少。关系容易维持，但注意不要因为太舒服而忽视经营。' };
  } else if (heScore > 30 && chongScore >= 10) {
    relationshipMode = { level: 'dynamic', label: '激情碰撞型', desc: '你们既有强烈的吸引力，也有明显的摩擦点。关系不会无聊，但需要学会"吵完和好"的能力。' };
  } else if (heScore > 15) {
    relationshipMode = { level: 'growing', label: '成长磨合型', desc: '你们之间有连接但不算强烈，需要更多主动经营。好消息是：越磨合越契合，时间是你们的朋友。' };
  } else {
    relationshipMode = { level: 'independent', label: '独立共处型', desc: '你们各自独立性很强，不会过度依赖彼此。关系的关键是找到共同的目标和节奏，刻意制造连接。' };
  }

  // 8. 冲突预警与解决方案
  const conflictPatterns = chongs.map(c => {
    let solution;
    if (c.detail.includes('子午') || c.detail.includes('午子')) {
      solution = '水火冲——一方理性一方感性，解法：决定之前先问对方感受';
    } else if (c.detail.includes('丑未') || c.detail.includes('未丑')) {
      solution = '土土冲——都固执不让步，解法：设定轮流让步的规则';
    } else if (c.detail.includes('寅申') || c.detail.includes('申寅')) {
      solution = '木金冲——一方要自由一方要控制，解法：给彼此独立空间';
    } else if (c.detail.includes('卯酉') || c.detail.includes('酉卯')) {
      solution = '木金冲——审美观/社交圈差异大，解法：尊重对方的朋友圈';
    } else if (c.detail.includes('辰戌') || c.detail.includes('戌辰')) {
      solution = '土土冲——生活习惯/家务分配容易吵，解法：明确分工不含糊';
    } else if (c.detail.includes('巳亥') || c.detail.includes('亥巳')) {
      solution = '火水冲——一方热情一方冷静，解法：吵架时给彼此冷静时间再谈';
    } else {
      solution = '需要更多沟通和理解';
    }
    return { ...c, solution };
  });

  return {
    personA: {
      name: personA.name || 'A',
      bazi: `${baziA.fourPillars.year.ganZhi} ${baziA.fourPillars.month.ganZhi} ${baziA.fourPillars.day.ganZhi} ${baziA.fourPillars.hour.ganZhi}`,
      dayMaster: baziA.dayMaster,
      dayMasterElement: baziA.dayMasterElement,
      strength: baziA.strength,
    },
    personB: {
      name: personB.name || 'B',
      bazi: `${baziB.fourPillars.year.ganZhi} ${baziB.fourPillars.month.ganZhi} ${baziB.fourPillars.day.ganZhi} ${baziB.fourPillars.hour.ganZhi}`,
      dayMaster: baziB.dayMaster,
      dayMasterElement: baziB.dayMasterElement,
      strength: baziB.strength,
    },
    dayMasterRelation,
    tianDiShuangHe,
    hes,
    chongs: conflictPatterns,
    sameElements,
    scores: { heScore, chongScore },
    relationshipMode,
  };
}

// ============= 合盘场景 =============

const HEPAN_SCENARIOS = {
  'fighting': {
    title: { zh: '我们吵架了', en: 'We had a fight' },
    hook: { zh: '吵架不可怕，可怕的是不知道为什么吵。你们的八字里写着冲突的原因——也写着和好的方法。', en: "Fighting isn't the problem — not knowing why is. Your charts show both the cause and the cure." },
    focusAreas: ['conflict_patterns', 'communication_style', 'recovery_advice', 'timing'],
    keyQuestions: [
      '两个人的冲在哪个位置——决定了你们吵的是什么话题',
      '两个人的合在哪个位置——这是吵完能和好的力量',
      '当前流月是否放大了冲突（流月食伤旺=说话伤人）',
      '什么时候关系会回暖（下一个合的流月是哪个月）',
    ],
  },
  'is-this-right': {
    title: { zh: '我们适合在一起吗', en: 'Are we right for each other?' },
    hook: { zh: '没有"完美合适"的两个人，只有"知道怎么相处"的两个人。让我们看看你们的相处说明书。', en: "There's no 'perfect match' — only couples who know how to work together. Let's find your relationship manual." },
    focusAreas: ['overall_compatibility', 'strengths', 'growth_areas', 'long_term'],
    keyQuestions: [
      '合的力量在哪里——你们天然默契的领域',
      '冲的力量在哪里——需要注意的领域',
      '日主关系——谁付出多谁接受多',
      '长期走向——大运对关系的影响',
    ],
  },
  'how-to-communicate': {
    title: { zh: '怎么跟TA沟通', en: 'How to communicate with them' },
    hook: { zh: '你说的话和TA听到的话，可能完全不一样。你们的八字揭示了各自的沟通语言。', en: "What you say and what they hear might be completely different. Your charts reveal each person's communication language." },
    focusAreas: ['communication_style', 'triggers', 'best_approach'],
    keyQuestions: [
      '对方的食伤（表达方式）是什么风格',
      '对方的官杀（在意什么、容易被什么激怒）',
      '对方的印星（怎样才能让TA感到安全）',
      '你说话容易踩到TA的哪个雷区',
    ],
  },
  'should-we-marry': {
    title: { zh: '我们适合结婚吗', en: 'Should we get married?' },
    hook: { zh: '结婚不是终点，是新的开始。我们来看看你们婚后的关系会怎么发展。', en: "Marriage isn't the finish line — it's a new beginning. Let's see how your relationship evolves after." },
    focusAreas: ['marriage_timing', 'post_marriage_dynamic', 'family_compatibility'],
    keyQuestions: [
      '两个人的配偶宫互相是什么关系',
      '最佳结婚年份（流年桃花星/红鸾天喜）',
      '婚后财运互动——谁赚谁管',
      '家庭关系——双方家庭能否和谐',
    ],
  },
  'weekly-forecast': {
    title: { zh: '本周关系天气预报', en: 'This week\'s relationship forecast' },
    hook: { zh: '每周的能量不同，知道什么时候适合聊重要的事、什么时候该给彼此空间。', en: "Energy shifts weekly. Know when to have big talks and when to give each other space." },
    focusAreas: ['weekly_timing', 'communication_windows', 'conflict_risk'],
    keyQuestions: [
      '本周流日与两人八字的互动',
      '哪几天适合沟通重要的事',
      '哪几天容易摩擦——提前避开',
      '本周最适合一起做什么',
    ],
  },
  'ex-influence': {
    title: { zh: '前任的影响', en: 'Ex\'s influence' },
    hook: { zh: '前任不是消失了，是变成了命盘里的一段能量。我们来看它现在还影响着什么。', en: "An ex doesn't disappear — they become an energy pattern in your chart. Let's see what's still active." },
    focusAreas: ['past_relationship_energy', 'current_impact', 'how_to_move_on'],
    keyQuestions: [
      '偏财（前任能量）在命盘哪个位置',
      '当前大运是否在激活这段旧能量',
      '这段旧能量对现任关系的具体影响',
      '什么时候这段能量会自然消退',
    ],
  },
};

/**
 * 合盘 Writer Prompt 构建
 */
function buildHePanWriterPrompt(hePanResult, scenarioId, userContext = '', lang = 'zh') {
  const scenario = HEPAN_SCENARIOS[scenarioId] || HEPAN_SCENARIOS['is-this-right'];
  const { personA, personB, dayMasterRelation, tianDiShuangHe, hes, chongs, sameElements, relationshipMode } = hePanResult;

  const systemPrompt = `你是一位感情关系AI顾问，融合东方命理和现代关系心理学。

## 核心原则（最重要！）
1. 永远不说"你们不合适""不是正缘""应该分手"——这些话会让用户离开
2. 每对情侣都有合有冲，你的工作是教他们怎么用好合、化解冲
3. 把冲突说成"需要注意的领域"而不是"问题"
4. 把合说成"你们的天然优势"
5. 永远给出具体的、可操作的相处建议
6. 语气像一个懂命理的闺蜜/兄弟，不是高高在上的大师
7. 结尾永远是积极的——"你们可以做到"

## 格式
用markdown。不要用表格。用加粗和分段让内容易读。`;

  const userPrompt = `## 两人八字

**${personA.name}：** ${personA.bazi}
日主${personA.dayMaster}（${personA.dayMasterElement}），${personA.strength}

**${personB.name}：** ${personB.bazi}
日主${personB.dayMaster}（${personB.dayMasterElement}），${personB.strength}

## 日主关系
${dayMasterRelation.desc}

## 合的力量（粘性）
${hes.length > 0 ? hes.map(h => `- ${h.detail}（${h.posA}×${h.posB}）— ${h.meaning}`).join('\n') : '没有明显的合，需要更多主动经营'}
${tianDiShuangHe ? '\n★ 天地双合！极稀有的深度绑定。' : ''}

## 冲的力量（摩擦点）
${chongs.length > 0 ? chongs.map(c => `- ${c.detail}（${c.posA}×${c.posB}）— ${c.meaning}\n  解法：${c.solution}`).join('\n') : '没有明显的冲，关系相对平稳'}

## 相同元素（共鸣点）
${sameElements.length > 0 ? sameElements.map(s => `- ${s.position} ${s.value} — ${s.meaning}`).join('\n') : '没有相同元素'}

## 关系模式
${relationshipMode.label}：${relationshipMode.desc}

## 合盘评分
合的力量：${hePanResult.scores.heScore}分
冲的力量：${hePanResult.scores.chongScore}分

## 用户场景
${scenario.title.zh}
${userContext ? `用户描述：${userContext}` : ''}

## 分析重点
${scenario.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## 输出结构

1. **标题**（直接回应用户的问题，不超过15字）
2. **你们的关系画像**（2-3句话描述关系的本质，用场景hook作为参考：${scenario.hook.zh}）
3. **你们的天然优势**（从合的力量中提取，说人话，举生活中的例子）
4. **需要注意的领域**（从冲的力量中提取，不说"问题"，说"这个地方需要多花心思"。每个冲都给具体的解法）
5. **给你们各自的一句话**（分别对A和B说一句最关键的建议）
6. **这段关系的经营指南**（3个具体的、可操作的建议）
7. **最后**（积极正面的结尾+免责声明）

免责声明：本报告基于传统命理文化，仅供自我探索与参考，不构成任何决策建议。`;

  return { systemPrompt, userPrompt };
}

module.exports = { runHePanAgent, buildHePanWriterPrompt, HEPAN_SCENARIOS };
