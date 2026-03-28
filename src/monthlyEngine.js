/**
 * 流月分析模块
 *
 * 比流年更细，每月运势
 * 用户粘性：每月初来看当月建议
 */

const { Solar } = require('lunar-javascript');

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};
const ZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};
const GAN_YINYANG = { '甲': true, '乙': false, '丙': true, '丁': false, '戊': true, '己': false, '庚': true, '辛': false, '壬': true, '癸': false };
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

// 月干推算：年干决定正月（寅月）的天干
// 甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
const MONTH_GAN_START = { '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0 };

function getShiShen(dayMaster, target) {
  const dmWx = GAN_WUXING[dayMaster];
  const tgWx = GAN_WUXING[target];
  if (!tgWx) return null;
  const sameP = GAN_YINYANG[dayMaster] === GAN_YINYANG[target];
  if (dmWx === tgWx) return sameP ? '比肩' : '劫财';
  if (WUXING_SHENG[dmWx] === tgWx) return sameP ? '食神' : '伤官';
  if (WUXING_SHENG[tgWx] === dmWx) return sameP ? '偏印' : '正印';
  if (WUXING_KE[dmWx] === tgWx) return sameP ? '偏财' : '正财';
  if (WUXING_KE[tgWx] === dmWx) return sameP ? '七杀' : '正官';
  return null;
}

// 每月十神的建议
const MONTH_TIPS = {
  '比肩': { focus: '独立执行', good: '适合独自完成重要任务、展示个人实力', watch: '竞争压力大，别跟同行硬碰' },
  '劫财': { focus: '社交合作', good: '适合拓展人脉、合作谈判', watch: '防财务纠纷，少借钱给朋友' },
  '食神': { focus: '创意产出', good: '灵感爆棚，适合创作、提案、做内容', watch: '别太安逸，保持行动力' },
  '伤官': { focus: '突破创新', good: '适合打破常规、提新方案、挑战难题', watch: '管住嘴，别得罪领导/客户' },
  '偏印': { focus: '学习研究', good: '适合学新技能、做研究、考证', watch: '别钻牛角尖' },
  '正印': { focus: '贵人运', good: '贵人月！适合面试、找mentor、考试', watch: '别太依赖别人' },
  '偏财': { focus: '投资理财', good: '适合见客户、谈合作、开源', watch: '控制冲动消费' },
  '正财': { focus: '正当收入', good: '适合谈薪资、签合同、收款', watch: '别贪心' },
  '七杀': { focus: '压力挑战', good: '适合攻坚、竞标、高难度任务', watch: '注意压力和睡眠' },
  '正官': { focus: '职场发展', good: '适合见领导、面试、谈晋升', watch: '别挑战权威' },
};

/**
 * 计算某年12个月的流月
 * @param {string} dayMaster - 日主天干
 * @param {Array} xiyong - 喜用神五行
 * @param {number} year - 年份
 * @param {Object} fourPillars - 四柱（用于检测合冲）
 */
function analyzeMonthly(dayMaster, xiyong, year, fourPillars) {
  const dmWx = GAN_WUXING[dayMaster];

  // 获取该年的年干
  const yearGanIdx = (year - 4) % 10;
  const yearGan = TIAN_GAN[yearGanIdx];

  // 月干起始偏移
  const startGanIdx = MONTH_GAN_START[yearGan];

  const months = [];

  for (let m = 1; m <= 12; m++) {
    // 月支：正月=寅(2), 二月=卯(3)... 十一月=子(0), 十二月=丑(1)
    const zhiIdx = (m + 1) % 12;
    const zhi = DI_ZHI[zhiIdx];

    // 月干
    const ganIdx = (startGanIdx + m - 1) % 10;
    const gan = TIAN_GAN[ganIdx];
    const ganZhi = gan + zhi;

    // 十神
    const ganSS = getShiShen(dayMaster, gan);
    const ganWx = GAN_WUXING[gan];
    const zhiWx = ZHI_WUXING[zhi];
    const isGanXiyong = xiyong.includes(ganWx);
    const isZhiXiyong = xiyong.includes(zhiWx);

    // 评分
    let score = 50;
    if (isGanXiyong) score += 20;
    if (isZhiXiyong) score += 20;
    if (ganSS === '正印' || ganSS === '偏印') score += 5; // 印月学习运好
    if (ganSS === '正财' || ganSS === '偏财') score += 5; // 财月赚钱机会
    if (ganSS === '七杀') score -= 5; // 压力月
    score = Math.max(10, Math.min(100, score));

    // 月份建议
    const tip = MONTH_TIPS[ganSS] || { focus: '平稳', good: '保持节奏', watch: '无特别注意' };

    // 检测与命盘的合冲
    const interactions = [];
    if (fourPillars) {
      const allZhi = [fourPillars.year.zhi, fourPillars.month.zhi, fourPillars.day.zhi, fourPillars.hour.zhi];
      const ZHI_CHONG = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };
      const ZHI_HE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };

      for (const oz of allZhi) {
        if (ZHI_CHONG[zhi] === oz) interactions.push(`${zhi}${oz}冲 — 变动月`);
        if (ZHI_HE[zhi] === oz) interactions.push(`${zhi}${oz}合 — 顺利月`);
      }
    }

    // 阳历月份范围（近似）
    const solarMonth = m <= 11 ? m + 1 : (m === 12 ? 1 : m);
    const monthLabel = `${solarMonth}月`;

    months.push({
      month: m,
      solarMonth,
      monthLabel,
      ganZhi,
      gan, zhi,
      ganShiShen: ganSS,
      ganWuxing: ganWx,
      zhiWuxing: zhiWx,
      isGanXiyong,
      isZhiXiyong,
      score,
      stars: score >= 80 ? '★★★★★' : score >= 65 ? '★★★★☆' : score >= 50 ? '★★★☆☆' : score >= 35 ? '★★☆☆☆' : '★☆☆☆☆',
      focus: tip.focus,
      good: tip.good,
      watch: tip.watch,
      interactions,
    });
  }

  // 找最佳月份和需注意月份
  const bestMonths = months.filter(m => m.score >= 70).sort((a, b) => b.score - a.score);
  const cautionMonths = months.filter(m => m.score < 40).sort((a, b) => a.score - b.score);

  return { year, months, bestMonths, cautionMonths };
}

module.exports = { analyzeMonthly };
