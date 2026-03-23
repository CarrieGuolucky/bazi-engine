/**
 * 流年分析 Agent
 * 职责：分析当前大运+未来3-5年流年，找关键时间节点
 * 输入：baziAgent的输出
 * 输出：时间线分析 + 关键年份标记
 */

// 天干相合
const GAN_HE = {
  '甲己': '土', '己甲': '土',
  '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水',
  '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
};

// 天干相冲
const GAN_CHONG = ['甲庚', '庚甲', '乙辛', '辛乙', '丙壬', '壬丙', '丁癸', '癸丁'];

// 地支六合
const ZHI_HE = {
  '子丑': '土', '丑子': '土', '寅亥': '木', '亥寅': '木',
  '卯戌': '火', '戌卯': '火', '辰酉': '金', '酉辰': '金',
  '巳申': '水', '申巳': '水', '午未': '火', '未午': '火',
};

// 地支相冲
const ZHI_CHONG = ['子午', '午子', '丑未', '未丑', '寅申', '申寅', '卯酉', '酉卯', '辰戌', '戌辰', '巳亥', '亥巳'];

// 五行生克
const WUXING_SHENG = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const WUXING_KE = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

const ganWuXing = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
const zhiWuXing = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

// 十神映射
function getTenGod(dayMaster, target) {
  const dmWx = ganWuXing[dayMaster];
  const tgWx = ganWuXing[target] || zhiWuXing[target];
  if (!tgWx) return '未知';

  const dmYin = '乙丁己辛癸'.includes(dayMaster);
  const tgYin = '乙丁己辛癸丑卯巳未酉亥'.includes(target);
  const samePolarity = dmYin === tgYin;

  if (dmWx === tgWx) return samePolarity ? '比肩' : '劫财';
  if (WUXING_SHENG[dmWx] === tgWx) return samePolarity ? '食神' : '伤官';
  if (WUXING_SHENG[tgWx] === dmWx) return samePolarity ? '偏印' : '正印';
  if (WUXING_KE[dmWx] === tgWx) return samePolarity ? '偏财' : '正财';
  if (WUXING_KE[tgWx] === dmWx) return samePolarity ? '七杀' : '正官';
  return '未知';
}

/**
 * 流年分析Agent主函数
 */
function runLiuNianAgent(baziData) {
  const { dayMaster, fourPillars, daYun, strength, xiyong } = baziData;

  // 找到当前大运
  const currentDaYun = daYun.find(d => d.isCurrent);
  if (!currentDaYun) return { error: '未找到当前大运' };

  // 找到下一步大运
  const currentIndex = daYun.indexOf(currentDaYun);
  const nextDaYun = daYun[currentIndex + 1] || null;

  // 分析当前大运
  const currentDaYunAnalysis = analyzePillar(dayMaster, currentDaYun.ganZhi, xiyong, fourPillars);

  // 分析未来流年（当前年到大运结束+下步大运前3年）
  const liuNianAnalysis = [];
  const yearsToAnalyze = currentDaYun.liuNian || [];

  for (const ln of yearsToAnalyze) {
    if (ln.year < 2026 || ln.year > 2035) continue;

    const analysis = analyzePillar(dayMaster, ln.ganZhi, xiyong, fourPillars);

    // 检测大运交接
    if (nextDaYun && ln.year === nextDaYun.startYear) {
      analysis.isDaYunTransition = true;
      analysis.newDaYun = nextDaYun.ganZhi;
      analysis.events.push('大运交接年，人生方向可能有重大变化');
    }

    // 重要度评分
    analysis.importance = calculateImportance(analysis);

    liuNianAnalysis.push({
      year: ln.year,
      ganZhi: ln.ganZhi,
      isCurrent: ln.isCurrent,
      ...analysis,
    });
  }

  // 找关键年份
  const keyYears = liuNianAnalysis
    .filter(y => y.importance >= 7)
    .sort((a, b) => b.importance - a.importance);

  return {
    currentDaYun: {
      ganZhi: currentDaYun.ganZhi,
      period: `${currentDaYun.startYear}-${currentDaYun.endYear}`,
      age: `${currentDaYun.startAge}-${currentDaYun.endAge}岁`,
      ...currentDaYunAnalysis,
    },
    nextDaYun: nextDaYun ? {
      ganZhi: nextDaYun.ganZhi,
      startYear: nextDaYun.startYear,
      analysis: analyzePillar(dayMaster, nextDaYun.ganZhi, xiyong, fourPillars),
    } : null,
    liuNianAnalysis,
    keyYears,
    daYunTransitionYear: nextDaYun ? nextDaYun.startYear : null,
  };
}

function analyzePillar(dayMaster, ganZhi, xiyong, fourPillars) {
  const gan = ganZhi[0];
  const zhi = ganZhi[1];
  const ganGod = getTenGod(dayMaster, gan);
  const zhiGod = getTenGod(dayMaster, zhi);
  const ganWx = ganWuXing[gan];
  const zhiWx = zhiWuXing[zhi];

  const isGanXiyong = xiyong.includes(ganWx);
  const isZhiXiyong = xiyong.includes(zhiWx);

  const events = [];
  const interactions = [];

  // 检查与原局天干的合冲
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const originalGan = fourPillars[pos].gan;
    const originalZhi = fourPillars[pos].zhi;
    const posName = { year: '年', month: '月', day: '日', hour: '时' }[pos];

    // 天干合
    const ganKey = gan + originalGan;
    if (GAN_HE[ganKey]) {
      interactions.push(`${gan}${originalGan}合${GAN_HE[ganKey]}（${posName}干）`);
      if (pos === 'day') events.push('流年天干合日主，个人状态有重大变化');
    }

    // 天干冲
    if (GAN_CHONG.includes(ganKey)) {
      interactions.push(`${gan}${originalGan}冲（${posName}干）`);
    }

    // 地支合
    const zhiKey = zhi + originalZhi;
    if (ZHI_HE[zhiKey]) {
      interactions.push(`${zhi}${originalZhi}合${ZHI_HE[zhiKey]}（${posName}支）`);
    }

    // 地支冲
    if (ZHI_CHONG.includes(zhiKey)) {
      interactions.push(`${zhi}${originalZhi}冲（${posName}支）`);
      if (pos === 'day') events.push('流年地支冲日支（配偶宫），感情或家庭有变动');
      if (pos === 'month') events.push('流年冲月支（事业宫），工作有变动');
    }
  }

  // 生成事件描述
  if (ganGod === '正财' || ganGod === '偏财') events.push('财星透出，有财运/赚钱机会');
  if (ganGod === '正官') events.push('正官透出，可能有升职/稳定机会');
  if (ganGod === '七杀') events.push('七杀透出，有压力但也有突破机会');
  if (ganGod === '食神' || ganGod === '伤官') events.push('食伤透出，创造力旺/想做新东西');
  if (ganGod === '正印' || ganGod === '偏印') events.push('印星透出，有贵人/学习机会');

  return {
    gan: { char: gan, wuxing: ganWx, tenGod: ganGod, isXiyong: isGanXiyong },
    zhi: { char: zhi, wuxing: zhiWx, tenGod: zhiGod, isXiyong: isZhiXiyong },
    overallFavorable: isGanXiyong && isZhiXiyong ? 'very_good' :
                      isGanXiyong || isZhiXiyong ? 'mixed' : 'challenging',
    interactions,
    events,
    isDaYunTransition: false,
  };
}

function calculateImportance(analysis) {
  let score = 5; // 基础分
  if (analysis.overallFavorable === 'very_good') score += 2;
  if (analysis.overallFavorable === 'challenging') score += 1;
  if (analysis.interactions.length > 2) score += 2;
  if (analysis.isDaYunTransition) score += 3;
  if (analysis.events.length > 2) score += 1;
  return Math.min(score, 10);
}

module.exports = { runLiuNianAgent };
