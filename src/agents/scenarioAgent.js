/**
 * 场景匹配 Agent
 * 职责：根据用户选择的场景，生成对应的解读框架和prompt指令
 * 输入：场景ID + 用户补充描述 + 八字数据
 * 输出：场景化的prompt指令，指导Writer Agent如何生成报告
 */

const SCENARIOS = {
  // 🌟 通用场景（chat / decision tool用）
  'general': {
    title: { en: 'Life Guidance', zh: '人生导航' },
    emotionalHook: {
      en: "You have a question on your mind. Let's see what your chart says about it.",
      zh: '你心里有个问题想搞清楚。我们来看看你的命盘怎么说。',
    },
    focusAreas: ['career_timing', 'financial_outlook', 'relationship', 'decision_window'],
    keyQuestions: [
      '用户的核心问题是什么，结合八字给出具体建议',
      '当前大运流年的整体运势',
      '未来1-3年的最佳行动窗口',
      '根据格局给出适合的方向',
    ],
    actionFramework: 'timing_based',
  },
  'decision': {
    title: { en: 'Decision Analysis', zh: '决策分析' },
    emotionalHook: {
      en: "Big decisions deserve more than a coin flip. Let's see what your chart says about the timing.",
      zh: '重大决定不能靠抛硬币。我们来看看你的命盘对这个时机怎么说。',
    },
    focusAreas: ['career_timing', 'financial_outlook', 'decision_window'],
    keyQuestions: [
      '用户面临的具体决策是什么',
      '当前流年是否支持重大变动',
      '格局类型适合哪个选项',
      '最佳决策时间窗口',
      '风险点和化解方案',
    ],
    actionFramework: 'decision_based',
  },
  // 🔥 紧急决定
  'job-offer': {
    title: { en: 'Should You Take This Offer?', zh: '这个offer该不该接？' },
    emotionalHook: {
      en: "You have an offer in hand, a deadline ticking, and a gut feeling you can't quite name. Let's see what the timing says.",
      zh: '手上有offer，deadline在倒计时，心里有个说不清的感觉。我们来看看时机怎么说。',
    },
    focusAreas: ['career_timing', 'financial_outlook', 'decision_window'],
    keyQuestions: [
      '当前大运流年是否支持工作变动',
      '财星状态——新工作的财运如何',
      '官星状态——在新环境能否被重用',
      '未来2-3年的运势趋势（值不值得冒险）',
    ],
    actionFramework: 'timing_based', // 给出具体时间建议
  },
  'laid-off': {
    title: { en: "You Got Laid Off. Now What?", zh: '被裁了，接下来怎么走？' },
    emotionalHook: {
      en: "Being laid off doesn't mean you failed — it means this chapter is closing. The question isn't 'why me' but 'what's next and when.'",
      zh: '被裁不是你的失败——是这一章该翻篇了。问题不是"为什么是我"，而是"接下来该走哪、什么时候动"。',
    },
    focusAreas: ['career_direction', 'recovery_timeline', 'hidden_strengths'],
    keyQuestions: [
      '日主和格局指向什么行业方向',
      '当前运势是蛰伏期还是转折期',
      '什么时候会有新机会出现（财星/官星何时透出）',
      '身弱还是身强——决定该休息还是立刻行动',
    ],
    actionFramework: 'direction_based', // 给方向+时间
  },
  'visa': {
    title: { en: 'Visa Clock Is Ticking', zh: '签证倒计时' },
    emotionalHook: {
      en: "When your right to stay in a country has a deadline, every decision carries extra weight. Let's look at what the timing supports.",
      zh: '当你在一个国家的居留权有倒计时，每个决定都格外沉重。我们来看时机支持什么。',
    },
    focusAreas: ['relocation_energy', 'career_timing', 'geographic_affinity'],
    keyQuestions: [
      '五行喜用与方位的关系——留下还是回去哪个方位更旺',
      '当前运势是否支持重大迁移',
      '未来1-2年的官星（贵人/机构支持）状态',
    ],
    actionFramework: 'urgency_based',
  },

  // 💭 犹豫不决
  'quit-scared': {
    title: { en: "Want to Quit But Scared?", zh: '想辞职但不敢？' },
    emotionalHook: {
      en: "You already know you want to leave. The question isn't 'should I' — it's 'when.' Your chart has a timeline.",
      zh: '你心里已经知道想走了。问题不是"该不该"，而是"什么时候"。你的命盘有时间表。',
    },
    focusAreas: ['career_timing', 'financial_safety', 'courage_indicators'],
    keyQuestions: [
      '什么时候辞职风险最小（财星和官星的流年位置）',
      '身弱还是身强——决定你能不能扛空窗期',
      '食伤状态——你是否有创业/自由职业的能量',
      '具体哪个月/季度最适合提离职',
    ],
    actionFramework: 'timing_based',
  },
  'counteroffer': {
    title: { en: 'Counteroffer: Stay or Go?', zh: '收到counteroffer，走还是留？' },
    emotionalHook: {
      en: "They suddenly value you — but only because you're leaving. Let's see if this relationship still has energy.",
      zh: '他们突然重视你了——但只因为你要走。我们来看这段关系还有没有能量。',
    },
    focusAreas: ['relationship_with_authority', 'career_timing', 'trust_indicators'],
    keyQuestions: [
      '官星状态——你和"权威/组织"的关系是在加强还是在解体',
      '当前大运是留的运还是走的运',
      '印星（忠诚/归属感）在命盘中的位置',
    ],
    actionFramework: 'decision_based',
  },
  'career-change': {
    title: { en: 'Is It Too Late to Change Careers?', zh: '转行，还来得及吗？' },
    emotionalHook: {
      en: "You're not 'too late.' The real question is whether the timing supports a pivot — and what direction to pivot to.",
      zh: '你不是"太晚了"。真正的问题是时机是否支持转向——以及该转向哪里。',
    },
    focusAreas: ['career_direction', 'learning_ability', 'timing'],
    keyQuestions: [
      '格局分析——你的命盘核心竞争力是什么',
      '印星状态——当前是否是学习/转型期',
      '未来大运的方向——转型后的前景如何',
      '什么领域的五行与你的喜用最匹配',
    ],
    actionFramework: 'direction_based',
  },
  'startup': {
    title: { en: 'Should You Join This Startup?', zh: '要不要一起创业？' },
    emotionalHook: {
      en: "Someone believes in a vision and wants you in. But is this YOUR moment to bet big?",
      zh: '有人相信一个愿景，想拉你入伙。但现在是不是你下大注的时机？',
    },
    focusAreas: ['risk_tolerance', 'partnership_compatibility', 'financial_timing'],
    keyQuestions: [
      '食伤状态——你有没有创业的能量',
      '财星走势——创业后的财务前景',
      '比劫状态——合伙关系是帮你还是分你的',
      '什么时间窗口最适合启动',
    ],
    actionFramework: 'risk_based',
  },
  'relocate': {
    title: { en: 'Follow Your Partner or Stay?', zh: '跟伴侣搬城市，还是留下？' },
    emotionalHook: {
      en: "Love or career? This isn't really a choice between two things — it's about which timeline you're choosing.",
      zh: '爱情还是事业？这其实不是二选一——而是你选择走哪条时间线。',
    },
    focusAreas: ['relationship_strength', 'geographic_affinity', 'career_portability'],
    keyQuestions: [
      '配偶星在命盘中的强度和位置',
      '五行喜用对应的方位（东南西北哪个方向旺你）',
      '当前运势是否支持迁移',
    ],
    actionFramework: 'decision_based',
  },

  // 📐 人生规划
  'school': {
    title: { en: 'Back to School — Worth It?', zh: '该不该读研？' },
    emotionalHook: {
      en: "Education is an investment. Let's see if the return matches your chart's trajectory.",
      zh: '教育是一笔投资。我们来看回报是否匹配你命盘的走向。',
    },
    focusAreas: ['learning_period', 'career_roi', 'timing'],
    keyQuestions: [
      '印星状态——当前是否是学习期（印星旺=适合读书）',
      '未来3-5年的事业运势——读完出来赶得上好运吗',
      '财星走势——读书期间的经济压力如何',
    ],
    actionFramework: 'roi_based',
  },
  'baby-career': {
    title: { en: 'Baby vs Career — Can You Have Both?', zh: '孩子和事业怎么兼顾？' },
    emotionalHook: {
      en: "This isn't about choosing one over the other. It's about knowing which years to lean into which.",
      zh: '这不是二选一。而是知道哪几年侧重哪个。',
    },
    focusAreas: ['family_timing', 'career_recovery', 'energy_management'],
    keyQuestions: [
      '食伤（子女星）和官星（事业星）在大运中的分布',
      '未来5年哪些年适合侧重家庭、哪些年适合冲事业',
      '身弱还是身强——决定你同时扛两个的能力',
    ],
    actionFramework: 'balance_based',
  },
  'golden-handcuffs': {
    title: { en: 'Golden Handcuffs: Stay or Break Free?', zh: '高薪but不开心，走还是留？' },
    emotionalHook: {
      en: "You can afford everything except the feeling that you're in the right place. Let's see when the window opens.",
      zh: '你什么都买得起，除了"我在对的地方"的感觉。我们来看窗口什么时候打开。',
    },
    focusAreas: ['career_satisfaction', 'financial_safety', 'transition_timing'],
    keyQuestions: [
      '当前财星vs食伤的比例——赚钱多但是否开心',
      '什么时候走财务损失最小',
      '未来大运是否支持转型',
    ],
    actionFramework: 'timing_based',
  },
  'ai-replace': {
    title: { en: 'Will AI Replace You?', zh: 'AI会取代你吗？' },
    emotionalHook: {
      en: "AI replaces tasks, not people. The real question: are you positioned for what AI can't do?",
      zh: 'AI替代的是任务，不是人。真正的问题是：你是否站在AI做不了的位置上？',
    },
    focusAreas: ['core_strengths', 'adaptability', 'future_direction'],
    keyQuestions: [
      '格局分析——你的核心竞争力是执行层还是关系层',
      '食伤状态——你的创造力/独特性有多强',
      '官星状态——你在组织中的不可替代性',
      '未来大运是否支持转型/升级',
    ],
    actionFramework: 'positioning_based',
  },
  'strengths': {
    title: { en: "What Are You Actually Good At?", zh: '你到底适合做什么？' },
    emotionalHook: {
      en: "You're not lost — you just haven't found the frame that makes everything click. Your chart is that frame.",
      zh: '你不是迷失了——你只是还没找到让一切串起来的框架。你的命盘就是那个框架。',
    },
    focusAreas: ['career_direction', 'personality_strengths', 'ideal_environment'],
    keyQuestions: [
      '格局决定方向——正官格/食伤格/财格各适合什么',
      '五行喜用对应的行业',
      '十神组合指向的工作风格（独立/协作/创造/管理）',
      '当前大运适合什么类型的发展',
    ],
    actionFramework: 'direction_based',
  },

  // 💰 财务
  'house': {
    title: { en: 'Should You Buy a House Now?', zh: '现在该不该买房？' },
    emotionalHook: {
      en: "A house is the biggest bet most people make. Let's see if the timing favors this commitment.",
      zh: '买房是大多数人最大的赌注。我们来看时机是否支持这个决定。',
    },
    focusAreas: ['financial_timing', 'stability_indicators', 'property_luck'],
    keyQuestions: [
      '财星和财库状态——当前是否是置产的好时机',
      '未来3-5年财运走势——买了之后能不能供得起',
      '土的能量——命盘中不动产运如何',
    ],
    actionFramework: 'timing_based',
  },
  'job-hop': {
    title: { en: 'Job Hop for More Money?', zh: '跳槽涨薪值不值？' },
    emotionalHook: {
      en: "More money is always tempting. But is this the right cycle to move — or will waiting 6 months double the opportunity?",
      zh: '更多的钱总是诱人的。但现在是该动的周期吗——还是再等6个月机会翻倍？',
    },
    focusAreas: ['career_timing', 'financial_peak', 'stability_vs_growth'],
    keyQuestions: [
      '当前流年的财星状态——今年跳是否财运到位',
      '官星变化——跳过去能否被重用',
      '最佳跳槽月份/季度',
    ],
    actionFramework: 'timing_based',
  },

  // ❤️ 感情
  'right-person': {
    title: { en: 'Is This Person Right for You?', zh: '这个人适合你吗？' },
    emotionalHook: {
      en: "Chemistry is easy. Compatibility is deeper. Let's see what the charts say about this connection.",
      zh: '心动容易，适配更深。我们来看命盘怎么说这段缘分。',
    },
    focusAreas: ['partner_compatibility', 'relationship_timing', 'long_term_outlook'],
    keyQuestions: [
      '配偶星在你命盘中的特征——你命中需要什么样的人',
      '当前流年是否是正缘出现的时机',
      '如果有对方生日，可以做合盘分析',
    ],
    actionFramework: 'compatibility_based',
  },
  'marriage': {
    title: { en: 'When Should You Get Married?', zh: '什么时候结婚最好？' },
    emotionalHook: {
      en: "Marriage is about two timelines converging. Let's find where yours align.",
      zh: '婚姻是两条时间线的交汇。我们来找你们的交汇点。',
    },
    focusAreas: ['marriage_timing', 'partner_analysis', 'family_outlook'],
    keyQuestions: [
      '配偶星何时最旺——哪年结婚最吉利',
      '红鸾天喜等婚姻神煞的流年',
      '未来3年哪个年份最适合',
    ],
    actionFramework: 'timing_based',
  },
  'compatibility': {
    title: { en: 'Compatibility Deep Dive', zh: '合盘深度分析' },
    emotionalHook: {
      en: "Let's look at how your charts interact — where you strengthen each other, and where you'll need to work.",
      zh: '让我们看看两个人的命盘如何互动——哪里互相加持，哪里需要磨合。',
    },
    focusAreas: ['partner_compatibility', 'synergy_analysis', 'conflict_areas'],
    keyQuestions: [
      '天干有无合（天合）',
      '地支有无合（地合）',
      '日主关系——互相是对方的什么十神',
      '五行互补还是重叠',
    ],
    actionFramework: 'compatibility_based',
  },
};

/**
 * 场景匹配Agent主函数
 */
function runScenarioAgent(input) {
  const { scenarioId, userContext = '', baziData } = input;

  const scenario = SCENARIOS[scenarioId];
  if (!scenario) {
    return { error: `Unknown scenario: ${scenarioId}`, availableScenarios: Object.keys(SCENARIOS) };
  }

  // 根据八字数据和场景生成定制化的prompt指令
  const { dayMaster, strength, xiyong, fourPillars, tenGods, wuxing } = baziData;

  // 确定重点分析的十神
  const relevantGods = scenario.focusAreas.map(area => {
    switch (area) {
      case 'career_timing': return '重点看官星和印星的大运流年变化';
      case 'career_direction': return '重点看格局和十神组合指向的职业方向';
      case 'financial_outlook': return '重点看财星（正财偏财）的状态和走势';
      case 'financial_safety': return '重点看财库和身强弱——能否扛住经济压力';
      case 'recovery_timeline': return '重点看什么时候喜用神到位——恢复期多长';
      case 'hidden_strengths': return '重点看食伤和印星——你有什么被低估的能力';
      case 'relationship_strength': return '重点看配偶星的强度和位置';
      case 'partner_compatibility': return '重点看日主关系和地支合冲';
      case 'learning_ability': return '重点看印星——是否适合学习期';
      case 'risk_tolerance': return '重点看身强弱和比劫——能不能扛风险';
      case 'core_strengths': return '重点看格局和十神——核心竞争力在哪';
      default: return '';
    }
  }).filter(Boolean);

  return {
    scenario: {
      id: scenarioId,
      title: scenario.title,
      emotionalHook: scenario.emotionalHook,
      framework: scenario.actionFramework,
    },
    promptInstructions: {
      tone: 'empathetic_then_analytical',
      structure: [
        { section: 'emotional_hook', instruction: '用场景的emotionalHook开头，修改为贴合用户的具体描述' },
        { section: 'chart_analysis', instruction: `${relevantGods.join('；')}` },
        { section: 'timeline', instruction: '给出未来3-5年的时间表，标注关键年份和具体建议' },
        { section: 'actions', instruction: '给出3个立刻可执行的行动，每个都要有命理依据+现实逻辑' },
        { section: 'empowerment', instruction: '以赋权的话结尾——最终决定在用户手上' },
      ],
      keyQuestions: scenario.keyQuestions,
      userContext,
      strengthContext: strength === '身弱'
        ? '用户身弱，建议保守策略，强调等待时机和积蓄力量'
        : '用户身强，可以建议更大胆的行动，但注意过刚易折',
    },
  };
}

module.exports = { runScenarioAgent, SCENARIOS };
