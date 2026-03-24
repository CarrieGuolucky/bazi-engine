/**
 * 墓库分析模块
 *
 * 辰戌丑未 = 四大墓库
 * 辰=水库(财库for土日主), 戌=火库, 丑=金库, 未=木库
 *
 * 分析：谁有库、库存什么、怎么开（冲开）、大运流年何时激活
 */

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

// 四大墓库：地支 → 所藏五行之库
const MUKU_MAP = {
  '辰': { kuOf: '水', label: '水库', chongBy: '戌' },
  '戌': { kuOf: '火', label: '火库', chongBy: '辰' },
  '丑': { kuOf: '金', label: '金库', chongBy: '未' },
  '未': { kuOf: '木', label: '木库', chongBy: '丑' },
};

// 五行对日主的十神关系
function getWuxingRelation(dayElement, targetElement) {
  if (dayElement === targetElement) return '比劫';
  if (WUXING_SHENG[dayElement] === targetElement) return '食伤';
  if (WUXING_SHENG[targetElement] === dayElement) return '印星';
  if (WUXING_KE[dayElement] === targetElement) return '财星';
  if (WUXING_KE[targetElement] === dayElement) return '官杀';
  return '未知';
}

// 宫位含义
const POSITION_MEANING = {
  '年支': { gong: '祖上宫/父母宫', desc: '来自家族的', age: '早年' },
  '月支': { gong: '兄弟宫/事业宫', desc: '来自事业和社交的', age: '青年' },
  '日支': { gong: '夫妻宫/自身宫', desc: '来自配偶和自身的', age: '中年' },
  '时支': { gong: '子女宫/晚年宫', desc: '来自子女和晚年的', age: '晚年' },
};

// 库的十神含义对照
const KU_SHISHEN_MEANING = {
  '财星': {
    kuName: '财库',
    meaning: '财富积蓄能力强，钱存得住',
    opened: '财库冲开时，大进大出，有暴富机会',
    multiple: '多个财库 = 多渠道聚财，越存越多',
  },
  '官杀': {
    kuName: '官库',
    meaning: '有权有职，适合从政或管理',
    opened: '官库冲开时，升迁或权力变动',
    multiple: '多个官库 = 多重权力来源',
  },
  '印星': {
    kuName: '印库',
    meaning: '学识渊博，知识储备深厚',
    opened: '印库冲开时，学业突破或获得资质认证',
    multiple: '多个印库 = 持续学习能力极强',
  },
  '食伤': {
    kuName: '食伤库',
    meaning: '才华内敛，创意储备丰富',
    opened: '食伤库冲开时，才华爆发、作品产出',
    multiple: '多个食伤库 = 创作能力取之不尽',
  },
  '比劫': {
    kuName: '比劫库',
    meaning: '人脉资源丰富，朋友多',
    opened: '比劫库冲开时，合伙机会或竞争加剧',
    multiple: '多个比劫库 = 社交资源极广',
  },
};

/**
 * 分析四柱中的墓库
 * @param {Object} fourPillars
 * @param {string} dayMasterElement - 日主五行
 * @param {Array} daYun - 大运列表
 */
function analyzeMuKu(fourPillars, dayMasterElement, daYun) {
  const allZhi = [
    { pos: '年支', zhi: fourPillars.year.zhi },
    { pos: '月支', zhi: fourPillars.month.zhi },
    { pos: '日支', zhi: fourPillars.day.zhi },
    { pos: '时支', zhi: fourPillars.hour.zhi },
  ];

  // 1. 找出命盘中的所有墓库
  const kus = [];
  for (const { pos, zhi } of allZhi) {
    const muKu = MUKU_MAP[zhi];
    if (muKu) {
      const relation = getWuxingRelation(dayMasterElement, muKu.kuOf);
      const shishenInfo = KU_SHISHEN_MEANING[relation] || {};
      kus.push({
        zhi,
        position: pos,
        gong: POSITION_MEANING[pos].gong,
        kuOf: muKu.kuOf,
        label: muKu.label,
        chongBy: muKu.chongBy,
        relation,
        kuName: shishenInfo.kuName || muKu.label,
        meaning: shishenInfo.meaning || '',
      });
    }
  }

  // 2. 按十神分组统计
  const kuByRelation = {};
  for (const ku of kus) {
    if (!kuByRelation[ku.relation]) kuByRelation[ku.relation] = [];
    kuByRelation[ku.relation].push(ku);
  }

  // 3. 检查命盘内部的冲（库是否已被冲开）
  const allZhiValues = allZhi.map(z => z.zhi);
  for (const ku of kus) {
    ku.isChongedInChart = allZhiValues.includes(ku.chongBy);
    ku.chongSource = [];
    if (ku.isChongedInChart) {
      for (const { pos, zhi } of allZhi) {
        if (zhi === ku.chongBy) {
          ku.chongSource.push(pos);
        }
      }
    }
  }

  // 4. 分析大运何时冲开墓库
  const kuActivation = [];
  if (daYun && daYun.length > 0) {
    for (const dy of daYun) {
      const dyZhi = dy.ganZhi[1]; // 大运地支
      for (const ku of kus) {
        if (dyZhi === ku.chongBy && !ku.isChongedInChart) {
          kuActivation.push({
            kuName: ku.kuName,
            kuRelation: ku.relation,
            kuPosition: ku.position,
            daYun: dy.ganZhi,
            startYear: dy.startYear,
            endYear: dy.endYear,
            startAge: dy.startAge,
            endAge: dy.endAge,
            desc: `${dy.ganZhi}大运（${dy.startYear}-${dy.endYear}，${dy.startAge}-${dy.endAge}岁）${ku.chongBy}冲${ku.zhi}，${ku.kuName}打开`,
          });
        }
      }
    }
  }

  // 5. 计算关键流年（冲库的流年）
  const kuLiuNian = [];
  const currentYear = 2026;
  // 看未来20年的流年
  for (let year = currentYear; year <= currentYear + 20; year++) {
    // 流年地支 = (year - 4) % 12 对应地支
    const zhiIdx = (year - 4) % 12;
    const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const liuNianZhi = DI_ZHI[zhiIdx];

    for (const ku of kus) {
      if (liuNianZhi === ku.chongBy) {
        kuLiuNian.push({
          year,
          kuName: ku.kuName,
          kuRelation: ku.relation,
          kuPosition: ku.position,
          desc: `${year}年（${liuNianZhi}年）冲${ku.zhi}（${ku.position}），${ku.kuName}被激活`,
        });
      }
    }
  }

  // 6. 配偶冲库分析（如果日支是库）
  const spouseKu = kus.find(k => k.position === '日支');

  // 7. 生成总结
  const summary = buildMuKuSummary(kus, kuByRelation, kuActivation, kuLiuNian, dayMasterElement);

  return {
    kus,
    kuByRelation,
    kuActivation,
    kuLiuNian,
    spouseKu,
    summary,
  };
}

function buildMuKuSummary(kus, kuByRelation, kuActivation, kuLiuNian, dayMasterElement) {
  if (kus.length === 0) return '命盘中无墓库。';

  let s = `命带${kus.length}个墓库：`;
  // 按类型汇总
  for (const [relation, list] of Object.entries(kuByRelation)) {
    const info = KU_SHISHEN_MEANING[relation] || {};
    const positions = list.map(k => k.position).join('、');
    s += `\n\n【${info.kuName || relation}×${list.length}】（${positions}）`;
    s += `\n  ${info.meaning || ''}`;
    if (list.length >= 2 && info.multiple) {
      s += `\n  ${info.multiple}`;
    }
    // 是否已被冲开
    const chonged = list.filter(k => k.isChongedInChart);
    const notChonged = list.filter(k => !k.isChongedInChart);
    if (chonged.length > 0) {
      s += `\n  已被命盘内冲开：${chonged.map(k => `${k.zhi}(${k.position})被${k.chongSource.join('、')}的${k.chongBy}冲`).join('；')}`;
      s += `\n  → ${info.opened || '库已打开，能量释放'}`;
    }
    if (notChonged.length > 0) {
      s += `\n  未冲开：${notChonged.map(k => `${k.zhi}(${k.position})`).join('、')}，等待大运/流年${notChonged[0].chongBy}来冲`;
    }
  }

  // 大运激活时间
  if (kuActivation.length > 0) {
    s += `\n\n【墓库开启时间线】`;
    for (const act of kuActivation) {
      s += `\n  ${act.desc}`;
    }
  }

  // 近20年关键流年
  if (kuLiuNian.length > 0) {
    s += `\n\n【近20年冲库流年】`;
    // 去重，同年合并
    const byYear = {};
    for (const ln of kuLiuNian) {
      if (!byYear[ln.year]) byYear[ln.year] = [];
      byYear[ln.year].push(ln);
    }
    for (const [year, items] of Object.entries(byYear)) {
      const descs = items.map(i => `${i.kuName}(${i.kuPosition})`).join('、');
      s += `\n  ${year}年 → ${descs}被激活`;
    }
  }

  return s;
}

module.exports = { analyzeMuKu };
