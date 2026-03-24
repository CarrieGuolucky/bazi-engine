/**
 * 空亡深度解读模块
 *
 * 空亡 = 日柱所在旬中缺少的两个地支
 * 不同宫位空亡含义完全不同
 * 空亡也有"空则灵"的正面作用（玄学、宗教、艺术天赋）
 */

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function ganIndex(g) { return TIAN_GAN.indexOf(g); }
function zhiIndex(z) { return DI_ZHI.indexOf(z); }

/**
 * 计算日柱空亡
 */
function getKongWang(dayGan, dayZhi) {
  const g = ganIndex(dayGan);
  const z = zhiIndex(dayZhi);
  const xunShou = ((z - g) % 12 + 12) % 12;
  return [DI_ZHI[(xunShou + 10) % 12], DI_ZHI[(xunShou + 11) % 12]];
}

// 宫位空亡的含义
const GONG_MEANING = {
  '年支': {
    gong: '年柱（祖上宫/父母宫）',
    negative: [
      '与祖上缘薄，可能远离出生地发展',
      '早年得到家族帮助较少，需要自力更生',
      '与父母的关系表面和谐，内心有距离感',
    ],
    positive: [
      '反而促使你独立，早早出去闯荡',
      '不受家族束缚，自由度高',
    ],
    advice: '多跟父母主动联系，空亡不是没缘分，是缘分需要经营',
  },
  '月支': {
    gong: '月柱（兄弟宫/事业宫）',
    negative: [
      '朋友虽多但知心的少，社交偏表面',
      '事业上不太容易得到同事/同行的实质性帮助',
      '在团队中容易有"合群但不融入"的感觉',
    ],
    positive: [
      '适合独立工作、自由职业、独当一面',
      '不依赖团队反而能走出自己的路',
    ],
    advice: '事业靠自己打拼，别指望贵人抬轿，但可以借力',
  },
  '日支': {
    gong: '日柱（夫妻宫/自身宫）',
    negative: [
      '与配偶之间容易有"近在咫尺却心远"的感觉',
      '婚姻中需要更多沟通和经营',
      '配偶可能经常不在身边（出差多/异地等）',
    ],
    positive: [
      '对感情不过度依赖，内心独立',
      '精神世界丰富，有哲学/宗教/艺术天赋',
      '"空则灵" — 直觉极强，适合做需要灵感的工作',
    ],
    advice: '别把配偶不在身边等同于感情不好，学会享受独处',
  },
  '时支': {
    gong: '时柱（子女宫/晚年宫）',
    negative: [
      '与子女缘分偏淡，子女可能远离身边（留学/移民）',
      '晚年可能独处时间多',
      '对下属/晚辈的掌控力偏弱',
    ],
    positive: [
      '子女独立性强，不用操心',
      '晚年精神世界丰富，不依赖他人',
      '适合做mentor型角色而非管控型领导',
    ],
    advice: '享受子女成长的过程而非结果，晚年培养精神兴趣',
  },
};

// 空亡地支的十神含义
const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};
const ZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

function getWuxingRelation(dayElement, targetElement) {
  if (dayElement === targetElement) return '比劫';
  if (WUXING_SHENG[dayElement] === targetElement) return '食伤';
  if (WUXING_SHENG[targetElement] === dayElement) return '印星';
  if (WUXING_KE[dayElement] === targetElement) return '财星';
  if (WUXING_KE[targetElement] === dayElement) return '官杀';
  return '未知';
}

// 空亡的十神含义
const SHISHEN_KONGWANG = {
  '财星': '财星空亡：赚钱方式非常规，适合虚拟经济/互联网/知识付费，不适合传统实业',
  '官杀': '官杀空亡：不太适合体制内/被人管，适合自由职业/创业。对权力和职位看淡',
  '印星': '印星空亡：学历可能中断或非传统路径，但自学能力极强。适合"野路子"成才',
  '食伤': '食伤空亡：表达力在实体世界偏弱，但在虚拟世界（写作/网络/AI）反而很强',
  '比劫': '比劫空亡：朋友缘表面热闹实际淡薄，独来独往反而顺利',
};

/**
 * 深度分析空亡
 */
function analyzeKongWang(fourPillars, dayGan) {
  const dayZhi = fourPillars.day.zhi;
  const kongwang = getKongWang(dayGan, dayZhi);
  const dayElement = GAN_WUXING[dayGan];

  const allZhi = [
    { pos: '年支', zhi: fourPillars.year.zhi },
    { pos: '月支', zhi: fourPillars.month.zhi },
    { pos: '日支', zhi: fourPillars.day.zhi },
    { pos: '时支', zhi: fourPillars.hour.zhi },
  ];

  // 1. 检查哪些宫位空亡
  const kongwangPositions = [];
  for (const { pos, zhi } of allZhi) {
    if (kongwang.includes(zhi)) {
      const gongInfo = GONG_MEANING[pos] || {};
      const zhiWx = ZHI_WUXING[zhi];
      const relation = getWuxingRelation(dayElement, zhiWx);
      const shishenNote = SHISHEN_KONGWANG[relation] || '';

      kongwangPositions.push({
        position: pos,
        zhi,
        gong: gongInfo.gong || pos,
        negative: gongInfo.negative || [],
        positive: gongInfo.positive || [],
        advice: gongInfo.advice || '',
        relation,
        shishenNote,
      });
    }
  }

  // 2. 检查空亡的五行是什么（对日主的意义）
  const kongwangElements = kongwang.map(z => ({
    zhi: z,
    wuxing: ZHI_WUXING[z],
    relation: getWuxingRelation(dayElement, ZHI_WUXING[z]),
  }));

  // 3. "空则灵"判定
  // 如果空亡落在日支或时支，且空亡地支是印星或食伤，灵性更强
  const kongZeLing = kongwangPositions.some(p =>
    (p.position === '日支' || p.position === '时支') &&
    (p.relation === '印星' || p.relation === '食伤')
  );

  // 4. 填实判定（大运/流年遇到空亡地支时，空亡被填实，力量恢复）
  // 这里只标记，具体的填实检测在动态引擎中做

  // 5. 总结
  const summary = buildKongWangSummary(kongwang, kongwangPositions, kongwangElements, kongZeLing);

  return {
    kongwang,
    kongwangPositions,
    kongwangElements,
    kongZeLing,
    inChart: kongwangPositions.length > 0,
    summary,
  };
}

/**
 * 检测流年是否填实空亡（用于动态引擎）
 */
function detectKongWangFill(zhi, kongwang) {
  if (kongwang.includes(zhi)) {
    return { filled: true, zhi, desc: `流年${zhi}填实空亡，原本被削弱的力量恢复` };
  }
  return { filled: false };
}

function buildKongWangSummary(kongwang, positions, elements, kongZeLing) {
  let s = `空亡：${kongwang.join('、')}`;

  // 空亡五行
  const elemDescs = elements.map(e => `${e.zhi}(${e.wuxing}/${e.relation})`).join('、');
  s += `\n空亡五行：${elemDescs}`;

  if (positions.length === 0) {
    s += '\n命盘四柱中无空亡地支，空亡影响较小，主要在大运/流年遇到时体现。';
    return s;
  }

  s += `\n\n命盘中${positions.length}个宫位空亡：`;
  for (const p of positions) {
    s += `\n\n【${p.gong}空亡】— ${p.zhi}(${p.relation})`;
    s += `\n  影响：`;
    for (const n of p.negative) s += `\n    · ${n}`;
    s += `\n  正面：`;
    for (const po of p.positive) s += `\n    · ${po}`;
    if (p.shishenNote) s += `\n  十神：${p.shishenNote}`;
    s += `\n  建议：${p.advice}`;
  }

  if (kongZeLing) {
    s += '\n\n✨ 空则灵：你有较强的灵性天赋，直觉准、第六感强，适合玄学/艺术/心理学方向';
  }

  return s;
}

module.exports = { analyzeKongWang, detectKongWangFill, getKongWang };
