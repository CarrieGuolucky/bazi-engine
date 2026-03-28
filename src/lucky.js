/**
 * 幸运颜色/数字/方位模块
 *
 * 基于喜用神五行推算
 * 用户最爱分享的轻内容
 */

const LUCKY_MAP = {
  '木': {
    colors: ['绿色', '青色', '翠色'],
    colors_en: ['Green', 'Teal', 'Emerald'],
    numbers: [3, 8],
    directions: ['东方', '东南'],
    directions_en: ['East', 'Southeast'],
    season: '春天',
    season_en: 'Spring',
    food: '绿色蔬菜、酸味食物',
    food_en: 'Green vegetables, sour foods',
    material: '木质、棉麻',
    material_en: 'Wood, cotton, linen',
  },
  '火': {
    colors: ['红色', '紫色', '橙色'],
    colors_en: ['Red', 'Purple', 'Orange'],
    numbers: [2, 7],
    directions: ['南方'],
    directions_en: ['South'],
    season: '夏天',
    season_en: 'Summer',
    food: '红色食物、苦味食物',
    food_en: 'Red foods, bitter foods',
    material: '塑料、电子产品',
    material_en: 'Electronics, synthetic materials',
  },
  '土': {
    colors: ['黄色', '棕色', '米色'],
    colors_en: ['Yellow', 'Brown', 'Beige'],
    numbers: [5, 10],
    directions: ['中央', '东北', '西南'],
    directions_en: ['Center', 'Northeast', 'Southwest'],
    season: '四季交替时',
    season_en: 'Season transitions',
    food: '黄色食物、甜味食物、五谷杂粮',
    food_en: 'Yellow foods, sweet foods, whole grains',
    material: '陶瓷、石材',
    material_en: 'Ceramic, stone',
  },
  '金': {
    colors: ['白色', '金色', '银色'],
    colors_en: ['White', 'Gold', 'Silver'],
    numbers: [4, 9],
    directions: ['西方', '西北'],
    directions_en: ['West', 'Northwest'],
    season: '秋天',
    season_en: 'Autumn',
    food: '白色食物、辛辣食物',
    food_en: 'White foods, spicy foods',
    material: '金属、珠宝',
    material_en: 'Metal, jewelry',
  },
  '水': {
    colors: ['黑色', '深蓝色', '灰色'],
    colors_en: ['Black', 'Navy', 'Grey'],
    numbers: [1, 6],
    directions: ['北方'],
    directions_en: ['North'],
    season: '冬天',
    season_en: 'Winter',
    food: '黑色食物、咸味食物、海鲜',
    food_en: 'Black foods, salty foods, seafood',
    material: '水晶、玻璃',
    material_en: 'Crystal, glass',
  },
};

/**
 * 计算幸运元素
 * @param {Array} xiyong - 喜用神五行数组，如 ['火', '土']
 */
function analyzeLucky(xiyong) {
  if (!xiyong || xiyong.length === 0) return null;

  // 合并所有喜用神的幸运元素
  const colors = [];
  const colors_en = [];
  const numbers = [];
  const directions = [];
  const directions_en = [];
  const seasons = [];
  const seasons_en = [];
  const foods = [];
  const foods_en = [];
  const materials = [];
  const materials_en = [];

  for (const wx of xiyong) {
    const lucky = LUCKY_MAP[wx];
    if (!lucky) continue;
    colors.push(...lucky.colors);
    colors_en.push(...lucky.colors_en);
    numbers.push(...lucky.numbers);
    directions.push(...lucky.directions);
    directions_en.push(...lucky.directions_en);
    seasons.push(lucky.season);
    seasons_en.push(lucky.season_en);
    foods.push(lucky.food);
    foods_en.push(lucky.food_en);
    materials.push(lucky.material);
    materials_en.push(lucky.material_en);
  }

  // 去重
  const unique = arr => [...new Set(arr)];

  return {
    xiyong,
    colors: unique(colors),
    colors_en: unique(colors_en),
    numbers: unique(numbers).sort((a, b) => a - b),
    directions: unique(directions),
    directions_en: unique(directions_en),
    seasons: unique(seasons),
    seasons_en: unique(seasons_en),
    foods: unique(foods),
    foods_en: unique(foods_en),
    materials: unique(materials),
    materials_en: unique(materials_en),
    summary: buildLuckySummary(xiyong, unique(colors), unique(numbers), unique(directions)),
    summary_en: buildLuckySummaryEn(xiyong, unique(colors_en), unique(numbers), unique(directions_en)),
  };
}

function buildLuckySummary(xiyong, colors, numbers, directions) {
  return `喜用五行：${xiyong.join('、')}
幸运颜色：${colors.join('、')}
幸运数字：${numbers.join('、')}
幸运方位：${directions.join('、')}`;
}

function buildLuckySummaryEn(xiyong, colors, numbers, directions) {
  return `Favorable elements: ${xiyong.join(', ')}
Lucky colors: ${colors.join(', ')}
Lucky numbers: ${numbers.join(', ')}
Lucky directions: ${directions.join(', ')}`;
}

module.exports = { analyzeLucky };
