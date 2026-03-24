/**
 * 格局分析验证
 * Carrie应该是：正官格·官星佩印
 * 宇航应该是：杂气正印格·印格用财
 */

const { runBaziAgent } = require('./src/agents/baziAgent');

console.log('========== 宇航 ==========');
console.log('预期：杂气正印格·印格用财\n');

const yuhang = runBaziAgent({
  year: 1991, month: 11, day: 7,
  hour: 4, minute: 8,
  birthCity: '大庆', gender: 'male',
});

console.log('四柱:', yuhang.fourPillars.year.ganZhi, yuhang.fourPillars.month.ganZhi, yuhang.fourPillars.day.ganZhi, yuhang.fourPillars.hour.ganZhi);
console.log('\n格局结果:');
console.log(yuhang.geJu.summary);
console.log('\n月令藏干分析:');
yuhang.geJu.monthCangAnalysis.forEach(s =>
  console.log(`  ${s.gan}(${s.shiShen}) — ${s.isBenQi ? '本气' : '中/余气'} — ${s.touGan ? '已透干' : '未透干'} — 占比${s.pct}%`)
);
console.log('\n全盘十神分布:');
Object.entries(yuhang.geJu.allShiShen).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${k}: ${v.toFixed(1)}`)
);
if (yuhang.geJu.warnings.length > 0) {
  console.log('\n警告:');
  yuhang.geJu.warnings.forEach(w => console.log(`  ⚠ ${w.name}(${w.severity}) — ${w.desc}`));
}

console.log('\n\n========== Carrie ==========');
console.log('预期：正官格·官星佩印\n');

const carrie = runBaziAgent({
  year: 2000, month: 3, day: 11,
  hour: 8, minute: 29,
  birthCity: '佛山', gender: 'female',
});

console.log('四柱:', carrie.fourPillars.year.ganZhi, carrie.fourPillars.month.ganZhi, carrie.fourPillars.day.ganZhi, carrie.fourPillars.hour.ganZhi);
console.log('\n格局结果:');
console.log(carrie.geJu.summary);
console.log('\n月令藏干分析:');
carrie.geJu.monthCangAnalysis.forEach(s =>
  console.log(`  ${s.gan}(${s.shiShen}) — ${s.isBenQi ? '本气' : '中/余气'} — ${s.touGan ? '已透干' : '未透干'} — 占比${s.pct}%`)
);
console.log('\n全盘十神分布:');
Object.entries(carrie.geJu.allShiShen).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${k}: ${v.toFixed(1)}`)
);
if (carrie.geJu.warnings.length > 0) {
  console.log('\n警告:');
  carrie.geJu.warnings.forEach(w => console.log(`  ⚠ ${w.name}(${w.severity}) — ${w.desc}`));
}
