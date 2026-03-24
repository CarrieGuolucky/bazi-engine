/**
 * 格局分析模块
 *
 * 通过月令藏干 + 透干关系判定格局类型
 * 输出：格局名称、配合关系、职业建议、忌讳
 */

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const GAN_YINYANG = {
  '甲': true, '乙': false, '丙': true, '丁': false, '戊': true,
  '己': false, '庚': true, '辛': false, '壬': true, '癸': false
};

const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

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

const ZAQI_ZHI = ['辰', '戌', '丑', '未'];

function getShiShen(dayMaster, target) {
  const dmWx = GAN_WUXING[dayMaster];
  const tgWx = GAN_WUXING[target];
  if (!tgWx) return null;
  const samePolarity = GAN_YINYANG[dayMaster] === GAN_YINYANG[target];
  if (dmWx === tgWx) return samePolarity ? '比肩' : '劫财';
  if (WUXING_SHENG[dmWx] === tgWx) return samePolarity ? '食神' : '伤官';
  if (WUXING_SHENG[tgWx] === dmWx) return samePolarity ? '偏印' : '正印';
  if (WUXING_KE[dmWx] === tgWx) return samePolarity ? '偏财' : '正财';
  if (WUXING_KE[tgWx] === dmWx) return samePolarity ? '七杀' : '正官';
  return null;
}

// ============= 格局性质库 =============
const GEJU_INFO = {
  '正官格': {
    nature: '贵气格局，重规则、重名誉',
    career: ['政府公务员', '大企业管理层', '法律', '教育行政', '外企高管'],
    strengths: '守规矩、有责任心、组织能力强、重信用',
    weaknesses: '偏保守、不够灵活、有时太在意别人看法',
    ji: ['伤官见官（最忌）', '官杀混杂'],
  },
  '七杀格': {
    nature: '权威格局，有魄力、能承压',
    career: ['创业者', '军警', '外科医生', '竞技体育', '投资（激进型）'],
    strengths: '果断、抗压强、有野心、行动力强',
    weaknesses: '脾气急、压力大、容易树敌',
    ji: ['无制化则凶（需食神制或印星化）'],
  },
  '正印格': {
    nature: '学术格局，爱学习、重内涵',
    career: ['学术研究', '教育', '文化出版', '顾问咨询', 'AI/技术研发'],
    strengths: '聪明好学、有耐心、善于总结、口碑好',
    weaknesses: '偏理论、行动力偏弱、有时过于依赖',
    ji: ['财星太重破印'],
  },
  '偏印格': {
    nature: '偏门格局，思维独特、技术型',
    career: ['IT技术', '医药', '心理学', '玄学命理', '小众专业领域'],
    strengths: '思维独特、领悟力强、适合钻研偏门',
    weaknesses: '不善表达、容易钻牛角尖、人际关系需注意',
    ji: ['枭神夺食（偏印+食神=凶组合）'],
  },
  '食神格': {
    nature: '福禄格局，有才华、会享受',
    career: ['餐饮美食', '自媒体创作', '教学培训', '技术开发', '艺术设计'],
    strengths: '有才华、心态好、人缘佳、懂享受生活',
    weaknesses: '有时过于安逸、缺乏紧迫感',
    ji: ['枭神夺食（偏印克食神）'],
  },
  '伤官格': {
    nature: '才华格局，聪明叛逆、敢打破规则',
    career: ['律师', '创意设计', '自由职业', '演艺娱乐', '创业（创新型）'],
    strengths: '才华横溢、表达力强、创新能力突出、不走寻常路',
    weaknesses: '嘴巴毒、看不上人、容易得罪领导',
    ji: ['伤官见官（最忌，易招官非）'],
  },
  '正财格': {
    nature: '稳健格局，踏实守财',
    career: ['会计财务', '银行', '房产', '实业经营', '稳健型投资'],
    strengths: '务实、善理财、稳重、有信用',
    weaknesses: '偏保守、格局偏小、不敢冒险',
    ji: ['比劫太重争财'],
  },
  '偏财格': {
    nature: '商业格局，善交际、财路广',
    career: ['贸易', '投资', '销售', '社交型商业', '金融'],
    strengths: '慷慨大方、人脉广、商业嗅觉好、善于变通',
    weaknesses: '花钱大手大脚、感情易出问题',
    ji: ['比劫太重争财'],
  },
  '建禄格': {
    nature: '自力格局，靠自身本事立足',
    career: ['技术型工作', '自由职业', '独立顾问', '个体经营'],
    strengths: '独立自主、能力强、不靠人',
    weaknesses: '早年起步靠自己，贵人运需从其他柱找',
    ji: ['月令无格局可取，需看其他柱配合'],
  },
  '羊刃格': {
    nature: '刚强格局，性格刚烈、能扛事',
    career: ['军警', '外科手术', '竞技', '创业（硬核型）', '工程'],
    strengths: '意志坚定、不服输、能扛重压',
    weaknesses: '脾气暴、容易冲动、婚姻需注意',
    ji: ['流年冲刃（很凶）'],
  },
};

// ============= 格局配合（成格条件） =============
const PEIHE_RULES = [
  { name: '官印相生', need: ['正官', '正印'], desc: '官星生印星，名利双收，大企业管理层、公务员最佳配置' },
  { name: '官星佩印', need: ['正官', '偏印'], desc: '官星配偏印，管理+技术兼备' },
  { name: '杀印相生', need: ['七杀', '正印'], desc: '七杀配印星，有权威又有涵养，大将之才' },
  { name: '杀印相生', need: ['七杀', '偏印'], desc: '七杀配偏印，适合技术型管理或军警' },
  { name: '食神制杀', need: ['食神', '七杀'], desc: '食神制七杀，有勇有谋，文武双全' },
  { name: '食神生财', need: ['食神', '正财'], desc: '才华变现，靠本事赚钱' },
  { name: '食神生财', need: ['食神', '偏财'], desc: '才华变现，路子广、财路多' },
  { name: '伤官佩印', need: ['伤官', '正印'], desc: '才华+深度，学者型创业者，高端创意' },
  { name: '伤官佩印', need: ['伤官', '偏印'], desc: '才华+技术，适合技术创新' },
  { name: '伤官生财', need: ['伤官', '正财'], desc: '靠才华赚钱，自由职业、设计、咨询' },
  { name: '伤官生财', need: ['伤官', '偏财'], desc: '才华赚大钱，创业、投资' },
  { name: '财官双美', need: ['正财', '正官'], desc: '有钱有地位，稳稳的人生赢家' },
  { name: '财官双美', need: ['偏财', '正官'], desc: '能赚钱又有管理才能' },
];

// ============= 主函数 =============

/**
 * 分析格局
 * @param {Object} fourPillars - 四柱 { year: {gan,zhi}, month: {gan,zhi}, day: {gan,zhi}, hour: {gan,zhi} }
 * @param {Object} strengthResult - analyzeStrength的结果（可选，用于判断用神逻辑）
 */
function analyzeGeJu(fourPillars, strengthResult) {
  const dayGan = fourPillars.day.gan;
  const monthZhi = fourPillars.month.zhi;
  const isZaQi = ZAQI_ZHI.includes(monthZhi);

  // 1. 月令藏干的十神
  const monthCang = ZHI_CANG[monthZhi];
  const monthShiShenList = monthCang.map(([gan, pct]) => ({
    gan,
    pct,
    shiShen: getShiShen(dayGan, gan),
    isBenQi: pct >= 50,
  }));

  // 2. 年月时三天干
  const stemGans = [
    { pos: '年干', gan: fourPillars.year.gan },
    { pos: '月干', gan: fourPillars.month.gan },
    { pos: '时干', gan: fourPillars.hour.gan },
  ];

  // 3. 检查透干（月令藏干是否出现在天干中）
  for (const item of monthShiShenList) {
    item.touGan = stemGans.some(s => s.gan === item.gan);
    // 同十神透干（宽松版：不同天干但同十神）
    item.touGanLoose = stemGans.some(s => getShiShen(dayGan, s.gan) === item.shiShen);
  }

  // 4. 判定格局
  const benQi = monthShiShenList.find(s => s.isBenQi);
  let geJuShiShen;
  let geJuType;

  if (benQi.shiShen === '比肩') {
    geJuType = '建禄格';
    geJuShiShen = benQi;
    // 建禄格看其他透干来定辅助格局
  } else if (benQi.shiShen === '劫财') {
    geJuType = '羊刃格';
    geJuShiShen = benQi;
  } else {
    // 正常取格：本气透 > 中余气透 > 本气不透
    if (benQi.touGan) {
      geJuShiShen = benQi;
    } else {
      // 找中气/余气中透干的
      const touItems = monthShiShenList
        .filter(s => !s.isBenQi && s.touGan)
        .sort((a, b) => b.pct - a.pct);
      geJuShiShen = touItems.length > 0 ? touItems[0] : benQi;
    }
    geJuType = geJuShiShen.shiShen + '格';
  }

  // 加杂气前缀
  const prefix = isZaQi ? '杂气' : '';
  const fullName = prefix + geJuType;

  // 5. 统计全盘十神分布（用于判断配合）
  const allShiShen = {};
  // 天干（不含日主）
  for (const { gan } of stemGans) {
    const ss = getShiShen(dayGan, gan);
    if (ss) allShiShen[ss] = (allShiShen[ss] || 0) + 1;
  }
  // 地支藏干
  for (const pos of ['year', 'month', 'day', 'hour']) {
    const zhi = fourPillars[pos].zhi;
    const cangs = ZHI_CANG[zhi] || [];
    for (const [cangGan, pct] of cangs) {
      const ss = getShiShen(dayGan, cangGan);
      if (ss) allShiShen[ss] = (allShiShen[ss] || 0) + (pct / 100);
    }
  }

  // 6. 判断格局配合
  const peihe = [];
  for (const rule of PEIHE_RULES) {
    const hasAll = rule.need.every(ss => (allShiShen[ss] || 0) >= 0.5);
    if (hasAll) {
      // 至少有一个是格局的十神
      const geJuSS = geJuType === '建禄格' || geJuType === '羊刃格'
        ? null
        : geJuShiShen.shiShen;
      if (!geJuSS || rule.need.includes(geJuSS)) {
        peihe.push(rule);
      }
    }
  }

  // 7. 检查忌讳
  const warnings = [];
  // 伤官见官
  if ((allShiShen['伤官'] || 0) >= 0.5 && (allShiShen['正官'] || 0) >= 0.5) {
    // 如果有印星化解，降低严重性
    const hasYin = (allShiShen['正印'] || 0) >= 0.5 || (allShiShen['偏印'] || 0) >= 0.5;
    warnings.push({
      name: '伤官见官',
      severity: hasYin ? '有印化解' : '严重',
      desc: hasYin
        ? '伤官见官但有印星化解（伤官佩印），反而成才华配置'
        : '伤官克正官，易与上级冲突、招惹官非，宜自主创业而非打工',
    });
  }
  // 官杀混杂
  if ((allShiShen['正官'] || 0) >= 0.5 && (allShiShen['七杀'] || 0) >= 0.5) {
    warnings.push({
      name: '官杀混杂',
      severity: '注意',
      desc: '正官与七杀同现，决策容易纠结，事业方向不够聚焦',
    });
  }
  // 枭神夺食
  if ((allShiShen['偏印'] || 0) >= 0.5 && (allShiShen['食神'] || 0) >= 0.5) {
    const hasShangGuan = (allShiShen['伤官'] || 0) >= 0.5;
    if (!hasShangGuan) {
      warnings.push({
        name: '枭神夺食',
        severity: '注意',
        desc: '偏印克食神，才华容易被压制，适合走偏印路线（技术/玄学）而非食神路线（自媒体/餐饮）',
      });
    }
  }
  // 比劫争财
  if (((allShiShen['比肩'] || 0) + (allShiShen['劫财'] || 0)) >= 2 &&
      ((allShiShen['正财'] || 0) + (allShiShen['偏财'] || 0)) >= 0.5) {
    warnings.push({
      name: '比劫争财',
      severity: '注意',
      desc: '比劫多争财，合伙做生意需谨慎，防被朋友借钱不还',
    });
  }

  // 8. 获取格局详情
  const baseType = geJuType === '建禄格' || geJuType === '羊刃格'
    ? geJuType
    : geJuShiShen.shiShen + '格';
  const info = GEJU_INFO[baseType] || {};

  // 9. 生成配合描述
  const peiheDesc = peihe.length > 0
    ? peihe.map(p => p.name).join('·')
    : '';
  const displayName = peiheDesc
    ? `${fullName}·${peiheDesc}`
    : fullName;

  return {
    name: fullName,
    displayName,
    shiShen: geJuShiShen.shiShen,
    isZaQi,
    nature: info.nature || '',
    career: info.career || [],
    strengths: info.strengths || '',
    weaknesses: info.weaknesses || '',
    peihe: peihe.map(p => ({ name: p.name, desc: p.desc })),
    warnings,
    monthCangAnalysis: monthShiShenList.map(s => ({
      gan: s.gan,
      shiShen: s.shiShen,
      isBenQi: s.isBenQi,
      touGan: s.touGan,
      pct: s.pct,
    })),
    allShiShen,
    summary: buildSummary(displayName, info, peihe, warnings),
  };
}

function buildSummary(displayName, info, peihe, warnings) {
  let s = `【${displayName}】`;
  if (info.nature) s += `\n性质：${info.nature}`;
  if (info.career && info.career.length > 0) {
    s += `\n适合方向：${info.career.join('、')}`;
  }
  if (peihe.length > 0) {
    s += `\n格局配合：${peihe.map(p => `${p.name}（${p.desc}）`).join('；')}`;
  }
  if (warnings.length > 0) {
    s += `\n需注意：${warnings.map(w => `${w.name}（${w.desc}）`).join('；')}`;
  }
  return s;
}

module.exports = { analyzeGeJu };