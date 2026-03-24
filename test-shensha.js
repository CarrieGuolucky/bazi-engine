/**
 * 神煞验证测试
 * 用宇航和Carrie的八字对比测测App结果
 */

const { runBaziAgent } = require('./src/agents/baziAgent');

console.log('========== 宇航 ==========');
console.log('八字：辛未 戊戌 辛巳 庚寅');
console.log('测测上的神煞：天乙贵人、福星贵人、天德合、月德合、太极贵人、国印、天喜\n');

const yuhang = runBaziAgent({
  year: 1991, month: 11, day: 7,
  hour: 4, minute: 8,  // 原始北京时间，baziAgent会自动修正真太阳时
  birthCity: '大庆', gender: 'male',
});

console.log('四柱:', yuhang.fourPillars.year.ganZhi, yuhang.fourPillars.month.ganZhi, yuhang.fourPillars.day.ganZhi, yuhang.fourPillars.hour.ganZhi);
console.log('\n神煞结果:');
console.log(yuhang.shenSha.summary);
console.log('\n吉神:');
yuhang.shenSha.吉神.forEach(s => console.log(`  ✓ ${s.name} (${s.position}) — ${s.description}`));
console.log('\n中性:');
yuhang.shenSha.中性.forEach(s => console.log(`  ○ ${s.name} (${s.position}) — ${s.description}`));
console.log('\n凶煞:');
yuhang.shenSha.凶煞.forEach(s => console.log(`  ✗ ${s.name} (${s.position}) — ${s.description}`));
console.log('\n空亡:', yuhang.shenSha.kongwang.join('、'));

console.log('\n\n========== Carrie ==========');
console.log('八字：庚辰 己卯 戊辰 丙辰\n');

const carrie = runBaziAgent({
  year: 2000, month: 3, day: 11,
  hour: 8, minute: 29,
  birthCity: '佛山', gender: 'female',
});

console.log('四柱:', carrie.fourPillars.year.ganZhi, carrie.fourPillars.month.ganZhi, carrie.fourPillars.day.ganZhi, carrie.fourPillars.hour.ganZhi);
console.log('\n神煞结果:');
console.log(carrie.shenSha.summary);
console.log('\n吉神:');
carrie.shenSha.吉神.forEach(s => console.log(`  ✓ ${s.name} (${s.position}) — ${s.description}`));
console.log('\n中性:');
carrie.shenSha.中性.forEach(s => console.log(`  ○ ${s.name} (${s.position}) — ${s.description}`));
console.log('\n凶煞:');
carrie.shenSha.凶煞.forEach(s => console.log(`  ✗ ${s.name} (${s.position}) — ${s.description}`));
console.log('\n空亡:', carrie.shenSha.kongwang.join('、'));