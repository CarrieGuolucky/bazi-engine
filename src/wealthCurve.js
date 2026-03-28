/**
 * 财运曲线模块
 *
 * 可视化一生的财运走势
 * 输出每步大运+关键流年的财运评分
 * 前端用这个数据画曲线图
 */

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};
const ZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };

const MUKU_MAP = {
  '辰': '水', '戌': '火', '丑': '金', '未': '木',
};
const MUKU_CHONG = { '辰': '戌', '戌': '辰', '丑': '未', '未': '丑' };

/**
 * 计算某步大运/流年的财运评分
 */
function calculateWealthScore(dayMasterElement, xiyong, gan, zhi, fourPillars, kuCount) {
  const ganWx = GAN_WUXING[gan];
  const zhiWx = ZHI_WUXING[zhi];
  const caiElement = WUXING_KE[dayMasterElement]; // 财星五行
  const shiShangElement = WUXING_SHENG[dayMasterElement]; // 食伤五行（生财的）

  let score = 50;

  // 1. 天干是财星 → 大加分
  if (ganWx === caiElement) score += 20;
  // 天干是食伤（生财）→ 加分
  if (ganWx === shiShangElement) score += 10;
  // 天干是喜用 → 加分
  if (xiyong.includes(ganWx)) score += 8;

  // 2. 地支是财星 → 加分
  if (zhiWx === caiElement) score += 15;
  // 地支是食伤 → 加分
  if (zhiWx === shiShangElement) score += 8;
  // 地支是喜用 → 加分
  if (xiyong.includes(zhiWx)) score += 5;

  // 3. 是否冲开财库
  if (fourPillars) {
    const allZhi = [fourPillars.year.zhi, fourPillars.month.zhi, fourPillars.day.zhi, fourPillars.hour.zhi];
    for (const natalZhi of allZhi) {
      const kuElement = MUKU_MAP[natalZhi];
      if (kuElement && MUKU_CHONG[natalZhi] === zhi) {
        // 检查这个库是不是财库
        if (kuElement === caiElement) {
          score += 20; // 财库被冲开！
        }
      }
    }
  }

  // 4. 财库数量加成
  if (kuCount >= 3) score += 5;

  // 5. 比劫争财扣分（如果大运是比劫）
  if (ganWx === dayMasterElement) score -= 5;

  return Math.max(10, Math.min(100, Math.round(score)));
}

/**
 * 生成一生财运曲线数据
 */
function generateWealthCurve(baziData) {
  const { dayMasterElement, xiyong, fourPillars, daYun, muKu } = baziData;
  const kuCount = muKu ? muKu.kus.filter(k => k.relation === '财星').length : 0;

  const curve = [];

  // 1. 每步大运的财运评分
  for (const dy of daYun) {
    const gan = dy.ganZhi[0];
    const zhi = dy.ganZhi[1];
    const wealthScore = calculateWealthScore(dayMasterElement, xiyong, gan, zhi, fourPillars, kuCount);

    const point = {
      type: 'dayun',
      ganZhi: dy.ganZhi,
      startYear: dy.startYear,
      endYear: dy.endYear,
      startAge: dy.startAge,
      endAge: dy.endAge,
      midYear: Math.round((dy.startYear + dy.endYear) / 2),
      midAge: Math.round((dy.startAge + dy.endAge) / 2),
      wealthScore,
      isCurrent: dy.isCurrent || false,
      label: getWealthLabel(wealthScore),
    };

    // 检查是否有财库冲开
    const allNatalZhi = [fourPillars.year.zhi, fourPillars.month.zhi, fourPillars.day.zhi, fourPillars.hour.zhi];
    const caiElement = WUXING_KE[dayMasterElement];
    for (const nz of allNatalZhi) {
      if (MUKU_MAP[nz] === caiElement && MUKU_CHONG[nz] === zhi) {
        point.event = '财库冲开 💰';
        break;
      }
    }

    curve.push(point);
  }

  // 2. 关键流年的财运评分（当前大运内的每一年）
  const currentDY = daYun.find(d => d.isCurrent);
  const yearlyPoints = [];

  if (currentDY && currentDY.liuNian) {
    for (const ln of currentDY.liuNian) {
      const gan = ln.ganZhi[0];
      const zhi = ln.ganZhi[1];
      const wealthScore = calculateWealthScore(dayMasterElement, xiyong, gan, zhi, fourPillars, kuCount);

      yearlyPoints.push({
        type: 'liuNian',
        year: ln.year,
        ganZhi: ln.ganZhi,
        wealthScore,
        isCurrent: ln.isCurrent || false,
        label: getWealthLabel(wealthScore),
      });
    }
  }

  // 3. 找出财运高峰和低谷
  const peakDaYun = [...curve].sort((a, b) => b.wealthScore - a.wealthScore)[0];
  const lowestDaYun = [...curve].sort((a, b) => a.wealthScore - b.wealthScore)[0];
  const peakYear = yearlyPoints.length > 0 ? [...yearlyPoints].sort((a, b) => b.wealthScore - a.wealthScore)[0] : null;

  // 4. 总结
  const summary = buildWealthSummary(curve, peakDaYun, lowestDaYun, peakYear, kuCount);

  return {
    curve,
    yearlyPoints,
    kuCount,
    peakDaYun,
    lowestDaYun,
    peakYear,
    summary,
  };
}

function getWealthLabel(score) {
  if (score >= 80) return '财运大旺 💰';
  if (score >= 65) return '财运不错 📈';
  if (score >= 50) return '财运平稳 ➡️';
  if (score >= 35) return '财运偏弱 📉';
  return '需要积蓄 🏦';
}

function buildWealthSummary(curve, peak, lowest, peakYear, kuCount) {
  let s = '';

  s += `【一生财运走势】\n`;
  s += `财库数量：${kuCount}个\n`;
  s += `财运高峰：${peak.ganZhi}大运（${peak.startAge}-${peak.endAge}岁，${peak.startYear}-${peak.endYear}）${peak.wealthScore}分`;
  if (peak.event) s += ` ${peak.event}`;
  s += '\n';
  s += `财运低谷：${lowest.ganZhi}大运（${lowest.startAge}-${lowest.endAge}岁，${lowest.startYear}-${lowest.endYear}）${lowest.wealthScore}分\n`;

  if (peakYear) {
    s += `近期最佳：${peakYear.year}年${peakYear.ganZhi} ${peakYear.wealthScore}分\n`;
  }

  s += '\n【大运财运走势】\n';
  curve.forEach(c => {
    const bar = '█'.repeat(Math.round(c.wealthScore / 10)) + '░'.repeat(10 - Math.round(c.wealthScore / 10));
    const tag = c.isCurrent ? ' ← 当前' : '';
    const event = c.event ? ` ${c.event}` : '';
    s += `${c.ganZhi}（${c.startAge}-${c.endAge}岁）${bar} ${c.wealthScore}分 ${c.label}${event}${tag}\n`;
  });

  return s;
}

module.exports = { generateWealthCurve };
