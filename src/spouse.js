/**
 * 配偶星分析模块
 *
 * 从八字看"你命里的另一半是什么样的人"
 * 女命看官星（克我者），男命看财星（我克者）
 *
 * 分析维度：
 * 1. 配偶星是什么五行 → 另一半的性格特征
 * 2. 配偶星在哪个柱 → 早婚还是晚婚
 * 3. 配偶星旺不旺 → 另一半能力强不强
 * 4. 配偶宫（日支）→ 另一半的核心特质
 * 5. 桃花运时间线 → 什么时候最容易遇到对的人
 */

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};
const GAN_YINYANG = { '甲': true, '乙': false, '丙': true, '丁': false, '戊': true, '己': false, '庚': true, '辛': false, '壬': true, '癸': false };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };

const ZHI_CANG = {
  '子': [['癸', 100]], '丑': [['己', 62.5], ['辛', 25], ['癸', 12.5]],
  '寅': [['甲', 62.5], ['丙', 25], ['戊', 12.5]], '卯': [['乙', 100]],
  '辰': [['戊', 62.5], ['乙', 25], ['癸', 12.5]], '巳': [['丙', 62.5], ['戊', 25], ['庚', 12.5]],
  '午': [['丁', 62.5], ['己', 37.5]], '未': [['己', 62.5], ['丁', 25], ['乙', 12.5]],
  '申': [['庚', 62.5], ['壬', 25], ['戊', 12.5]], '酉': [['辛', 100]],
  '戌': [['戊', 62.5], ['辛', 25], ['丁', 12.5]], '亥': [['壬', 62.5], ['甲', 37.5]],
};

// 配偶五行对应的性格特征
const SPOUSE_ELEMENT_TRAITS = {
  '木': {
    appearance: '身材修长，气质文雅，面部线条柔和',
    personality: '温和有耐心，有成长力，重视学习和进步',
    career: '适合教育、文化、科研、技术、环保类行业',
    love_style: '细水长流型，不善表达但很忠诚',
    en: { appearance: 'Tall, graceful, gentle features', personality: 'Patient, growth-oriented, values learning', career: 'Education, tech, research, creative fields', love_style: 'Slow and steady, loyal' }
  },
  '火': {
    appearance: '眼神有神，气质热情开朗，肤色偏暖',
    personality: '热情积极，有感染力，喜欢社交和表达',
    career: '适合传媒、演艺、教育、餐饮、互联网',
    love_style: '热烈奔放型，爱就大声说出来',
    en: { appearance: 'Bright eyes, warm and vibrant energy', personality: 'Passionate, charismatic, expressive', career: 'Media, entertainment, internet, hospitality', love_style: 'Passionate and expressive' }
  },
  '土': {
    appearance: '面相忠厚，体型偏壮实，给人安全感',
    personality: '踏实可靠，重承诺，有包容力',
    career: '适合房产、金融、管理、农业、建筑',
    love_style: '稳重呵护型，默默付出不求回报',
    en: { appearance: 'Solid build, trustworthy face, grounding presence', personality: 'Reliable, keeps promises, nurturing', career: 'Real estate, finance, management', love_style: 'Steady and protective' }
  },
  '金': {
    appearance: '五官精致，皮肤白净，气质干练',
    personality: '果断精明，有原则，追求品质',
    career: '适合金融、法律、科技、军警、医疗',
    love_style: '外冷内热型，嘴上不说心里在意',
    en: { appearance: 'Refined features, fair skin, sharp presence', personality: 'Decisive, principled, quality-driven', career: 'Finance, law, tech, medical', love_style: 'Cool exterior, warm heart' }
  },
  '水': {
    appearance: '灵动机敏，身材灵活，眼睛有神',
    personality: '聪明灵活，善变通，人际关系好',
    career: '适合贸易、传媒、物流、旅游、咨询',
    love_style: '浪漫多变型，喜欢新鲜感和惊喜',
    en: { appearance: 'Quick, agile, bright and alert eyes', personality: 'Smart, adaptable, great social skills', career: 'Trading, media, logistics, consulting', love_style: 'Romantic, loves surprises' }
  },
};

// 配偶星位置→婚姻早晚
const SPOUSE_POSITION_MEANING = {
  '年': { timing: '早婚倾向', desc: '配偶可能是青梅竹马/同学/早年认识的人', en: 'Likely to marry early, childhood connection' },
  '月': { timing: '适婚年龄', desc: '配偶可能是同事/同行/社交认识的人', en: 'Marriage at typical age, through work or social circles' },
  '日': { timing: '正常时间', desc: '日支是配偶宫，配偶跟你日常生活紧密相连', en: 'Spouse is closely tied to your daily life' },
  '时': { timing: '晚婚倾向', desc: '配偶可能是晚年才遇到，或相差较大', en: 'May meet spouse later in life' },
};

/**
 * 分析配偶星
 */
function analyzeSpouse(fourPillars, dayGan, gender) {
  const dayElement = GAN_WUXING[dayGan];
  const isYang = GAN_YINYANG[dayGan];
  const isFemale = gender === 'female';

  // 1. 确定配偶星五行
  // 女命：克我者为夫星（官星）
  // 男命：我克者为妻星（财星）
  let spouseElement;
  if (isFemale) {
    // 找克日主的五行
    for (const [k, v] of Object.entries(WUXING_KE)) {
      if (v === dayElement) { spouseElement = k; break; }
    }
  } else {
    // 找日主克的五行
    spouseElement = WUXING_KE[dayElement];
  }

  // 2. 确定正配偶星天干（异性为正）
  const spouseGans = Object.entries(GAN_WUXING)
    .filter(([g, wx]) => wx === spouseElement)
    .map(([g]) => ({
      gan: g,
      isZheng: GAN_YINYANG[g] !== isYang, // 异性为正
      label: GAN_YINYANG[g] !== isYang
        ? (isFemale ? '正官（正夫星）' : '正财（正妻星）')
        : (isFemale ? '七杀（偏夫星）' : '偏财（偏妻星）'),
    }));

  // 3. 找配偶星在哪个柱
  const positions = ['year', 'month', 'day', 'hour'];
  const posNames = ['年', '月', '日', '时'];
  const spousePositions = [];

  for (let i = 0; i < 4; i++) {
    const gan = fourPillars[positions[i]].gan;
    const ganWx = GAN_WUXING[gan];
    if (ganWx === spouseElement && positions[i] !== 'day') {
      spousePositions.push({
        position: posNames[i] + '干',
        gan,
        isZheng: GAN_YINYANG[gan] !== isYang,
        ...(SPOUSE_POSITION_MEANING[posNames[i]] || {}),
      });
    }

    // 地支藏干
    const zhi = fourPillars[positions[i]].zhi;
    const cangs = ZHI_CANG[zhi] || [];
    for (const [cangGan, pct] of cangs) {
      if (GAN_WUXING[cangGan] === spouseElement) {
        spousePositions.push({
          position: posNames[i] + '支藏' + cangGan,
          gan: cangGan,
          isZheng: GAN_YINYANG[cangGan] !== isYang,
          pct,
          ...(SPOUSE_POSITION_MEANING[posNames[i]] || {}),
        });
      }
    }
  }

  // 4. 配偶宫分析（日支）
  const dayZhi = fourPillars.day.zhi;
  const dayZhiTraits = getZhiTraits(dayZhi);

  // 5. 配偶星强度（在命盘中出现几次）
  const spouseStrength = spousePositions.length;
  let strengthLabel;
  if (spouseStrength >= 4) strengthLabel = '配偶缘很强，另一半能力突出';
  else if (spouseStrength >= 2) strengthLabel = '配偶缘正常，感情稳定';
  else if (spouseStrength >= 1) strengthLabel = '配偶缘偏淡，需要主动追求';
  else strengthLabel = '配偶星弱，姻缘来得晚但来了就稳';

  // 6. 配偶星五行特征
  const traits = SPOUSE_ELEMENT_TRAITS[spouseElement] || {};

  // 7. 桃花运时间线
  const taohuaTimeline = calculateTaohuaTimeline(fourPillars, dayGan);

  return {
    spouseElement,
    spouseStar: isFemale ? '官星' : '财星',
    spouseGans,
    spousePositions,
    spouseStrength,
    strengthLabel,
    dayZhi,
    dayZhiTraits,
    traits,
    taohuaTimeline,
    summary: buildSpouseSummary(spouseElement, traits, strengthLabel, dayZhiTraits, spousePositions, isFemale),
  };
}

function getZhiTraits(zhi) {
  const MAP = {
    '子': { trait: '聪明灵活，另一半可能比较机智善变', en: 'Smart and adaptable partner' },
    '丑': { trait: '踏实可靠，另一半是实干型的人', en: 'Down-to-earth, practical partner' },
    '寅': { trait: '独立上进，另一半有野心和行动力', en: 'Independent, ambitious partner' },
    '卯': { trait: '温柔体贴，另一半善解人意', en: 'Gentle and understanding partner' },
    '辰': { trait: '有才华但有点固执，另一半可能是技术型或学术型', en: 'Talented but stubborn, likely tech or academic type' },
    '巳': { trait: '精明能干，另一半工作能力强', en: 'Sharp and capable, strong work ethic' },
    '午': { trait: '热情开朗，另一半性格外向有感染力', en: 'Warm and outgoing, charismatic partner' },
    '未': { trait: '温厚包容，另一半很顾家', en: 'Warm, family-oriented partner' },
    '申': { trait: '果断干练，另一半做事雷厉风行', en: 'Decisive and efficient partner' },
    '酉': { trait: '精致讲究，另一半注重品质和外表', en: 'Refined partner with high standards' },
    '戌': { trait: '忠诚可靠，另一半很重感情和承诺', en: 'Loyal and commitment-oriented partner' },
    '亥': { trait: '浪漫感性，另一半内心丰富有创意', en: 'Romantic and creative partner' },
  };
  return MAP[zhi] || { trait: '未知', en: 'Unknown' };
}

function calculateTaohuaTimeline(fourPillars, dayGan) {
  const yearZhi = fourPillars.year.zhi;

  // 桃花位
  const TAOHUA = { 'water': '酉', 'fire': '卯', 'wood': '子', 'metal': '午' };
  function getSanHeGroup(zhi) {
    if (['申', '子', '辰'].includes(zhi)) return 'water';
    if (['寅', '午', '戌'].includes(zhi)) return 'fire';
    if (['亥', '卯', '未'].includes(zhi)) return 'wood';
    if (['巳', '酉', '丑'].includes(zhi)) return 'metal';
    return null;
  }

  const group = getSanHeGroup(yearZhi);
  const taohuaZhi = group ? TAOHUA[group] : null;

  // 红鸾
  const HONGLUAN = { '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌', '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰' };
  const hongluanZhi = HONGLUAN[yearZhi];

  // 天喜
  const TIANXI = { '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰', '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌' };
  const tianxiZhi = TIANXI[yearZhi];

  const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 找未来10年哪些年份触发桃花/红鸾/天喜
  const timeline = [];
  for (let year = 2026; year <= 2036; year++) {
    const zhiIdx = (year - 4) % 12;
    const liuNianZhi = DI_ZHI[zhiIdx];
    const triggers = [];

    if (liuNianZhi === taohuaZhi) triggers.push('桃花');
    if (liuNianZhi === hongluanZhi) triggers.push('红鸾（正缘桃花）');
    if (liuNianZhi === tianxiZhi) triggers.push('天喜（喜事）');

    if (triggers.length > 0) {
      timeline.push({ year, triggers, desc: triggers.join(' + ') });
    }
  }

  return { taohuaZhi, hongluanZhi, tianxiZhi, timeline };
}

function buildSpouseSummary(element, traits, strengthLabel, dayZhiTraits, positions, isFemale) {
  const starName = isFemale ? '夫星' : '妻星';
  let s = `你的${starName}五行属${element}\n`;
  s += `\n【另一半的样子】${traits.appearance || ''}\n`;
  s += `【另一半的性格】${traits.personality || ''}\n`;
  s += `【另一半的职业】${traits.career || ''}\n`;
  s += `【恋爱风格】${traits.love_style || ''}\n`;
  s += `\n【配偶宫】${dayZhiTraits.trait}\n`;
  s += `【配偶缘】${strengthLabel}\n`;

  if (positions.length > 0) {
    const earliest = positions[0];
    s += `【婚姻时机】${earliest.timing || ''}——${earliest.desc || ''}\n`;
  }

  return s;
}

module.exports = { analyzeSpouse };
