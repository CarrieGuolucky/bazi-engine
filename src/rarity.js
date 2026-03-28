/**
 * 稀有度计算模块
 *
 * 多维度综合评分 → 大样本模拟 → 输出"你在X万人中排前Y%"
 * 这是产品的WOW moment核心
 */

const { runBaziAgent } = require('./agents/baziAgent');

/**
 * 计算单个命盘的综合评分（0-100）
 * 维度：吉神、凶煞、格局质量、财库、刑破害、十二长生、五行平衡
 */
function calculateChartScore(bazi) {
  let score = 50; // 基础分

  // 1. 吉神加分（每个+3，最多+30）
  const goodStars = bazi.shenSha ? bazi.shenSha.吉神.length : 0;
  score += Math.min(goodStars * 3, 30);

  // 2. 凶煞扣分（每个-5）
  const badStars = bazi.shenSha ? bazi.shenSha.凶煞.length : 0;
  score -= badStars * 5;

  // 3. 格局质量
  if (bazi.geJu) {
    // 有格局配合加分
    if (bazi.geJu.peihe && bazi.geJu.peihe.length > 0) score += 8;
    // 有警告扣分
    if (bazi.geJu.warnings && bazi.geJu.warnings.length > 0) score -= 4;
  }

  // 4. 财库加分（每个+5）
  const kuCount = bazi.muKu ? bazi.muKu.kus.length : 0;
  score += kuCount * 5;

  // 5. 刑破害扣分
  if (bazi.xingPoHai) {
    score -= bazi.xingPoHai.xing.length * 4;
    score -= bazi.xingPoHai.po.length * 2;
    score -= bazi.xingPoHai.hai.length * 3;
  }

  // 6. 十二长生能量
  if (bazi.changSheng) {
    const energy = bazi.changSheng.totalEnergy || 0;
    // 能量25-40之间比较好
    if (energy >= 25) score += 5;
    if (energy >= 30) score += 5;
  }

  // 7. 五行平衡度（越平衡越好）
  if (bazi.strengthAnalysis && bazi.strengthAnalysis.wuxingRatio) {
    const ratios = Object.values(bazi.strengthAnalysis.wuxingRatio);
    const avg = ratios.reduce((a, b) => a + b, 0) / 5;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / 5;
    // 方差越小越平衡，方差<150算平衡
    if (variance < 100) score += 8;
    else if (variance < 150) score += 4;
    else if (variance > 300) score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 大样本模拟：计算某个分数在所有随机命盘中的百分比排名
 * @param {number} targetScore - 用户的综合分数
 * @param {number} sampleSize - 模拟样本量（默认10000，速度和精度平衡）
 */
function calculateRarity(targetScore, sampleSize = 10000) {
  let total = 0;
  let belowTarget = 0;
  const scoreDistribution = {};

  for (let i = 0; i < sampleSize; i++) {
    const year = 1960 + Math.floor(Math.random() * 50);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const hour = Math.floor(Math.random() * 12) * 2;
    const gender = Math.random() > 0.5 ? 'male' : 'female';

    try {
      const bazi = runBaziAgent({ year, month, day, hour, minute: 0, birthCity: '', gender });
      const s = calculateChartScore(bazi);
      total++;
      if (s < targetScore) belowTarget++;

      // 分数分布
      const bucket = Math.floor(s / 10) * 10;
      scoreDistribution[bucket] = (scoreDistribution[bucket] || 0) + 1;
    } catch (e) {
      // 跳过无效日期
    }
  }

  const percentile = Math.round((belowTarget / total) * 1000) / 10; // top X%
  const topPercent = Math.round((1 - belowTarget / total) * 1000) / 10;
  const oneInX = Math.round(1 / (1 - belowTarget / total));

  return {
    score: targetScore,
    percentile, // 你超过了X%的人
    topPercent, // 你在top X%
    oneInX, // 每X个人里有1个像你这样的
    sampleSize: total,
    label: getLabel(topPercent),
    description: getDescription(topPercent, oneInX),
  };
}

/**
 * 合盘稀有度：两人配置的综合稀有度
 */
function calculatePairRarity(hepanData, sampleSize = 10000) {
  // 计算合盘综合分
  let pairScore = 50;

  // 合的数量和质量
  const hes = hepanData.hes || [];
  pairScore += hes.filter(h => h.type === 'tianGanHe').length * 8;
  pairScore += hes.filter(h => h.type === 'diZhiHe').length * 7;
  pairScore += hes.filter(h => h.type === 'banHe').length * 4;
  pairScore += hes.filter(h => h.samePosition).length * 5; // 同位合加分

  // 天地双合大加分
  if (hepanData.tianDiShuangHe) pairScore += 15;

  // 冲扣分（但不扣太多，冲不一定是坏事）
  const chongs = hepanData.chongs || [];
  pairScore -= chongs.length * 3;

  // 日主关系
  const rel = hepanData.dayMasterRelation;
  if (rel && (rel.type === 'a_sheng_b' || rel.type === 'b_sheng_a')) pairScore += 5;

  pairScore = Math.max(0, Math.min(100, pairScore));

  // 模拟随机配对
  let total = 0;
  let belowTarget = 0;

  const { runHePanAgent } = require('./agents/hePanAgent');

  for (let i = 0; i < sampleSize; i++) {
    try {
      const pA = {
        year: 1960 + Math.floor(Math.random() * 50),
        month: 1 + Math.floor(Math.random() * 12),
        day: 1 + Math.floor(Math.random() * 28),
        hour: Math.floor(Math.random() * 12) * 2,
        minute: 0, birthCity: '', gender: 'female',
      };
      const pB = {
        year: 1960 + Math.floor(Math.random() * 50),
        month: 1 + Math.floor(Math.random() * 12),
        day: 1 + Math.floor(Math.random() * 28),
        hour: Math.floor(Math.random() * 12) * 2,
        minute: 0, birthCity: '', gender: 'male',
      };

      const result = runHePanAgent(pA, pB);
      let randomScore = 50;
      randomScore += (result.hes || []).filter(h => h.type === 'tianGanHe').length * 8;
      randomScore += (result.hes || []).filter(h => h.type === 'diZhiHe').length * 7;
      randomScore += (result.hes || []).filter(h => h.type === 'banHe').length * 4;
      randomScore += (result.hes || []).filter(h => h.samePosition).length * 5;
      if (result.tianDiShuangHe) randomScore += 15;
      randomScore -= (result.chongs || []).length * 3;
      if (result.dayMasterRelation && (result.dayMasterRelation.type === 'a_sheng_b' || result.dayMasterRelation.type === 'b_sheng_a')) randomScore += 5;
      randomScore = Math.max(0, Math.min(100, randomScore));

      total++;
      if (randomScore < pairScore) belowTarget++;
    } catch (e) {}
  }

  const topPercent = Math.round((1 - belowTarget / total) * 1000) / 10;
  const oneInX = Math.round(1 / (1 - belowTarget / total));

  return {
    score: pairScore,
    topPercent,
    oneInX,
    sampleSize: total,
    label: getPairLabel(topPercent),
    description: getPairDescription(topPercent, oneInX),
  };
}

function getLabel(topPercent) {
  if (topPercent <= 1) return '万中无一 💎';
  if (topPercent <= 5) return '极其稀有 ✨';
  if (topPercent <= 10) return '非常独特 🌟';
  if (topPercent <= 20) return '别具一格 ⭐';
  if (topPercent <= 40) return '独有特色 🔮';
  return '自成一派 🎯';
}

function getDescription(topPercent, oneInX) {
  if (topPercent <= 1) return `你的命盘配置在${oneInX}个人里才出1个，极其罕见`;
  if (topPercent <= 5) return `每${oneInX}个人里才有1个跟你一样的配置`;
  if (topPercent <= 10) return `你的命盘超过了${Math.round(100 - topPercent)}%的人`;
  if (topPercent <= 20) return `你的命盘超过了${Math.round(100 - topPercent)}%的人`;
  if (topPercent <= 40) return `你的命盘有独特的张力——内在能量强但需要平衡`;
  return `你的命盘自成体系，有自己的节奏和风格`;
}

function getPairLabel(topPercent) {
  if (topPercent <= 1) return '天作之合';
  if (topPercent <= 5) return '千里挑一';
  if (topPercent <= 10) return '非常难得';
  if (topPercent <= 20) return '很有缘分';
  if (topPercent <= 40) return '有默契';
  return '普通缘分';
}

function getPairDescription(topPercent, oneInX) {
  if (topPercent <= 1) return `你们的配置在${oneInX}对情侣里才出1对`;
  if (topPercent <= 5) return `每${oneInX}对情侣里才有1对像你们这样`;
  if (topPercent <= 10) return `你们的契合度超过了${Math.round(100 - topPercent)}%的情侣`;
  return `你们有不错的缘分基础`;
}

module.exports = { calculateChartScore, calculateRarity, calculatePairRarity };
