/**
 * 八字排盘 Agent
 * 职责：纯计算，输入生日 → 输出完整的八字数据结构
 * 工具：lunar-javascript（无需API，本地计算）
 */

const { Solar, Lunar } = require('lunar-javascript');
const { analyzeStrength } = require('../strength');
const { analyzeShenSha } = require('../shensha');
const { analyzeGeJu } = require('../geju');
const { analyzeMuKu } = require('../muku');
const { analyzeXingPoHai } = require('../xingpohai');
const { analyzeShierChangSheng } = require('../shierChangSheng');
const { analyzeKongWang } = require('../kongwang');

/**
 * 真太阳时修正
 * @param {number} hour - 北京时间小时
 * @param {number} minute - 北京时间分钟
 * @param {number} longitude - 出生地经度
 * @param {number} month - 月份(1-12)
 * @param {number} day - 日期
 * @returns {{ hour: number, minute: number }}
 */
function trueSolarTime(hour, minute, longitude, month, day) {
  // 经度修正：每度4分钟
  const longitudeCorrection = (longitude - 120) * 4;

  // 均时差近似（分钟）
  const dayOfYear = Math.floor((month - 1) * 30.44 + day);
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  const totalMinutes = hour * 60 + minute + longitudeCorrection + equationOfTime;
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: Math.round(totalMinutes % 60)
  };
}

// 主要城市经度表
const CITY_LONGITUDES = {
  // 中国
  '北京': 116.4, '上海': 121.5, '广州': 113.3, '深圳': 114.1,
  '杭州': 120.2, '南京': 118.8, '成都': 104.1, '重庆': 106.5,
  '武汉': 114.3, '西安': 108.9, '长沙': 113.0, '郴州': 113.0,
  '临武': 112.5, '大庆': 125.0, '珠海': 113.6, '佛山': 113.1,
  '哈尔滨': 126.6, '沈阳': 123.4, '天津': 117.2,
  // 美国
  'San Francisco': -122.4, 'Sunnyvale': -122.0, 'San Jose': -121.9,
  'Los Angeles': -118.2, 'New York': -74.0, 'Seattle': -122.3,
  'Austin': -97.7, 'Boston': -71.1, 'Chicago': -87.6,
  'Pittsburgh': -80.0, 'Houston': -95.4,
  // 其他
  'Sydney': 151.2, 'Melbourne': 144.9, 'London': -0.1,
  'Tokyo': 139.7, 'Singapore': 103.8, 'Hong Kong': 114.2,
  '香港': 114.2, '台北': 121.5, '首尔': 127.0,
};

function getCityLongitude(city) {
  if (!city) return 120; // 默认北京时间
  for (const [name, lng] of Object.entries(CITY_LONGITUDES)) {
    if (city.includes(name) || name.includes(city)) return lng;
  }
  return 120;
}

/**
 * 八字排盘Agent主函数
 */
function runBaziAgent(input) {
  const { year, month, day, hour = 12, minute = 0, birthCity = '', gender = 'male', isLunar = false } = input;

  // 1. 处理阴历转阳历
  let solarYear = year, solarMonth = month, solarDay = day;
  if (isLunar) {
    const lunar = Lunar.fromYmd(year, month, day);
    const solar = lunar.getSolar();
    solarYear = solar.getYear();
    solarMonth = solar.getMonth();
    solarDay = solar.getDay();
  }

  // 2. 真太阳时修正
  const longitude = getCityLongitude(birthCity);
  const tst = trueSolarTime(hour, minute, longitude, solarMonth, solarDay);

  // 3. 排盘
  const solar = Solar.fromYmdHms(solarYear, solarMonth, solarDay, tst.hour, tst.minute, 0);
  const lunar = solar.getLunar();
  const bazi = lunar.getEightChar();

  // 4. 提取四柱
  const fourPillars = {
    year: { ganZhi: bazi.getYear(), gan: bazi.getYear()[0], zhi: bazi.getYear()[1] },
    month: { ganZhi: bazi.getMonth(), gan: bazi.getMonth()[0], zhi: bazi.getMonth()[1] },
    day: { ganZhi: bazi.getDay(), gan: bazi.getDay()[0], zhi: bazi.getDay()[1] },
    hour: { ganZhi: bazi.getTime(), gan: bazi.getTime()[0], zhi: bazi.getTime()[1] },
  };

  // 5. 日主
  const dayMaster = fourPillars.day.gan;

  // 6. 十神
  const tenGods = {
    yearGan: bazi.getYearShiShenGan(),
    monthGan: bazi.getMonthShiShenGan(),
    hourGan: bazi.getTimeShiShenGan(),
    yearZhi: bazi.getYearShiShenZhi(),
    monthZhi: bazi.getMonthShiShenZhi(),
    dayZhi: bazi.getDayShiShenZhi(),
    hourZhi: bazi.getTimeShiShenZhi(),
  };

  // 7. 五行统计
  const ganWuXing = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const zhiWuXing = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  const wuxing = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  for (const p of ['year', 'month', 'day', 'hour']) {
    wuxing[ganWuXing[fourPillars[p].gan]]++;
    wuxing[zhiWuXing[fourPillars[p].zhi]]++;
  }

  // 8. 纳音
  const nayin = {
    year: bazi.getYearNaYin(),
    month: bazi.getMonthNaYin(),
    day: bazi.getDayNaYin(),
    hour: bazi.getTimeNaYin(),
  };

  // 9. 胎元命宫身宫
  const extras = {
    taiYuan: bazi.getTaiYuan(),
    mingGong: bazi.getMingGong(),
    shenGong: bazi.getShenGong(),
  };

  // 10. 大运
  const isFemale = gender === 'female' ? 0 : 1;
  const yun = bazi.getYun(isFemale);
  const daYunList = yun.getDaYun();
  const daYun = [];
  for (let i = 1; i < Math.min(daYunList.length, 10); i++) {
    const dy = daYunList[i];
    const entry = {
      ganZhi: dy.getGanZhi(),
      startYear: dy.getStartYear(),
      endYear: dy.getEndYear(),
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      isCurrent: dy.getStartYear() <= 2026 && 2026 <= dy.getEndYear(),
    };

    // 当前大运的流年
    if (entry.isCurrent) {
      entry.liuNian = [];
      const lnList = dy.getLiuNian();
      for (const ln of lnList) {
        entry.liuNian.push({
          year: ln.getYear(),
          ganZhi: ln.getGanZhi(),
          isCurrent: ln.getYear() === 2026,
        });
      }
    }
    daYun.push(entry);
  }

  // 11. 日主强弱精确判断（使用月令权重算法）
  const dayMasterElement = ganWuXing[dayMaster];
  const strengthResult = analyzeStrength(fourPillars);
  const strength = strengthResult.strength;
  const xiyong = strengthResult.xiyong;

  // 12. 神煞分析
  const shenSha = analyzeShenSha(fourPillars);

  // 13. 格局分析
  const geJu = analyzeGeJu(fourPillars, strengthResult);

  // 14. 墓库分析
  const muKu = analyzeMuKu(fourPillars, dayMasterElement, daYun);

  // 15. 刑破害分析
  const xingPoHai = analyzeXingPoHai(fourPillars);

  // 16. 十二长生
  const changSheng = analyzeShierChangSheng(fourPillars, dayMaster);

  // 17. 空亡深度解读
  const kongWangAnalysis = analyzeKongWang(fourPillars, dayMaster);

  return {
    input: {
      original: `${year}-${month}-${day} ${hour}:${minute}`,
      birthCity,
      trueSolarTime: `${tst.hour}:${String(tst.minute).padStart(2, '0')}`,
      longitude,
      gender,
    },
    fourPillars,
    dayMaster,
    dayMasterElement,
    strength,
    xiyong,
    tenGods,
    wuxing,
    nayin,
    extras,
    daYun,
    shenSha,
    geJu,
    muKu,
    xingPoHai,
    changSheng,
    kongWangAnalysis,
    strengthAnalysis: strengthResult,
    solarDate: `${solarYear}-${String(solarMonth).padStart(2, '0')}-${String(solarDay).padStart(2, '0')}`,
    lunarDate: lunar.toString(),
  };
}

module.exports = { runBaziAgent, getCityLongitude, trueSolarTime };
