/**
 * 十二长生模块
 *
 * 每个五行在十二地支中经历一个生命周期：
 * 长生→沐浴→冠带→临官→帝旺→衰→病→死→墓→绝→胎→养
 *
 * 用于：
 * 1. 判断日主在各柱的生命阶段（更细腻的身强弱分析）
 * 2. 大运流年中日主处于什么阶段（上升期还是衰退期）
 * 3. 判断其他十神（财星、官星等）的旺衰状态
 */

// 十二长生顺序
const STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

// 阳干起始位置（长生位）
// 阳干顺行，阴干逆行
const YANG_START = {
  '甲': '亥',  // 木长生在亥
  '丙': '寅',  // 火长生在寅
  '戊': '寅',  // 土同火，长生在寅
  '庚': '巳',  // 金长生在巳
  '壬': '申',  // 水长生在申
};

const YIN_START = {
  '乙': '午',  // 阴木长生在午
  '丁': '酉',  // 阴火长生在酉
  '己': '酉',  // 阴土同火，长生在酉
  '辛': '子',  // 阴金长生在子
  '癸': '卯',  // 阴水长生在卯
};

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GAN_YINYANG = { '甲': true, '乙': false, '丙': true, '丁': false, '戊': true, '己': false, '庚': true, '辛': false, '壬': true, '癸': false };

function zhiIndex(z) { return DI_ZHI.indexOf(z); }

/**
 * 获取某天干在某地支的十二长生阶段
 */
function getStage(gan, zhi) {
  const isYang = GAN_YINYANG[gan];
  const startZhi = isYang ? YANG_START[gan] : YIN_START[gan];
  if (!startZhi) return null;

  const startIdx = zhiIndex(startZhi);
  const targetIdx = zhiIndex(zhi);

  let diff;
  if (isYang) {
    // 阳干顺行
    diff = (targetIdx - startIdx + 12) % 12;
  } else {
    // 阴干逆行
    diff = (startIdx - targetIdx + 12) % 12;
  }

  return STAGES[diff];
}

// 阶段的能量值（用于辅助身强弱判断）
const STAGE_ENERGY = {
  '长生': 7, '沐浴': 5, '冠带': 8, '临官': 9, '帝旺': 10,
  '衰': 4, '病': 3, '死': 2, '墓': 1, '绝': 0, '胎': 1, '养': 3,
};

// 阶段的含义解读
const STAGE_MEANING = {
  '长生': { phase: '上升', desc: '如婴儿出生，充满生机和潜力，事物开始萌芽', career: '适合开始新项目、学习新技能' },
  '沐浴': { phase: '上升', desc: '如幼儿洗澡，脆弱但在成长，也叫败地，容易受诱惑', career: '需要保护，容易犯桃花或冲动' },
  '冠带': { phase: '上升', desc: '如青年加冠，开始有社会身份，逐渐成熟', career: '适合建立品牌、打造形象' },
  '临官': { phase: '上升', desc: '如壮年入仕，事业上升期，也叫建禄', career: '适合争取晋升、扩大影响力' },
  '帝旺': { phase: '巅峰', desc: '如帝王登基，达到顶峰，能量最强', career: '巅峰状态，把握机会大胆出手' },
  '衰':   { phase: '下降', desc: '如中年体衰，开始走下坡，但经验丰富', career: '守成为主，用经验弥补精力' },
  '病':   { phase: '下降', desc: '如老年染病，能量持续减弱', career: '宜休养、调整，不宜冒进' },
  '死':   { phase: '低谷', desc: '如寿终正寝，旧的结束，但并非真的死', career: '旧事物结束，为新开始做准备' },
  '墓':   { phase: '低谷', desc: '如入墓安葬，能量收藏，也叫库', career: '积蓄力量，低调发展，存钱' },
  '绝':   { phase: '低谷', desc: '如气数已尽，最弱的状态，但绝处逢生', career: '最低点往往是转折点，注意新机会' },
  '胎':   { phase: '转折', desc: '如受精成胎，新的生命开始孕育', career: '新的想法在酝酿，适合规划' },
  '养':   { phase: '转折', desc: '如胎儿在母体中成长，蓄势待发', career: '准备期，学习和积累' },
};

/**
 * 分析四柱中日主的十二长生
 */
function analyzeShierChangSheng(fourPillars, dayGan) {
  const positions = [
    { pos: '年支', zhi: fourPillars.year.zhi, gong: '祖上宫' },
    { pos: '月支', zhi: fourPillars.month.zhi, gong: '事业宫' },
    { pos: '日支', zhi: fourPillars.day.zhi, gong: '夫妻宫' },
    { pos: '时支', zhi: fourPillars.hour.zhi, gong: '子女宫' },
  ];

  const result = positions.map(p => {
    const stage = getStage(dayGan, p.zhi);
    const energy = STAGE_ENERGY[stage] || 0;
    const meaning = STAGE_MEANING[stage] || {};
    return {
      position: p.pos,
      gong: p.gong,
      zhi: p.zhi,
      stage,
      energy,
      phase: meaning.phase || '',
      desc: meaning.desc || '',
      career: meaning.career || '',
    };
  });

  // 总能量
  const totalEnergy = result.reduce((sum, r) => sum + r.energy, 0);
  const maxEnergy = 40; // 4个帝旺
  const energyRatio = Math.round(totalEnergy / maxEnergy * 100);

  // 找最强和最弱的位置
  const strongest = result.reduce((a, b) => a.energy > b.energy ? a : b);
  const weakest = result.reduce((a, b) => a.energy < b.energy ? a : b);

  // 生成总结
  const stageList = result.map(r => `${r.gong}(${r.position})：${r.stage}`).join('、');
  let summary = `日主${dayGan}的十二长生：${stageList}\n`;
  summary += `总能量：${totalEnergy}/${maxEnergy}（${energyRatio}%）\n`;
  summary += `最强位：${strongest.gong} — ${strongest.stage}（${strongest.desc}）\n`;
  summary += `最弱位：${weakest.gong} — ${weakest.stage}（${weakest.desc}）`;

  return {
    positions: result,
    totalEnergy,
    energyRatio,
    strongest,
    weakest,
    summary,
  };
}

/**
 * 获取日主在某个地支（大运/流年）的十二长生阶段
 * 用于动态引擎
 */
function getStageForDynamic(dayGan, zhi) {
  const stage = getStage(dayGan, zhi);
  const energy = STAGE_ENERGY[stage] || 0;
  const meaning = STAGE_MEANING[stage] || {};
  return { stage, energy, ...meaning };
}

module.exports = { analyzeShierChangSheng, getStageForDynamic, getStage, STAGE_ENERGY, STAGE_MEANING };
