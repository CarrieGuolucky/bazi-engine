/**
 * 神煞计算模块 — 对标测测App
 *
 * 输入四柱 → 输出命中的神煞列表
 * 覆盖常见吉神、中性神煞、凶煞
 */

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function ganIndex(g) { return TIAN_GAN.indexOf(g); }
function zhiIndex(z) { return DI_ZHI.indexOf(z); }

// ======= 三合局分组（驿马、华盖、桃花、将星等共用） =======
function getSanHeGroup(zhi) {
  if (['申', '子', '辰'].includes(zhi)) return 'water';
  if (['寅', '午', '戌'].includes(zhi)) return 'fire';
  if (['亥', '卯', '未'].includes(zhi)) return 'wood';
  if (['巳', '酉', '丑'].includes(zhi)) return 'metal';
  return null;
}

// ==============================
//  吉神查询表
// ==============================

// 天乙贵人（日干查地支）
// 甲戊庚牛羊, 乙己鼠猴乡, 丙丁猪鸡位, 壬癸兔蛇藏, 六辛逢马虎
const TIANYI_MAP = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
};

// 太极贵人（日干查地支）
const TAIJI_MAP = {
  '甲': ['子', '午'], '己': ['子', '午'],
  '乙': ['卯', '酉'], '庚': ['卯', '酉'],
  '丙': ['寅', '亥'], '辛': ['寅', '亥'],
  '丁': ['巳', '酉'], '壬': ['巳', '酉'],
  '戊': ['辰', '戌', '丑', '未'], '癸': ['辰', '戌', '丑', '未'],
};

// 文昌贵人（日干查地支）
const WENCHANG_MAP = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

// 天德贵人（月支 → 天干或地支）
const TIANDE_MAP = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛',
  '午': '亥', '未': '甲', '申': '癸', '酉': '寅',
  '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
};

// 月德贵人（月支 → 天干）
const YUEDE_MAP = {
  '寅': '丙', '午': '丙', '戌': '丙',
  '申': '壬', '子': '壬', '辰': '壬',
  '亥': '甲', '卯': '甲', '未': '甲',
  '巳': '庚', '酉': '庚', '丑': '庚',
};

// 天干合（用于天德合、月德合推算）
const GANGAN_HE = {
  '甲': '己', '己': '甲', '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

// 地支本气
const ZHI_BENQI = {
  '子': '癸', '丑': '己', '寅': '甲', '卯': '乙', '辰': '戊',
  '巳': '丙', '午': '丁', '未': '己', '申': '庚', '酉': '辛',
  '戌': '戊', '亥': '壬',
};

// 国印贵人（年干查地支）
const GUOYIN_MAP = {
  '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
  '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申',
};

// 福星贵人（年干查地支）
// 甲寅乙丑丙子丁酉 戊申己午庚亥辛未 壬卯癸巳
const FUXING_MAP = {
  '甲': '寅', '乙': '丑', '丙': '子', '丁': '酉',
  '戊': '申', '己': '午', '庚': '亥', '辛': '未',
  '壬': '卯', '癸': '巳',
};

// 天喜（年支查地支）
const TIANXI_MAP = {
  '子': '酉', '丑': '申', '寅': '未', '卯': '午',
  '辰': '巳', '巳': '辰', '午': '卯', '未': '寅',
  '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
};

// 红鸾（年支查地支）
const HONGLUAN_MAP = {
  '子': '卯', '丑': '寅', '寅': '丑', '卯': '子',
  '辰': '亥', '巳': '戌', '午': '酉', '未': '申',
  '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
};

// 禄神（日干查地支）
const LUSHEN_MAP = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

// 金舆（日干查地支）
const JINYU_MAP = {
  '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未',
  '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅',
};

// 天医（月支查地支，前一位）
const TIANYI_DOCTOR_MAP = {
  '寅': '丑', '卯': '寅', '辰': '卯', '巳': '辰',
  '午': '巳', '未': '午', '申': '未', '酉': '申',
  '戌': '酉', '亥': '戌', '子': '亥', '丑': '子',
};

// ==============================
//  中性神煞查询表
// ==============================

// 驿马（年支三合局查地支）
const YIMA_MAP = { 'water': '寅', 'fire': '申', 'wood': '巳', 'metal': '亥' };

// 华盖（年支三合局查地支）
const HUAGAI_MAP = { 'water': '辰', 'fire': '戌', 'wood': '未', 'metal': '丑' };

// 桃花（年支三合局查地支）
const TAOHUA_MAP = { 'water': '酉', 'fire': '卯', 'wood': '子', 'metal': '午' };

// 将星（年支三合局查地支）
const JIANGXING_MAP = { 'water': '子', 'fire': '午', 'wood': '卯', 'metal': '酉' };

// 羊刃（日干查地支）
const YANGREN_MAP = {
  '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午',
  '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑',
};

// ==============================
//  凶煞查询表
// ==============================

// 劫煞（年支三合局查地支）
const JIESHA_MAP = { 'water': '巳', 'fire': '亥', 'wood': '申', 'metal': '寅' };

// 灾煞（年支三合局查地支）
const ZAISHA_MAP = { 'water': '午', 'fire': '子', 'wood': '酉', 'metal': '卯' };

// 亡神（年支三合局查地支）
const WANGSHEN_MAP = { 'water': '亥', 'fire': '巳', 'wood': '寅', 'metal': '申' };

// 孤辰（年支查地支）
const GUCHEN_MAP = {
  '寅': '巳', '卯': '巳', '辰': '巳',
  '巳': '申', '午': '申', '未': '申',
  '申': '亥', '酉': '亥', '戌': '亥',
  '亥': '寅', '子': '寅', '丑': '寅',
};

// 寡宿（年支查地支）
const GUASU_MAP = {
  '寅': '丑', '卯': '丑', '辰': '丑',
  '巳': '辰', '午': '辰', '未': '辰',
  '申': '未', '酉': '未', '戌': '未',
  '亥': '戌', '子': '戌', '丑': '戌',
};

// ==============================
//  工具函数
// ==============================

/** 天德合：天德对应的天干合 */
function getTianDeHe(monthZhi) {
  const tiande = TIANDE_MAP[monthZhi];
  if (!tiande) return null;
  if (TIAN_GAN.includes(tiande)) return GANGAN_HE[tiande];
  // 天德是地支时，取本气天干的合
  const benqi = ZHI_BENQI[tiande];
  return GANGAN_HE[benqi];
}

/** 月德合：月德对应的天干合 */
function getYueDeHe(monthZhi) {
  const yuede = YUEDE_MAP[monthZhi];
  if (!yuede) return null;
  return GANGAN_HE[yuede];
}

/** 空亡：日柱推算 */
function getKongWang(dayGan, dayZhi) {
  const g = ganIndex(dayGan);
  const z = zhiIndex(dayZhi);
  const xunShou = ((z - g) % 12 + 12) % 12;
  return [DI_ZHI[(xunShou + 10) % 12], DI_ZHI[(xunShou + 11) % 12]];
}

// ==============================
//  主函数
// ==============================

/**
 * 分析四柱神煞
 * @param {Object} fourPillars - { year: {gan, zhi}, month: {gan, zhi}, day: {gan, zhi}, hour: {gan, zhi} }
 * @returns {Object} { all, 吉神, 中性, 凶煞, summary, details }
 */
function analyzeShenSha(fourPillars) {
  const dayGan = fourPillars.day.gan;
  const dayZhi = fourPillars.day.zhi;
  const yearGan = fourPillars.year.gan;
  const yearZhi = fourPillars.year.zhi;
  const monthZhi = fourPillars.month.zhi;

  const allZhi = [
    { pos: '年支', zhi: fourPillars.year.zhi },
    { pos: '月支', zhi: fourPillars.month.zhi },
    { pos: '日支', zhi: fourPillars.day.zhi },
    { pos: '时支', zhi: fourPillars.hour.zhi },
  ];
  const allGan = [
    { pos: '年干', gan: fourPillars.year.gan },
    { pos: '月干', gan: fourPillars.month.gan },
    { pos: '日干', gan: fourPillars.day.gan },
    { pos: '时干', gan: fourPillars.hour.gan },
  ];

  const result = [];
  const yearGroup = getSanHeGroup(yearZhi);

  // ============ 吉神 ============

  // 1. 天乙贵人（日干查地支）— 最大贵人星
  const tianyiTargets = TIANYI_MAP[dayGan] || [];
  for (const { pos, zhi } of allZhi) {
    if (tianyiTargets.includes(zhi)) {
      result.push({ name: '天乙贵人', type: '吉', position: pos, description: '最大贵人星，逢凶化吉，遇难呈祥' });
    }
  }

  // 2. 太极贵人（日干查地支）
  const taijiTargets = TAIJI_MAP[dayGan] || [];
  for (const { pos, zhi } of allZhi) {
    if (taijiTargets.includes(zhi)) {
      result.push({ name: '太极贵人', type: '吉', position: pos, description: '聪明好学，有钻研精神，适合学术研究' });
    }
  }

  // 3. 文昌贵人（日干查地支）
  const wenchangTarget = WENCHANG_MAP[dayGan];
  for (const { pos, zhi } of allZhi) {
    if (zhi === wenchangTarget) {
      result.push({ name: '文昌贵人', type: '吉', position: pos, description: '学业优秀，考试运好，利文职' });
    }
  }

  // 4. 天德贵人（月支查天干/地支）
  const tiandeTarget = TIANDE_MAP[monthZhi];
  if (tiandeTarget) {
    if (TIAN_GAN.includes(tiandeTarget)) {
      for (const { pos, gan } of allGan) {
        if (gan === tiandeTarget) {
          result.push({ name: '天德贵人', type: '吉', position: pos, description: '天降福德，逢凶化吉，化解灾厄' });
        }
      }
    } else {
      for (const { pos, zhi } of allZhi) {
        if (zhi === tiandeTarget) {
          result.push({ name: '天德贵人', type: '吉', position: pos, description: '天降福德，逢凶化吉，化解灾厄' });
        }
      }
    }
  }

  // 5. 月德贵人（月支查天干）
  const yuedeTarget = YUEDE_MAP[monthZhi];
  if (yuedeTarget) {
    for (const { pos, gan } of allGan) {
      if (gan === yuedeTarget) {
        result.push({ name: '月德贵人', type: '吉', position: pos, description: '性情仁慈，处事公正，化险为夷' });
      }
    }
  }

  // 6. 天德合（月支推天德 → 天干合）
  const tiandeHe = getTianDeHe(monthZhi);
  if (tiandeHe) {
    for (const { pos, gan } of allGan) {
      if (gan === tiandeHe) {
        result.push({ name: '天德合', type: '吉', position: pos, description: '与天德相合，同样有逢凶化吉之效' });
      }
    }
  }

  // 7. 月德合（月支推月德 → 天干合）
  const yuedeHe = getYueDeHe(monthZhi);
  if (yuedeHe) {
    for (const { pos, gan } of allGan) {
      if (gan === yuedeHe) {
        result.push({ name: '月德合', type: '吉', position: pos, description: '与月德相合，化解灾祸' });
      }
    }
  }

  // 8. 国印贵人（年干查地支）
  const guoyinTarget = GUOYIN_MAP[yearGan];
  for (const { pos, zhi } of allZhi) {
    if (zhi === guoyinTarget) {
      result.push({ name: '国印贵人', type: '吉', position: pos, description: '掌权之星，利从政、管理、公务' });
    }
  }

  // 9. 福星贵人（年干查地支）
  const fuxingTarget = FUXING_MAP[yearGan];
  for (const { pos, zhi } of allZhi) {
    if (zhi === fuxingTarget) {
      result.push({ name: '福星贵人', type: '吉', position: pos, description: '福气深厚，一生衣食无忧' });
    }
  }

  // 10. 天喜（年支查地支）
  const tianxiTarget = TIANXI_MAP[yearZhi];
  for (const { pos, zhi } of allZhi) {
    if (zhi === tianxiTarget) {
      result.push({ name: '天喜', type: '吉', position: pos, description: '喜庆之星，利婚姻、添丁、喜事' });
    }
  }

  // 11. 红鸾（年支查地支）
  const hongluanTarget = HONGLUAN_MAP[yearZhi];
  for (const { pos, zhi } of allZhi) {
    if (zhi === hongluanTarget) {
      result.push({ name: '红鸾', type: '吉', position: pos, description: '正缘桃花，利感情、婚姻' });
    }
  }

  // 12. 禄神（日干查地支）
  const lushenTarget = LUSHEN_MAP[dayGan];
  for (const { pos, zhi } of allZhi) {
    if (zhi === lushenTarget) {
      result.push({ name: '禄神', type: '吉', position: pos, description: '正禄，衣食丰足，靠自己本事挣钱' });
    }
  }

  // 13. 将星（年支三合局查地支）
  const jiangxingTarget = yearGroup ? JIANGXING_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === jiangxingTarget) {
      result.push({ name: '将星', type: '吉', position: pos, description: '领导之星，有统御能力和威望' });
    }
  }

  // 14. 金舆（日干查地支）
  const jinyuTarget = JINYU_MAP[dayGan];
  for (const { pos, zhi } of allZhi) {
    if (zhi === jinyuTarget) {
      result.push({ name: '金舆', type: '吉', position: pos, description: '贵人座驾，利配偶，得贵人提携' });
    }
  }

  // 15. 天医（月支查地支）
  const tianyiDoctorTarget = TIANYI_DOCTOR_MAP[monthZhi];
  for (const { pos, zhi } of allZhi) {
    if (zhi === tianyiDoctorTarget) {
      result.push({ name: '天医', type: '吉', position: pos, description: '利医药、养生、心理，适合助人行业' });
    }
  }

  // ============ 中性 ============

  // 16. 驿马（年支三合局查地支）
  const yimaTarget = yearGroup ? YIMA_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === yimaTarget) {
      result.push({ name: '驿马', type: '中', position: pos, description: '迁动之星，利出行、变动、海外发展' });
    }
  }

  // 17. 华盖（年支三合局查地支）
  const huagaiTarget = yearGroup ? HUAGAI_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === huagaiTarget) {
      result.push({ name: '华盖', type: '中', position: pos, description: '才华出众但性情孤高，利艺术、宗教、学术' });
    }
  }

  // 18. 桃花（年支三合局查地支）
  const taohuaTarget = yearGroup ? TAOHUA_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === taohuaTarget) {
      result.push({ name: '桃花', type: '中', position: pos, description: '人缘好，异性缘强，也需注意感情纠纷' });
    }
  }

  // 19. 羊刃（日干查地支）
  const yangrenTarget = YANGREN_MAP[dayGan];
  for (const { pos, zhi } of allZhi) {
    if (zhi === yangrenTarget) {
      result.push({ name: '羊刃', type: '中', position: pos, description: '刚烈果断，身弱时助力大，身强时需控制脾气' });
    }
  }

  // ============ 凶煞 ============

  // 20. 劫煞（年支三合局查地支）
  const jieshaTarget = yearGroup ? JIESHA_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === jieshaTarget) {
      result.push({ name: '劫煞', type: '凶', position: pos, description: '防小人、破财，宜谨慎理财' });
    }
  }

  // 21. 灾煞（年支三合局查地支）
  const zaishaTarget = yearGroup ? ZAISHA_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === zaishaTarget) {
      result.push({ name: '灾煞', type: '凶', position: pos, description: '防意外灾害，宜注意安全和健康' });
    }
  }

  // 22. 亡神（年支三合局查地支）
  const wangshenTarget = yearGroup ? WANGSHEN_MAP[yearGroup] : null;
  for (const { pos, zhi } of allZhi) {
    if (zhi === wangshenTarget) {
      result.push({ name: '亡神', type: '凶', position: pos, description: '心思缜密但多疑，宜防暗损、小人' });
    }
  }

  // 23. 孤辰（年支查地支）
  const guchenTarget = GUCHEN_MAP[yearZhi];
  for (const { pos, zhi } of allZhi) {
    if (zhi === guchenTarget && pos !== '年支') {
      result.push({ name: '孤辰', type: '凶', position: pos, description: '性格独立但偏孤僻，宜主动社交' });
    }
  }

  // 24. 寡宿（年支查地支）
  const guasuTarget = GUASU_MAP[yearZhi];
  for (const { pos, zhi } of allZhi) {
    if (zhi === guasuTarget) {
      result.push({ name: '寡宿', type: '凶', position: pos, description: '感情上容易孤独，宜主动经营亲密关系' });
    }
  }

  // 25. 空亡（日柱查地支）
  const kongwang = getKongWang(dayGan, dayZhi);
  for (const { pos, zhi } of allZhi) {
    if (kongwang.includes(zhi) && pos !== '日支') {
      result.push({ name: '空亡', type: '凶', position: pos, description: '所在宫位力量被削弱，但也有"空则灵"之妙用' });
    }
  }

  // ============ 汇总 ============
  const jiShen = result.filter(r => r.type === '吉');
  const zhongShen = result.filter(r => r.type === '中');
  const xiongSha = result.filter(r => r.type === '凶');

  return {
    all: result,
    吉神: jiShen,
    中性: zhongShen,
    凶煞: xiongSha,
    kongwang,
    summary: `命带${jiShen.length}个吉神、${zhongShen.length}个中性、${xiongSha.length}个凶煞`,
    details: result.map(r => `【${r.type}】${r.name}(${r.position}) — ${r.description}`),
  };
}

module.exports = { analyzeShenSha, getKongWang };
