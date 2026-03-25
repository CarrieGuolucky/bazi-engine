/**
 * 八字AI引擎 — 独立API服务
 *
 * 启动: CLAUDE_API_KEY=你的key node api.js
 *
 * 接口:
 * POST /api/chart    → 排盘（不需要AI，秒出）
 * POST /api/report   → 完整报告（调Claude API）
 * POST /api/hepan    → 合盘分析（调Claude API）
 */

const http = require('http');
const { runBaziAgent } = require('./src/agents/baziAgent');
const { runLiuNianAgent } = require('./src/agents/liuNianAgent');
const { runScenarioAgent } = require('./src/agents/scenarioAgent');
const { runHePanAgent, buildHePanWriterPrompt } = require('./src/agents/hePanAgent');
const { orchestrate } = require('./src/orchestrator');
const { runDynamicEngine } = require('./src/dynamicEngine');

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.CLAUDE_API_KEY;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, data, status = 200) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;

  // 健康检查
  if (url === '/api/health') {
    return json(res, { status: 'ok', hasApiKey: !!API_KEY });
  }

  // 每日运势（不需要API key，纯本地计算）
  if (url === '/api/daily' && req.method === 'POST') {
    const body = await parseBody(req);
    try {
      const { Solar } = require('lunar-javascript');
      const { getStage, STAGE_MEANING } = require('./src/shierChangSheng');
      const { analyzeShenSha } = require('./src/shensha');

      const bazi = runBaziAgent(body);
      const today = Solar.fromDate(new Date());
      const lunar = today.getLunar();
      const dayBazi = lunar.getEightChar();
      const todayGan = dayBazi.getDay()[0];
      const todayZhi = dayBazi.getDay()[1];
      const todayGanZhi = dayBazi.getDay();

      const GAN_WUXING = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
      const ZHI_WUXING = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };

      // 今日干支对日主的十神
      const dayMaster = bazi.dayMaster;
      const dmWx = GAN_WUXING[dayMaster];
      const todayGanWx = GAN_WUXING[todayGan];
      const todayZhiWx = ZHI_WUXING[todayZhi];
      const isGanXiyong = bazi.xiyong.includes(todayGanWx);
      const isZhiXiyong = bazi.xiyong.includes(todayZhiWx);

      // 今日十二长生
      const todayStage = getStage(dayMaster, todayZhi);
      const stageMeaning = STAGE_MEANING[todayStage] || {};

      // 今日能量评分
      let score = 50;
      if (isGanXiyong) score += 20;
      if (isZhiXiyong) score += 20;
      if (todayStage === '帝旺' || todayStage === '临官') score += 10;
      if (todayStage === '绝' || todayStage === '死') score -= 10;
      score = Math.max(10, Math.min(100, score));

      // 今日建议
      const SHISHEN = { '比肩':'同行/竞争者','劫财':'朋友/合作','食神':'创意/表达','伤官':'突破/创新','偏印':'学习/灵感','正印':'贵人/考试','偏财':'投资/外财','正财':'正财/薪资','七杀':'压力/挑战','正官':'领导/面试' };
      const GAN_YY = { '甲':true,'乙':false,'丙':true,'丁':false,'戊':true,'己':false,'庚':true,'辛':false,'壬':true,'癸':false };
      const WUXING_SHENG = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
      const WUXING_KE = { '木':'土','土':'水','水':'火','火':'金','金':'木' };
      let ganSS = '';
      const sameP = GAN_YY[dayMaster] === GAN_YY[todayGan];
      if (dmWx === todayGanWx) ganSS = sameP ? '比肩' : '劫财';
      else if (WUXING_SHENG[dmWx] === todayGanWx) ganSS = sameP ? '食神' : '伤官';
      else if (WUXING_SHENG[todayGanWx] === dmWx) ganSS = sameP ? '偏印' : '正印';
      else if (WUXING_KE[dmWx] === todayGanWx) ganSS = sameP ? '偏财' : '正财';
      else if (WUXING_KE[todayGanWx] === dmWx) ganSS = sameP ? '七杀' : '正官';

      const tips = {
        '比肩': { good: '适合独立工作、展示实力', bad: '避免跟同行争执' },
        '劫财': { good: '适合社交、合作谈判', bad: '不宜借钱给朋友' },
        '食神': { good: '创意灵感爆棚，适合创作、提案', bad: '别太放纵享乐' },
        '伤官': { good: '适合打破常规、提出新方案', bad: '管住嘴，别怼领导' },
        '偏印': { good: '适合学习新技能、研究', bad: '别钻牛角尖' },
        '正印': { good: '贵人运好，适合考试、面试、见mentor', bad: '别太依赖别人' },
        '偏财': { good: '适合投资、见客户、谈合作', bad: '控制冲动消费' },
        '正财': { good: '正财日，适合谈薪资、收款、签合同', bad: '别贪小便宜' },
        '七杀': { good: '适合攻坚、竞标、挑战高难度任务', bad: '注意压力管理' },
        '正官': { good: '适合见领导、面试、谈晋升', bad: '别挑战权威' },
      };
      const todayTip = tips[ganSS] || { good: '平稳度过', bad: '无特别注意' };

      return json(res, {
        date: today.toYmd(),
        lunar: lunar.toString(),
        todayGanZhi,
        todayGan,
        todayZhi,
        todayElement: todayGanWx,
        ganShiShen: ganSS,
        ganShiShenLabel: SHISHEN[ganSS] || '',
        isGanXiyong,
        isZhiXiyong,
        score,
        stage: todayStage,
        stagePhase: stageMeaning.phase || '',
        stageCareer: stageMeaning.career || '',
        tip: todayTip,
        summary: `${today.toYmd()} ${todayGanZhi}日 | ${ganSS}日（${SHISHEN[ganSS]||''}）| ${todayStage} | ${score}分`,
        advice: isGanXiyong ? todayTip.good : todayTip.bad,
      });
    } catch (e) {
      return json(res, { error: e.message }, 400);
    }
  }

  // 排盘（不需要API key，纯本地计算）
  // 返回完整分析：四柱+身强弱+格局+神煞+墓库+刑破害+十二长生+空亡+动态引擎
  if (url === '/api/chart' && req.method === 'POST') {
    const body = await parseBody(req);
    try {
      const bazi = runBaziAgent(body);
      const liuNian = runLiuNianAgent(bazi);
      const startYear = body.startYear || new Date().getFullYear();
      const endYear = body.endYear || startYear + 20;
      const dynamic = runDynamicEngine(bazi, startYear, endYear);
      return json(res, {
        chart: bazi,
        timeline: liuNian,
        dynamic,
      });
    } catch (e) {
      return json(res, { error: e.message }, 400);
    }
  }

  // 完整报告（需要API key）
  if (url === '/api/report' && req.method === 'POST') {
    if (!API_KEY) return json(res, { error: 'CLAUDE_API_KEY not set' }, 500);
    const body = await parseBody(req);
    try {
      const result = await orchestrate(body, API_KEY, { lang: body.lang || 'zh', enableReflection: false, verbose: false });
      return json(res, result);
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // 合盘（需要API key）
  if (url === '/api/hepan' && req.method === 'POST') {
    if (!API_KEY) return json(res, { error: 'CLAUDE_API_KEY not set' }, 500);
    const body = await parseBody(req);
    try {
      const { personA, personB, scenarioId, userContext } = body;
      const hePanResult = runHePanAgent(personA, personB);

      // 调Claude生成解读
      const { systemPrompt, userPrompt } = buildHePanWriterPrompt(hePanResult, scenarioId || 'is-this-right', userContext || '');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return json(res, {
        report: data.content[0].text,
        compatibility: hePanResult,
      });
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   八字AI引擎 API 已启动              ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('  地址: http://localhost:' + PORT);
  console.log('  API Key: ' + (API_KEY ? '已设置 ✅' : '未设置 ❌'));
  console.log('');
  console.log('  接口:');
  console.log('  POST /api/chart   → 排盘（免费，秒出）');
  console.log('  POST /api/report  → 完整报告（调AI）');
  console.log('  POST /api/hepan   → 合盘分析（调AI）');
  console.log('  GET  /api/health  → 健康检查');
  console.log('');
});
