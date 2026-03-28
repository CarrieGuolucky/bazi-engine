/**
 * 健康预警模块
 *
 * 五行缺失/偏弱 → 对应器官风险
 * 不是诊断，是提醒"注意保养"
 */

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

// 五行对应身体器官
const WUXING_HEALTH = {
  '木': {
    organs: '肝、胆、眼睛、筋腱',
    weak_risk: '肝气不足，容易疲劳、眼睛干涩、筋骨僵硬',
    excess_risk: '肝火旺，容易发脾气、头痛、眼睛红',
    advice: '多吃绿色蔬菜，保持心情舒畅，少熬夜',
    en: {
      organs: 'Liver, gallbladder, eyes, tendons',
      weak_risk: 'Low energy, dry eyes, stiff joints',
      excess_risk: 'Irritability, headaches, eye strain',
      advice: 'Eat green vegetables, manage stress, sleep early',
    }
  },
  '火': {
    organs: '心脏、小肠、血管、舌',
    weak_risk: '心气不足，容易心悸、手脚冰凉、气色差',
    excess_risk: '心火旺，容易失眠、口腔溃疡、焦虑',
    advice: '适当运动但别过度，少吃辛辣，保持心态平和',
    en: {
      organs: 'Heart, blood vessels, tongue',
      weak_risk: 'Palpitations, cold hands/feet, pale complexion',
      excess_risk: 'Insomnia, mouth ulcers, anxiety',
      advice: 'Moderate exercise, less spicy food, stay calm',
    }
  },
  '土': {
    organs: '脾、胃、肌肉、口唇',
    weak_risk: '脾胃虚弱，容易消化不良、食欲差、肌肉无力',
    excess_risk: '湿气重，容易浮肿、身体沉重、皮肤问题',
    advice: '规律饮食，少吃生冷，适当健脾祛湿',
    en: {
      organs: 'Stomach, spleen, muscles',
      weak_risk: 'Poor digestion, low appetite, muscle weakness',
      excess_risk: 'Water retention, heaviness, skin issues',
      advice: 'Regular meals, avoid cold foods, stay active',
    }
  },
  '金': {
    organs: '肺、大肠、皮肤、鼻',
    weak_risk: '肺气不足，容易感冒、皮肤敏感、呼吸浅',
    excess_risk: '金旺克木，容易便秘、皮肤干燥',
    advice: '多做深呼吸，注意保湿，秋冬防感冒',
    en: {
      organs: 'Lungs, large intestine, skin, nose',
      weak_risk: 'Frequent colds, sensitive skin, shallow breathing',
      excess_risk: 'Constipation, dry skin',
      advice: 'Deep breathing exercises, moisturize, prevent colds',
    }
  },
  '水': {
    organs: '肾、膀胱、骨骼、耳朵',
    weak_risk: '肾气不足，容易腰酸、耳鸣、记忆力下降、脱发',
    excess_risk: '水太旺，容易水肿、怕冷、泌尿问题',
    advice: '早睡护肾，少吃太咸，冬天注意保暖',
    en: {
      organs: 'Kidneys, bladder, bones, ears',
      weak_risk: 'Back pain, tinnitus, memory loss, hair loss',
      excess_risk: 'Edema, feeling cold, urinary issues',
      advice: 'Sleep early, less salt, stay warm in winter',
    }
  },
};

// 身强弱对健康的影响
const STRENGTH_HEALTH = {
  '身强': {
    desc: '身强的人精力充沛，但容易过度消耗',
    risk: '不知疲倦导致过劳，高血压风险',
    advice: '学会休息，别硬撑',
    en: { desc: 'High energy but prone to overwork', risk: 'Burnout, high blood pressure', advice: 'Learn to rest' }
  },
  '偏强': {
    desc: '精力较好，体质偏强',
    risk: '容易忽视身体信号',
    advice: '定期体检，别仗着年轻不当回事',
    en: { desc: 'Good energy, strong constitution', risk: 'May ignore body signals', advice: 'Regular checkups' }
  },
  '中和': {
    desc: '身体平衡，整体健康',
    risk: '没有特别的风险倾向',
    advice: '保持现有的生活习惯就好',
    en: { desc: 'Balanced health', risk: 'No major tendencies', advice: 'Maintain current habits' }
  },
  '偏弱': {
    desc: '精力一般，容易疲劳',
    risk: '抵抗力偏弱，换季容易生病',
    advice: '注意休息，适当进补，规律运动',
    en: { desc: 'Moderate energy, tires easily', risk: 'Lower immunity', advice: 'Rest well, supplement, exercise regularly' }
  },
  '身弱': {
    desc: '精力有限，需要合理分配',
    risk: '免疫力较低，压力大容易生病',
    advice: '别硬撑，学会说不，保证睡眠',
    en: { desc: 'Limited energy, needs careful management', risk: 'Lower immunity under stress', advice: 'Set boundaries, prioritize sleep' }
  },
};

/**
 * 健康分析
 */
function analyzeHealth(strengthAnalysis, dayMasterElement) {
  const wuxingRatio = strengthAnalysis.wuxingRatio || {};
  const strength = strengthAnalysis.strength || '中和';

  // 1. 找五行偏弱和偏强
  const warnings = [];
  const avg = 20; // 五行平均各20%

  for (const [wx, ratio] of Object.entries(wuxingRatio)) {
    const health = WUXING_HEALTH[wx];
    if (!health) continue;

    if (ratio <= 5) {
      warnings.push({
        element: wx,
        level: 'severe',
        type: 'deficient',
        ratio,
        organs: health.organs,
        risk: health.weak_risk,
        advice: health.advice,
        desc: `${wx}极弱（${ratio}%）— ${health.organs}需要重点保养`,
        en_desc: `${wx} severely low (${ratio}%) — ${health.en.organs} need attention`,
      });
    } else if (ratio <= 10) {
      warnings.push({
        element: wx,
        level: 'moderate',
        type: 'deficient',
        ratio,
        organs: health.organs,
        risk: health.weak_risk,
        advice: health.advice,
        desc: `${wx}偏弱（${ratio}%）— 注意${health.organs}保养`,
        en_desc: `${wx} low (${ratio}%) — watch ${health.en.organs}`,
      });
    } else if (ratio >= 40) {
      warnings.push({
        element: wx,
        level: 'moderate',
        type: 'excess',
        ratio,
        organs: health.organs,
        risk: health.excess_risk,
        advice: health.advice,
        desc: `${wx}偏旺（${ratio}%）— ${health.excess_risk}`,
        en_desc: `${wx} high (${ratio}%) — ${health.en.excess_risk}`,
      });
    }
  }

  // 2. 身强弱对健康的影响
  const strengthHealth = STRENGTH_HEALTH[strength] || STRENGTH_HEALTH['中和'];

  // 3. 日主五行的器官
  const dayMasterHealth = WUXING_HEALTH[dayMasterElement] || {};

  // 4. 总结
  const summary = buildHealthSummary(warnings, strengthHealth, dayMasterElement, dayMasterHealth, wuxingRatio);

  return {
    warnings,
    strengthHealth,
    dayMasterElement,
    dayMasterHealth,
    wuxingRatio,
    summary,
  };
}

function buildHealthSummary(warnings, strengthHealth, dayElement, dayHealth, ratios) {
  let s = `【体质总评】${strengthHealth.desc}\n`;
  s += `【日主${dayElement}】重点关注：${dayHealth.organs || ''}\n`;

  if (warnings.length === 0) {
    s += '\n五行分布较均衡，没有特别需要注意的健康风险。保持良好生活习惯即可。';
  } else {
    s += '\n【需要注意】\n';
    warnings.forEach(w => {
      s += `· ${w.desc}\n  建议：${w.advice}\n`;
    });
  }

  s += `\n【养生建议】${strengthHealth.advice}`;
  return s;
}

module.exports = { analyzeHealth };
