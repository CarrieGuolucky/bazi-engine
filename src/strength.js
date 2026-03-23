/**
 * 日主强弱 + 五行占比 — 对标测测App
 *
 * 两套计算分开：
 * 1. 五行占比（给用户看的饼图）→ 原始比例，不加月令系数
 * 2. 身强弱判断（内部逻辑）→ 加月令系数
 *
 * 经过与测测App的数据对比校准
 */

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const ZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 地支藏干 + 比例（本气/中气/余气）
// 使用 5:2:1 比例制（normalized to percentage）
const ZHI_CANG = {
  '子': [['癸', 100]],
  '丑': [['己', 62.5], ['辛', 25], ['癸', 12.5]],
  '寅': [['甲', 62.5], ['丙', 25], ['戊', 12.5]],
  '卯': [['乙', 100]],
  '辰': [['戊', 62.5], ['乙', 25], ['癸', 12.5]],
  '巳': [['丙', 62.5], ['戊', 25], ['庚', 12.5]],
  '午': [['丁', 62.5], ['己', 37.5]],
  '未': [['己', 62.5], ['丁', 25], ['乙', 12.5]],
  '申': [['庚', 62.5], ['壬', 25], ['戊', 12.5]],
  '酉': [['辛', 100]],
  '戌': [['戊', 62.5], ['辛', 25], ['丁', 12.5]],
  '亥': [['壬', 62.5], ['甲', 37.5]],
};

// 月令系数（精确版，用于身强弱判断）
const MONTHLY_COEFFICIENTS = {
  '寅': { '木': 1.571, '火': 1.548, '土': 0.924, '金': 0.716, '水': 0.862 },
  '卯': { '木': 2.000, '火': 1.414, '土': 0.500, '金': 0.707, '水': 1.000 },
  '辰': { '木': 1.166, '火': 1.074, '土': 1.421, '金': 1.161, '水': 0.800 },
  '巳': { '木': 0.862, '火': 1.571, '土': 1.548, '金': 0.924, '水': 0.716 },
  '午': { '木': 0.912, '火': 1.700, '土': 1.590, '金': 0.774, '水': 0.645 },
  '未': { '木': 0.924, '火': 1.341, '土': 1.674, '金': 1.069, '水': 0.612 },
  '申': { '木': 0.795, '火': 0.674, '土': 1.012, '金': 1.641, '水': 1.498 },
  '酉': { '木': 0.500, '火': 0.707, '土': 1.000, '金': 2.000, '水': 1.414 },
  '戌': { '木': 0.674, '火': 1.012, '土': 1.641, '金': 1.498, '水': 0.795 },
  '亥': { '木': 1.590, '火': 0.774, '土': 0.645, '金': 0.912, '水': 1.700 },
  '子': { '木': 1.414, '火': 0.500, '土': 0.707, '金': 1.000, '水': 2.000 },
  '丑': { '木': 0.898, '火': 0.821, '土': 1.512, '金': 1.348, '水': 1.041 },
};

// 五行生克
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

function shengWo(wx) {
  for (const [k, v] of Object.entries(WUXING_SHENG)) { if (v === wx) return k; }
}

function keWo(wx) {
  for (const [k, v] of Object.entries(WUXING_KE)) { if (v === wx) return k; }
}

function getMonthState(monthZhi, element) {
  const coeff = MONTHLY_COEFFICIENTS[monthZhi]?.[element] || 1.0;
  if (coeff >= 1.5) return '旺';
  if (coeff >= 1.1) return '相';
  if (coeff >= 0.8) return '休';
  if (coeff >= 0.5) return '囚';
  return '死';
}

// ============= 十神计算 =============
const SHISHEN_MAP = {
  // [日主五行][目标五行][同性?] → 十神
  // 同五行
  'same_true': '比肩', 'same_false': '劫财',
  // 我生的
  'wosheng_true': '食神', 'wosheng_false': '伤官',
  // 生我的
  'shengwo_true': '偏印', 'shengwo_false': '正印',
  // 我克的
  'woke_true': '偏财', 'woke_false': '正财',
  // 克我的
  'kewo_true': '七杀', 'kewo_false': '正官',
};

const GAN_YINYANG = { '甲': true, '乙': false, '丙': true, '丁': false, '戊': true, '己': false, '庚': true, '辛': false, '壬': true, '癸': false };

function getShiShen(dayMaster, target) {
  const dmWx = GAN_WUXING[dayMaster];
  const tgWx = GAN_WUXING[target];
  if (!tgWx) return '未知';
  const samePolarity = GAN_YINYANG[dayMaster] === GAN_YINYANG[target];

  if (dmWx === tgWx) return samePolarity ? '比肩' : '劫财';
  if (WUXING_SHENG[dmWx] === tgWx) return samePolarity ? '食神' : '伤官';
  if (WUXING_SHENG[tgWx] === dmWx) return samePolarity ? '偏印' : '正印';
  if (WUXING_KE[dmWx] === tgWx) return samePolarity ? '偏财' : '正财';
  if (WUXING_KE[tgWx] === dmWx) return samePolarity ? '七杀' : '正官';
  return '未知';
}

// ============= 五行占比（给用户看的，对标测测） =============
function calculateWuxingDisplay(fourPillars) {
  // 每个位置（天干/地支）等权重
  // 每个位置 = 12.5%（8个位置 × 12.5% = 100%）
  const POSITION_WEIGHT = 12.5;
  const scores = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

  // 天干（包含日主）
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const wx = GAN_WUXING[fourPillars[pos].gan];
    scores[wx] += POSITION_WEIGHT;
  }

  // 地支（按藏干比例分配）
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const zhi = fourPillars[pos].zhi;
    const cangs = ZHI_CANG[zhi] || [];
    for (const [cangGan, pct] of cangs) {
      const wx = GAN_WUXING[cangGan];
      scores[wx] += POSITION_WEIGHT * pct / 100;
    }
  }

  // 归一化到100%
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const ratio = {};
  for (const [k, v] of Object.entries(scores)) {
    ratio[k] = Math.round(v / total * 100);
  }

  // 确保总和=100（修正四舍五入误差）
  const sum = Object.values(ratio).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    const maxKey = Object.entries(ratio).sort((a, b) => b[1] - a[1])[0][0];
    ratio[maxKey] += (100 - sum);
  }

  return { scores, ratio };
}

// ============= 十神占比（给用户看的，对标测测） =============
function calculateShiShenDisplay(fourPillars) {
  const dayMaster = fourPillars.day.gan;
  const POSITION_WEIGHT = 12.5;
  const scores = {};

  // 天干十神（不含日主自己）
  for (const pos of ['year', 'month', 'hour']) {
    const gan = fourPillars[pos].gan;
    const ss = getShiShen(dayMaster, gan);
    scores[ss] = (scores[ss] || 0) + POSITION_WEIGHT;
  }

  // 地支藏干十神
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const zhi = fourPillars[pos].zhi;
    const cangs = ZHI_CANG[zhi] || [];
    for (const [cangGan, pct] of cangs) {
      const ss = getShiShen(dayMaster, cangGan);
      scores[ss] = (scores[ss] || 0) + POSITION_WEIGHT * pct / 100;
    }
  }

  // 归一化
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const ratio = {};
  for (const [k, v] of Object.entries(scores)) {
    ratio[k] = Math.round(v / total * 100);
  }

  return { scores, ratio };
}

// ============= 身强弱判断（内部逻辑，用月令系数） =============
function calculateStrengthInternal(fourPillars) {
  const dayGan = fourPillars.day.gan;
  const dayElement = GAN_WUXING[dayGan];
  const monthZhi = fourPillars.month.zhi;
  const shengWoElement = shengWo(dayElement);

  // 用月令系数调整后的五行分值
  const adjustedScores = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

  // 天干
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const wx = GAN_WUXING[fourPillars[pos].gan];
    const coeff = MONTHLY_COEFFICIENTS[monthZhi]?.[wx] || 1.0;
    adjustedScores[wx] += 36 * coeff;
  }

  // 地支藏干
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const zhi = fourPillars[pos].zhi;
    const cangs = ZHI_CANG[zhi] || [];
    for (const [cangGan, pct] of cangs) {
      const wx = GAN_WUXING[cangGan];
      const coeff = MONTHLY_COEFFICIENTS[monthZhi]?.[wx] || 1.0;
      adjustedScores[wx] += (pct) * coeff; // 地支基数100，pct已经是比例
    }
  }

  const total = Object.values(adjustedScores).reduce((a, b) => a + b, 0);
  const tongLei = adjustedScores[dayElement] + (shengWoElement ? adjustedScores[shengWoElement] : 0);
  const yiLei = total - tongLei;
  const ratio = tongLei / total;

  return { adjustedScores, total, tongLei, yiLei, ratio };
}

// ============= 主函数 =============
function analyzeStrength(fourPillars) {
  const dayGan = fourPillars.day.gan;
  const dayElement = GAN_WUXING[dayGan];
  const monthZhi = fourPillars.month.zhi;
  const monthCoeff = MONTHLY_COEFFICIENTS[monthZhi]?.[dayElement] || 1.0;
  const monthState = getMonthState(monthZhi, dayElement);

  // 1. 五行占比（显示用，对标测测）
  const wuxingDisplay = calculateWuxingDisplay(fourPillars);

  // 2. 十神占比（显示用，对标测测）
  const shiShenDisplay = calculateShiShenDisplay(fourPillars);

  // 3. 身强弱判断（内部逻辑）
  const internal = calculateStrengthInternal(fourPillars);
  const tongLeiRatio = Math.round(internal.ratio * 1000) / 10;

  let strength;
  if (tongLeiRatio > 60) strength = '身强';
  else if (tongLeiRatio > 52) strength = '偏强';
  else if (tongLeiRatio >= 48) strength = '中和';
  else if (tongLeiRatio >= 40) strength = '偏弱';
  else strength = '身弱';

  // 4. 喜用神
  const shengWoElement = shengWo(dayElement);
  let xiyong;
  if (tongLeiRatio > 50) {
    const keWoWx = keWo(dayElement);
    const woSheng = WUXING_SHENG[dayElement];
    const woKe = WUXING_KE[dayElement];
    xiyong = [...new Set([keWoWx, woSheng, woKe])].filter(Boolean);
  } else {
    xiyong = [...new Set([shengWoElement, dayElement])].filter(Boolean);
  }

  return {
    strength,
    tongLeiRatio,
    xiyong,
    monthState,
    monthCoeff,
    wuxingRatio: wuxingDisplay.ratio,
    shiShenRatio: shiShenDisplay.ratio,
    internal: {
      tongLei: Math.round(internal.tongLei),
      yiLei: Math.round(internal.yiLei),
      total: Math.round(internal.total),
    },
    summary: `${dayGan}(${dayElement})生于${monthZhi}月（${monthState}），` +
             `同类占比${tongLeiRatio}%，判定【${strength}】。` +
             `喜用：${xiyong.join('、')}。`,
  };
}

module.exports = { analyzeStrength, calculateWuxingDisplay, calculateShiShenDisplay, MONTHLY_COEFFICIENTS };
