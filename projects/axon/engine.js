// Browser-compatible JavaScript port of the generic-task engine in AXON.
// Source: https://github.com/yjr28/Axon/blob/ac0f313ed0cbf4a2a296eaabdfb7ac011c3ea508/packages/engine/src/index.ts
// Only TypeScript annotations and non-null assertions were removed.
export const limits = { maxN: 128, maxStreams: 64, maxTrials: 10000 };
export function seededRandom(seed) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const emptyStream = () => ({ correct: 0, total: 0, hits: 0, misses: 0, falsePositives: 0, correctRejections: 0, accuracy: 0, meanRtMs: 0 });
export function generateTask(config) {
  if (!Number.isInteger(config.trials) || config.trials < 1 || config.trials > limits.maxTrials || !Number.isInteger(config.level) || config.level < 1 || config.level > 100 || !['processing_speed', 'spatial_rotation', 'relational'].includes(config.family) || !Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff || !Number.isFinite(config.responseWindowMs) || config.responseWindowMs < 80) throw new Error('Invalid task config');
  const rng = seededRandom(config.seed), pick = (n) => Math.floor(rng() * n);
  return Array.from({ length: config.trials }, (_, index) => {
    if (config.family === 'processing_speed') {
      const length = Math.min(10, 3 + config.level), alphabet = '23456789ABCDEFGH', left = Array.from({ length }, () => alphabet[pick(alphabet.length)]).join('');
      const same = rng() < .5, position = pick(length), replacement = alphabet[(alphabet.indexOf(left[position]) + 1 + pick(alphabet.length - 1)) % alphabet.length];
      const right = same ? left : left.slice(0, position) + replacement + left.slice(position + 1);
      return { index, prompt: 'Are these sequences identical?', options: ['Different', 'Same'], answer: same ? 1 : 0, payload: { left, right } };
    }
    if (config.family === 'spatial_rotation') {
      const arrows = ['↑', '→', '↓', '←'], start = pick(4), turns = 1 + pick(Math.min(3, config.level + 1)), clockwise = rng() < .5;
      return { index, prompt: `Rotate ${arrows[start]} ${turns * 90}° ${clockwise ? 'clockwise' : 'counterclockwise'}.`, options: arrows, answer: (start + (clockwise ? turns : 4 - turns)) % 4, payload: { start, degrees: turns * 90, clockwise } };
    }
    const depth = Math.min(8, config.level + 2), names = 'ABCDEFGH'.slice(0, depth).split('');
    for (let i = names.length - 1; i > 0; i--) { const j = pick(i + 1); [names[i], names[j]] = [names[j], names[i]]; }
    const a = pick(depth), b = (a + 1 + pick(depth - 1)) % depth;
    const statements = names.slice(0, -1).map((name, i) => `${name} is above ${names[i + 1]}.`);
    return { index, prompt: `${statements.join(' ')} Is ${names[a]} above ${names[b]}?`, options: ['No', 'Yes'], answer: a < b ? 1 : 0, payload: { statements, left: names[a], right: names[b] } };
  });
}
export function scoreTask(config, responses) {
  const trials = generateTask(config), seen = new Set(), rts = [];
  const summary = { ...emptyStream(), total: trials.length, balancedAccuracy: 0, score: 0, medianRtMs: 0, lapseRate: 0, fatigueSlope: 0, streams: {}, invalidResponses: 0, responseCount: 0 };
  const correctness = trials.map(() => 0);
  for (const response of responses) {
    const trial = trials[response.trial];
    if (!trial || seen.has(response.trial) || !Number.isInteger(response.answer) || response.answer < 0 || response.answer >= trial.options.length || !Number.isFinite(response.rtMs) || response.rtMs < 80 || response.rtMs > config.responseWindowMs) { summary.invalidResponses++; continue; }
    seen.add(response.trial); rts.push(response.rtMs);
    if (response.answer === trial.answer) { summary.correct++; correctness[response.trial] = 1; }
  }
  summary.accuracy = summary.balancedAccuracy = summary.correct / summary.total; summary.hits = summary.correct; summary.misses = summary.total - summary.correct;
  summary.score = Math.round(summary.accuracy * 1000); summary.lapseRate = (summary.total - seen.size) / summary.total;
  summary.meanRtMs = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
  summary.responseCount = rts.length;
  rts.sort((a, b) => a - b); const mid = Math.floor(rts.length / 2);
  summary.medianRtMs = rts.length ? rts.length % 2 ? rts[mid] : (rts[mid - 1] + rts[mid]) / 2 : 0;
  const half = Math.floor(correctness.length / 2);
  if (half) summary.fatigueSlope = correctness.slice(half).reduce((a, b) => a + b, 0) / (correctness.length - half) - correctness.slice(0, half).reduce((a, b) => a + b, 0) / half;
  return summary;
}
