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
