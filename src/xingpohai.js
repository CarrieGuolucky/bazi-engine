/**
 * 地支刑破害分析模块
 *
 * 刑 = 摩擦、冲突、法律纠纷、健康损伤
 * 破 = 破坏、不稳定
 * 害 = 暗伤、背后的伤害
 *
 * 配合合、冲形成完整的地支关系网
 */

// ======= 三刑 =======
// 寅巳申 — 恃势之刑（仗势欺人型冲突）
// 丑戌未 — 无恩之刑（恩将仇报型冲突）
// 子卯   — 无礼之刑（缺乏边界感的冲突）
// 辰辰、午午、酉酉、亥亥 — 自刑（自己跟自己过不去）

const SAN_XING = [
  { group: ['寅', '巳', '申'], name: '寅巳申三刑', type: '恃势之刑', desc: '仗势欺人型冲突，易招官非、法律纠纷、意外伤害。三者齐聚最凶，两两也算' },
  { group: ['丑', '戌', '未'], name: '丑戌未三刑', type: '无恩之刑', desc: '恩将仇报型冲突，好心没好报、信任被辜负。常见于职场和亲密关系' },
  { group: ['子', '卯'], name: '子卯相刑', type: '无礼之刑', desc: '缺乏边界感，过度亲密反而伤害。常见于母子、闺蜜、暧昧关系' },
];

const ZI_XING = ['辰', '午', '酉', '亥']; // 自刑

// ======= 六破 =======
const PO_MAP = {
  '子': '酉', '酉': '子',
  '卯': '午', '午': '卯',
  '辰': '丑', '丑': '辰',
  '未': '戌', '戌': '未',
  '寅': '亥', '亥': '寅',
  '巳': '申', '申': '巳',
};

// ======= 六害 =======
const HAI_MAP = {
  '子': '未', '未': '子',
  '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅',
  '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申',
  '酉': '戌', '戌': '酉',
};

// 宫位含义
const POS_NAME = { '年支': '年', '月支': '月', '日支': '日', '时支': '时' };
const POS_GONG = { '年支': '祖上宫', '月支': '事业宫', '日支': '夫妻宫', '时支': '子女宫' };

/**
 * 分析命盘中的刑破害关系
 */
function analyzeXingPoHai(fourPillars) {
  const allZhi = [
    { pos: '年支', zhi: fourPillars.year.zhi },
    { pos: '月支', zhi: fourPillars.month.zhi },
    { pos: '日支', zhi: fourPillars.day.zhi },
    { pos: '时支', zhi: fourPillars.hour.zhi },
  ];
  const zhiList = allZhi.map(z => z.zhi);

  const xing = [];
  const po = [];
  const hai = [];

  // === 三刑检测 ===
  for (const rule of SAN_XING) {
    if (rule.group.length === 3) {
      // 三合刑：检查三者齐聚 或 两两相见
      const present = rule.group.filter(z => zhiList.includes(z));
      if (present.length >= 2) {
        const positions = [];
        for (const z of present) {
          const found = allZhi.filter(a => a.zhi === z);
          found.forEach(f => positions.push(f));
        }
        xing.push({
          name: present.length === 3 ? rule.name : `${present.join('')}相刑`,
          type: rule.type,
          fullTriple: present.length === 3,
          members: positions.map(p => `${p.zhi}(${p.pos})`),
          desc: rule.desc,
          severity: present.length === 3 ? '严重' : '注意',
        });
      }
    } else {
      // 子卯刑：两两相见
      const present = rule.group.filter(z => zhiList.includes(z));
      if (present.length === 2) {
        const positions = [];
        for (const z of present) {
          const found = allZhi.filter(a => a.zhi === z);
          found.forEach(f => positions.push(f));
        }
        xing.push({
          name: rule.name,
          type: rule.type,
          fullTriple: false,
          members: positions.map(p => `${p.zhi}(${p.pos})`),
          desc: rule.desc,
          severity: '注意',
        });
      }
    }
  }

  // 自刑检测
  for (const z of ZI_XING) {
    const count = zhiList.filter(x => x === z).length;
    if (count >= 2) {
      const positions = allZhi.filter(a => a.zhi === z);
      xing.push({
        name: `${z}${z}自刑`,
        type: '自刑',
        fullTriple: false,
        members: positions.map(p => `${p.zhi}(${p.pos})`),
        desc: '自己跟自己过不去，容易内耗、钻牛角尖、自我伤害',
        severity: count >= 3 ? '严重' : '注意',
      });
    }
  }

  // === 六破检测 ===
  for (let i = 0; i < allZhi.length; i++) {
    for (let j = i + 1; j < allZhi.length; j++) {
      if (PO_MAP[allZhi[i].zhi] === allZhi[j].zhi) {
        po.push({
          name: `${allZhi[i].zhi}${allZhi[j].zhi}破`,
          members: [`${allZhi[i].zhi}(${allZhi[i].pos})`, `${allZhi[j].zhi}(${allZhi[j].pos})`],
          desc: `${POS_GONG[allZhi[i].pos]}与${POS_GONG[allZhi[j].pos]}之间有破坏力，关系不稳定`,
        });
      }
    }
  }

  // === 六害检测 ===
  for (let i = 0; i < allZhi.length; i++) {
    for (let j = i + 1; j < allZhi.length; j++) {
      if (HAI_MAP[allZhi[i].zhi] === allZhi[j].zhi) {
        hai.push({
          name: `${allZhi[i].zhi}${allZhi[j].zhi}害`,
          members: [`${allZhi[i].zhi}(${allZhi[i].pos})`, `${allZhi[j].zhi}(${allZhi[j].pos})`],
          desc: `${POS_GONG[allZhi[i].pos]}与${POS_GONG[allZhi[j].pos]}之间有暗伤，表面没事但暗中消耗`,
        });
      }
    }
  }

  // 总结
  const summary = buildSummary(xing, po, hai);

  return { xing, po, hai, summary };
}

/**
 * 检测流年/大运地支是否与命盘形成刑破害
 * 用于动态引擎
 */
function detectXingPoHaiTrigger(zhi, fourPillars) {
  const allZhi = [
    { pos: '年支', zhi: fourPillars.year.zhi },
    { pos: '月支', zhi: fourPillars.month.zhi },
    { pos: '日支', zhi: fourPillars.day.zhi },
    { pos: '时支', zhi: fourPillars.hour.zhi },
  ];
  const zhiList = allZhi.map(z => z.zhi);
  const triggers = [];

  // 三刑触发
  for (const rule of SAN_XING) {
    if (rule.group.includes(zhi)) {
      const others = rule.group.filter(z => z !== zhi);
      const presentOthers = others.filter(z => zhiList.includes(z));
      if (presentOthers.length >= 1) {
        const allPresent = [zhi, ...presentOthers];
        const isFullTriple = rule.group.length === 3 && allPresent.length === 3;
        triggers.push({
          type: '刑',
          name: isFullTriple ? rule.name : `${allPresent.join('')}相刑`,
          xingType: rule.type,
          severity: isFullTriple ? '严重' : '注意',
          desc: rule.desc,
        });
      }
    }
  }

  // 自刑触发
  if (ZI_XING.includes(zhi) && zhiList.includes(zhi)) {
    triggers.push({
      type: '刑',
      name: `${zhi}${zhi}自刑`,
      xingType: '自刑',
      severity: '注意',
      desc: '流年触发自刑，容易内耗，注意心理健康',
    });
  }

  // 六破触发
  const poTarget = PO_MAP[zhi];
  if (poTarget) {
    const poPositions = allZhi.filter(a => a.zhi === poTarget);
    for (const p of poPositions) {
      triggers.push({
        type: '破',
        name: `${zhi}${p.zhi}破`,
        position: p.pos,
        severity: '注意',
        desc: `流年${zhi}破${p.pos}${p.zhi}，${POS_GONG[p.pos]}有不稳定因素`,
      });
    }
  }

  // 六害触发
  const haiTarget = HAI_MAP[zhi];
  if (haiTarget) {
    const haiPositions = allZhi.filter(a => a.zhi === haiTarget);
    for (const p of haiPositions) {
      triggers.push({
        type: '害',
        name: `${zhi}${p.zhi}害`,
        position: p.pos,
        severity: '注意',
        desc: `流年${zhi}害${p.pos}${p.zhi}，${POS_GONG[p.pos]}有暗中消耗`,
      });
    }
  }

  return triggers;
}

function buildSummary(xing, po, hai) {
  const parts = [];
  if (xing.length === 0 && po.length === 0 && hai.length === 0) {
    return '命盘地支无刑破害，地支关系和谐。';
  }
  if (xing.length > 0) {
    parts.push('【刑】' + xing.map(x => `${x.name}(${x.severity}) — ${x.desc}`).join('；'));
  }
  if (po.length > 0) {
    parts.push('【破】' + po.map(p => `${p.name} — ${p.desc}`).join('；'));
  }
  if (hai.length > 0) {
    parts.push('【害】' + hai.map(h => `${h.name} — ${h.desc}`).join('；'));
  }
  return parts.join('\n');
}

module.exports = { analyzeXingPoHai, detectXingPoHaiTrigger };
