/**
 * 大运流年动态引擎
 *
 * 整合 神煞×墓库×格局×合冲×刑破害 → 逐年交叉分析
 * 每一年输出：综合评分 + 触发事件 + 具体建议
 */

const { detectXingPoHaiTrigger } = require('./xingpohai');
const { getStageForDynamic } = require('./shierChangSheng');
const { detectKongWangFill } = require('./kongwang');

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

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干合
const GAN_HE = { '甲己': '土', '己甲': '土', '乙庚': '金', '庚乙': '金', '丙辛': '水', '辛丙': '水', '丁壬': '木', '壬丁': '木', '戊癸': '火', '癸戊': '火' };
// 地支六合
const ZHI_HE = { '子丑': '土', '丑子': '土', '寅亥': '木', '亥寅': '木', '卯戌': '火', '戌卯': '火', '辰酉': '金', '酉辰': '金', '巳申': '水', '申巳': '水', '午未': '火', '未午': '火' };
// 地支冲
const ZHI_CHONG_MAP = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };

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

function getZhiShiShen(dayMaster, zhi) {
  const dmWx = GAN_WUXING[dayMaster];
  const tgWx = ZHI_WUXING[zhi];
  if (!tgWx) return null;
  // 用地支本气的阴阳
  const zhiYin = '丑卯巳未酉亥'.includes(zhi);
  const dmYin = !GAN_YINYANG[dayMaster];
  const sameP = dmYin === zhiYin;
  if (dmWx === tgWx) return sameP ? '比肩' : '劫财';
  if (WUXING_SHENG[dmWx] === tgWx) return sameP ? '食神' : '伤官';
  if (WUXING_SHENG[tgWx] === dmWx) return sameP ? '偏印' : '正印';
  if (WUXING_KE[dmWx] === tgWx) return sameP ? '偏财' : '正财';
  if (WUXING_KE[tgWx] === dmWx) return sameP ? '七杀' : '正官';
  return null;
}

// ======= 神煞触发检测（流年/大运地支是否激活神煞） =======

function getSanHeGroup(zhi) {
  if (['申', '子', '辰'].includes(zhi)) return 'water';
  if (['寅', '午', '戌'].includes(zhi)) return 'fire';
  if (['亥', '卯', '未'].includes(zhi)) return 'wood';
  if (['巳', '酉', '丑'].includes(zhi)) return 'metal';
  return null;
}

const TIANYI_MAP = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
};
const TAOHUA_MAP = { 'water': '酉', 'fire': '卯', 'wood': '子', 'metal': '午' };
const YIMA_MAP = { 'water': '寅', 'fire': '申', 'wood': '巳', 'metal': '亥' };
const HUAGAI_MAP = { 'water': '辰', 'fire': '戌', 'wood': '未', 'metal': '丑' };
const HONGLUAN_MAP = { '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌', '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰' };
const TIANXI_MAP = { '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰', '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌' };
const LUSHEN_MAP = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
const YANGREN_MAP = { '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午', '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑' };

/**
 * 检测某个地支触发了哪些神煞
 */
function detectShenShaTrigger(zhi, dayGan, yearZhi) {
  const triggers = [];
  const yearGroup = getSanHeGroup(yearZhi);

  // 天乙贵人
  if ((TIANYI_MAP[dayGan] || []).includes(zhi)) {
    triggers.push({ name: '天乙贵人', type: '吉', desc: '贵人相助，逢凶化吉' });
  }
  // 桃花
  if (yearGroup && TAOHUA_MAP[yearGroup] === zhi) {
    triggers.push({ name: '桃花', type: '中', desc: '异性缘旺，利感情但注意分寸' });
  }
  // 驿马
  if (yearGroup && YIMA_MAP[yearGroup] === zhi) {
    triggers.push({ name: '驿马', type: '中', desc: '出行、搬家、跳槽、海外发展的机会' });
  }
  // 华盖
  if (yearGroup && HUAGAI_MAP[yearGroup] === zhi) {
    triggers.push({ name: '华盖', type: '中', desc: '适合学习、创作、独处思考' });
  }
  // 红鸾
  if (HONGLUAN_MAP[yearZhi] === zhi) {
    triggers.push({ name: '红鸾', type: '吉', desc: '正缘桃花，利结婚、订婚' });
  }
  // 天喜
  if (TIANXI_MAP[yearZhi] === zhi) {
    triggers.push({ name: '天喜', type: '吉', desc: '喜事临门，婚庆添丁' });
  }
  // 禄神
  if (LUSHEN_MAP[dayGan] === zhi) {
    triggers.push({ name: '禄神', type: '吉', desc: '正财禄，收入增加' });
  }
  // 羊刃
  if (YANGREN_MAP[dayGan] === zhi) {
    triggers.push({ name: '羊刃', type: '中', desc: '力量激增但双刃剑，大进大出需控制风险' });
  }

  return triggers;
}

// ======= 墓库冲检测 =======

const MUKU_MAP = {
  '辰': { kuOf: '水', chongBy: '戌' },
  '戌': { kuOf: '火', chongBy: '辰' },
  '丑': { kuOf: '金', chongBy: '未' },
  '未': { kuOf: '木', chongBy: '丑' },
};

function detectMuKuChong(zhi, fourPillars, dayMasterElement) {
  const triggers = [];
  const positions = [
    { pos: '年支', z: fourPillars.year.zhi },
    { pos: '月支', z: fourPillars.month.zhi },
    { pos: '日支', z: fourPillars.day.zhi },
    { pos: '时支', z: fourPillars.hour.zhi },
  ];

  for (const { pos, z } of positions) {
    const mk = MUKU_MAP[z];
    if (mk && mk.chongBy === zhi) {
      // 确定这个库对日主的意义
      const rel = getWuxingRelation(dayMasterElement, mk.kuOf);
      const kuName = rel === '财星' ? '财库' : rel === '官杀' ? '官库' : rel === '印星' ? '印库' : rel === '食伤' ? '食伤库' : '比劫库';
      triggers.push({
        name: `${kuName}冲开`,
        kuPosition: pos,
        kuZhi: z,
        chongBy: zhi,
        desc: `${zhi}冲${z}（${pos}），${kuName}打开`,
      });
    }
  }
  return triggers;
}

function getWuxingRelation(dayElement, targetElement) {
  if (dayElement === targetElement) return '比劫';
  if (WUXING_SHENG[dayElement] === targetElement) return '食伤';
  if (WUXING_SHENG[targetElement] === dayElement) return '印星';
  if (WUXING_KE[dayElement] === targetElement) return '财星';
  if (WUXING_KE[targetElement] === dayElement) return '官杀';
  return '未知';
}

// ======= 格局影响检测 =======

function detectGeJuImpact(ganShiShen, zhiShiShen, geJuName, geJuShiShen) {
  const impacts = [];

  // 提取基础格局类型
  const baseGeJu = geJuName.replace('杂气', '');

  // 伤官见官
  if (baseGeJu === '正官格' && (ganShiShen === '伤官' || zhiShiShen === '伤官')) {
    impacts.push({ name: '伤官见官', severity: '警告', desc: '流年伤官冲击正官格，易与上级/体制冲突，不宜在体制内硬刚，适合做自己的事' });
  }

  // 食神制杀（七杀格遇食神）
  if (baseGeJu === '七杀格' && (ganShiShen === '食神' || zhiShiShen === '食神')) {
    impacts.push({ name: '食神制杀', severity: '利好', desc: '食神制住七杀，化压力为动力，有突破' });
  }

  // 枭神夺食
  if ((ganShiShen === '偏印' && zhiShiShen === '食神') || (ganShiShen === '食神' && zhiShiShen === '偏印')) {
    impacts.push({ name: '枭神夺食', severity: '注意', desc: '偏印克食神，才华被压制，不宜做自媒体/内容，适合走技术路线' });
  }

  // 印星强化印格
  if (baseGeJu.includes('印格') && (ganShiShen === '正印' || ganShiShen === '偏印')) {
    impacts.push({ name: '印星助格', severity: '利好', desc: '印星流年强化印格，利学习、考证、升学' });
  }

  // 财星破印
  if (baseGeJu.includes('印格') && (ganShiShen === '正财' || ganShiShen === '偏财')) {
    impacts.push({ name: '财星破印', severity: '注意', desc: '财星克印星，花钱多/物质诱惑大，学业可能受影响' });
  }

  // 官星助官格
  if (baseGeJu === '正官格' && (ganShiShen === '正官' || ganShiShen === '正印')) {
    impacts.push({ name: '官印相生', severity: '利好', desc: '官星/印星流年，利升职、考试、获得认可' });
  }

  // 比劫争财（财格遇比劫）
  if ((baseGeJu === '正财格' || baseGeJu === '偏财格') && (ganShiShen === '比肩' || ganShiShen === '劫财')) {
    impacts.push({ name: '比劫争财', severity: '警告', desc: '竞争者出现，防合伙纠纷和财务损失' });
  }

  // 食伤生财
  if ((ganShiShen === '食神' || ganShiShen === '伤官') && (zhiShiShen === '偏财' || zhiShiShen === '正财')) {
    impacts.push({ name: '食伤生财', severity: '利好', desc: '才华变现的好时机，适合推产品、做内容' });
  }

  return impacts;
}

// ======= 合冲检测 =======

function detectHeChong(gan, zhi, fourPillars) {
  const interactions = [];
  const POS_NAME = { year: '年', month: '月', day: '日', hour: '时' };
  const POS_GONG = { year: '父母宫', month: '事业宫', day: '配偶宫', hour: '子女宫' };

  for (const pos of ['year', 'month', 'day', 'hour']) {
    const oGan = fourPillars[pos].gan;
    const oZhi = fourPillars[pos].zhi;
    const pn = POS_NAME[pos];
    const gong = POS_GONG[pos];

    // 天干合
    const ganKey = gan + oGan;
    if (GAN_HE[ganKey]) {
      interactions.push({ type: '天干合', desc: `${gan}${oGan}合${GAN_HE[ganKey]}（${pn}干）`, gong, significance: pos === 'day' ? '合日主，个人重大变化' : `合${pn}干` });
    }

    // 地支六合
    const zhiKey = zhi + oZhi;
    if (ZHI_HE[zhiKey]) {
      interactions.push({ type: '地支合', desc: `${zhi}${oZhi}合${ZHI_HE[zhiKey]}（${pn}支）`, gong, significance: pos === 'day' ? '合配偶宫，感情有进展' : `合${gong}` });
    }

    // 地支冲
    if (ZHI_CHONG_MAP[zhi] === oZhi) {
      let sig = `冲${gong}`;
      if (pos === 'day') sig = '冲配偶宫，感情/家庭变动';
      if (pos === 'month') sig = '冲事业宫，工作变动（跳槽/转行/升职）';
      if (pos === 'year') sig = '冲年柱，家族/长辈相关变动';
      if (pos === 'hour') sig = '冲时柱，子女或下属相关变动';
      interactions.push({ type: '地支冲', desc: `${zhi}${oZhi}冲（${pn}支）`, gong, significance: sig });
    }
  }

  return interactions;
}

// ======= 综合评分 =======

function calculateScore(ganXiyong, zhiXiyong, shenShaTriggers, muKuTriggers, geJuImpacts, heChong, xphTriggers) {
  let score = 50; // 基础分50

  // 喜用 +15/each, 忌神 -15/each
  if (ganXiyong) score += 15; else score -= 10;
  if (zhiXiyong) score += 15; else score -= 10;

  // 神煞
  for (const t of shenShaTriggers) {
    if (t.type === '吉') score += 10;
    if (t.type === '中') score += 3;
  }

  // 墓库冲开
  for (const t of muKuTriggers) {
    if (t.name.includes('财库')) score += 15;
    if (t.name.includes('官库')) score += 12;
    if (t.name.includes('印库')) score += 10;
  }

  // 格局影响
  for (const imp of geJuImpacts) {
    if (imp.severity === '利好') score += 10;
    if (imp.severity === '警告') score -= 12;
    if (imp.severity === '注意') score -= 5;
  }

  // 合冲
  for (const hc of heChong) {
    if (hc.type === '地支冲') score -= 5;
    if (hc.type === '天干合' || hc.type === '地支合') score += 5;
  }

  // 刑破害
  if (xphTriggers) {
    for (const t of xphTriggers) {
      if (t.type === '刑' && t.severity === '严重') score -= 15;
      if (t.type === '刑' && t.severity === '注意') score -= 8;
      if (t.type === '破') score -= 5;
      if (t.type === '害') score -= 6;
    }
  }

  // 限制范围
  return Math.max(10, Math.min(100, score));
}

function scoreToStars(score) {
  if (score >= 80) return '★★★★★';
  if (score >= 65) return '★★★★☆';
  if (score >= 50) return '★★★☆☆';
  if (score >= 35) return '★★☆☆☆';
  return '★☆☆☆☆';
}

function scoreToLabel(score) {
  if (score >= 80) return '大吉';
  if (score >= 65) return '中吉';
  if (score >= 50) return '平稳';
  if (score >= 35) return '偏弱';
  return '需谨慎';
}

// ======= 生成建议 =======

function generateAdvice(ganShiShen, zhiShiShen, shenShaTriggers, muKuTriggers, geJuImpacts, xiyong, score) {
  const advice = [];

  // 基于神煞
  const ssNames = shenShaTriggers.map(t => t.name);
  if (ssNames.includes('桃花') || ssNames.includes('红鸾')) {
    advice.push('感情：桃花/红鸾年，单身者适合主动出击，已婚者注意经营关系');
  }
  if (ssNames.includes('驿马')) {
    advice.push('变动：驿马年适合出行、搬家、跳槽、开拓新市场');
  }
  if (ssNames.includes('天乙贵人')) {
    advice.push('贵人：遇到困难有人帮，适合多社交、找mentor');
  }
  if (ssNames.includes('禄神')) {
    advice.push('收入：禄神年正财运好，适合争取加薪/涨价');
  }
  if (ssNames.includes('羊刃')) {
    advice.push('风险：羊刃年能量大但要控制，大进大出注意风控');
  }

  // 基于墓库
  if (muKuTriggers.some(t => t.name.includes('财库'))) {
    advice.push('财运：财库冲开，有大的财务机会，但也可能大笔支出');
  }
  if (muKuTriggers.some(t => t.name.includes('官库'))) {
    advice.push('事业：官库冲开，有升职/权力变动的机会');
  }

  // 基于格局影响
  for (const imp of geJuImpacts) {
    if (imp.name === '食伤生财') {
      advice.push('创业：食伤生财年，适合推出产品、做内容变现');
    }
    if (imp.name === '伤官见官') {
      advice.push('职场：伤官见官年，不宜跟领导硬碰硬，适合走自己的路');
    }
    if (imp.name === '官印相生') {
      advice.push('发展：官印相生年，适合考试、升职、获取资质认证');
    }
  }

  // 基于十神
  if (!advice.length) {
    if (ganShiShen === '偏财' || ganShiShen === '正财') {
      advice.push('财运：财星透出，有赚钱机会');
    }
    if (ganShiShen === '正官' || ganShiShen === '七杀') {
      advice.push('事业：官杀透出，事业有压力也有机会');
    }
    if (ganShiShen === '正印' || ganShiShen === '偏印') {
      advice.push('学习：印星透出，适合学习进修');
    }
  }

  return advice;
}

// ======= 主函数 =======

/**
 * 动态分析引擎
 * @param {Object} baziData - runBaziAgent 的完整输出
 * @param {number} startYear - 分析起始年（默认当前年）
 * @param {number} endYear - 分析结束年（默认+10年）
 */
function runDynamicEngine(baziData, startYear = 2026, endYear = 2036) {
  const { fourPillars, dayMaster, dayMasterElement, xiyong, daYun, geJu, shenSha, muKu } = baziData;
  const yearZhi = fourPillars.year.zhi;
  const geJuName = geJu ? geJu.name : '';
  const geJuShiShen = geJu ? geJu.shiShen : '';

  const yearAnalysis = [];

  for (let year = startYear; year <= endYear; year++) {
    // 计算流年干支
    const ganIdx = (year - 4) % 10;
    const zhiIdx = (year - 4) % 12;
    const gan = TIAN_GAN[ganIdx];
    const zhi = DI_ZHI[zhiIdx];
    const ganZhi = gan + zhi;

    // 十神
    const ganShiShen = getShiShen(dayMaster, gan);
    const zhiShiShen = getZhiShiShen(dayMaster, zhi);

    // 喜用判定
    const ganWx = GAN_WUXING[gan];
    const zhiWx = ZHI_WUXING[zhi];
    const ganXiyong = xiyong.includes(ganWx);
    const zhiXiyong = xiyong.includes(zhiWx);

    // 找当前所在大运
    const currentDY = daYun.find(d => d.startYear <= year && year <= d.endYear);
    const isDaYunTransition = currentDY && year === currentDY.startYear;

    // 1. 神煞触发
    const shenShaTriggers = detectShenShaTrigger(zhi, dayMaster, yearZhi);

    // 2. 墓库冲
    const muKuTriggers = detectMuKuChong(zhi, fourPillars, dayMasterElement);

    // 3. 格局影响
    const geJuImpacts = detectGeJuImpact(ganShiShen, zhiShiShen, geJuName, geJuShiShen);

    // 4. 合冲
    const heChong = detectHeChong(gan, zhi, fourPillars);

    // 5. 刑破害
    const xphTriggers = detectXingPoHaiTrigger(zhi, fourPillars);

    // 5.5 十二长生（日主在流年地支的阶段）
    const changShengStage = getStageForDynamic(dayMaster, zhi);

    // 5.6 空亡填实检测
    const kongwangZhi = baziData.kongWangAnalysis ? baziData.kongWangAnalysis.kongwang : baziData.shenSha.kongwang;
    const kongwangFill = detectKongWangFill(zhi, kongwangZhi);

    // 6. 综合评分
    const score = calculateScore(ganXiyong, zhiXiyong, shenShaTriggers, muKuTriggers, geJuImpacts, heChong, xphTriggers);
    const stars = scoreToStars(score);
    const label = scoreToLabel(score);

    // 7. 建议
    const advice = generateAdvice(ganShiShen, zhiShiShen, shenShaTriggers, muKuTriggers, geJuImpacts, xiyong, score);
    // 刑破害建议
    for (const t of xphTriggers) {
      if (t.type === '刑') advice.push(`注意：${t.name}，${t.desc}`);
      if (t.type === '害' && t.position === '日支') advice.push(`感情：${t.name}，夫妻宫有暗中消耗，注意沟通`);
    }

    yearAnalysis.push({
      year,
      ganZhi,
      gan: { char: gan, wuxing: ganWx, shiShen: ganShiShen, isXiyong: ganXiyong },
      zhi: { char: zhi, wuxing: zhiWx, shiShen: zhiShiShen, isXiyong: zhiXiyong },
      daYun: currentDY ? currentDY.ganZhi : null,
      isDaYunTransition,
      shenShaTriggers,
      muKuTriggers,
      geJuImpacts,
      heChong,
      xphTriggers,
      changSheng: changShengStage,
      kongwangFill,
      score,
      stars,
      label,
      advice,
    });
  }

  return {
    yearAnalysis,
    bestYears: yearAnalysis.filter(y => y.score >= 70).sort((a, b) => b.score - a.score),
    warningYears: yearAnalysis.filter(y => y.score < 40).sort((a, b) => a.score - b.score),
  };
}

module.exports = { runDynamicEngine };
