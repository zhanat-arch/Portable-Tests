// Capture completed rounds at the game's own result boundary. The pinned source
// must contain each anchor exactly once so an upstream edit cannot silently drop a game.
const results = {
  'air-hockey': ["overKey = playerWon ? 'airHockey.youWin' : 'airHockey.youLose';", "'difficulty-' + diff", 'playerWon ? playerScore - aiScore : 0'],
  'ant-flap': ['function gameOver() {', "'classic'", 'score'],
  'ant-jump': ["document.getElementById('final-height').textContent = m;", "'classic'", 'm'],
  'balloon-pop': ['function endRound(key) {', "'classic'", 'score'],
  battleship: ['lastResult = { winner: w, mineLeft:', 'diff', 'stats[diff].w', 'before'],
  'block-drop': ['function gameOver() {', "'classic'", 'score'],
  bowling: ['function finish() {', "'classic'", 'score'],
  breakout: ['function gameOver() {', "'classic'", 'score'],
  'bubble-shooter': ['function die(key) {', "'classic'", 'score'],
  checkers: ['endStats = { p: p, c: c, record: record };', "'classic'", 'best'],
  'connect-four': ['    saveScores();\n    renderScore();\n    renderBoard();', 'mode', 's.you'],
  'cross-road': ['function die(reason) {', "'classic'", 'maxRow'],
  'dino-run': ['function die() {', "'classic'", 'score'],
  'fruit-slice': ['function die(reason) {', "'classic'", 'score'],
  'gem-match': ['function endGame(clear) {', "'classic'", 'score'],
  gomoku: ['endStats = { res: res, moves: history.length };', "'classic'", 'store.w'],
  hanoi: ['function solveLevel() {', "'size-' + n", 'moves'],
  helicopter: ['function crash() {', "'classic'", 'Math.floor(dist)'],
  'helix-drop': ["endKey = 'helixDrop.over';", "'classic'", 'score'],
  'hoop-shot': ['function finish() {', "'classic'", 'score'],
  'lights-out': ['function win() {', "'size-' + size", 'moves'],
  'mahjong-link': ["if (key === 'mahjongLink.overClear' || key === 'mahjongLink.overWin') {", "'classic'", 'level'],
  mancala: ["endKey = endStats.h > endStats.a ? 'mancala.overWin'", "'classic'", 'store.w', 'before'],
  'maze-muncher': ['function endGame(won) {', "'classic'", 'score'],
  'memory-match': ['function finish() {', 'mode', 'moves'],
  'merge-drop': ['function die(key) {', "'classic'", 'score'],
  minesweeper: ['function saveBest(wonNow) {', 'diff', 'wonNow ? seconds : null'],
  'mini-golf': ['function finishRound() {', "'classic'", 'total'],
  nonogram: ['function win() {', "'classic'", 'level'],
  'paddle-duel': ['function gameOver() {', 'diff', 'best'],
  'penalty-kick': ['function finish(kind) {', "'classic'", 'you'],
  'piano-tap': ['function die(reason) {', "'classic'", 'score'],
  'pipe-connect': ['function winLevel() {', "'level-' + level", 'moves'],
  reversi: ['lastResult = { b: c.B, w: c.W, winner: winner, record: rec };', 'mode', 'stats[mode].w'],
  'rush-hour': ['endStats = { level: level, moves: moves, par: par };', "'level-' + level", 'moves'],
  'simon-says': ['var reached = seq.length;', "'classic'", 'reached'],
  'slide-puzzle': ['function win() {', "'size-' + size", 'moves'],
  slingshot: ['endKey = \'slingshot.cleared\';', "'classic'", 'score'],
  'snakes-ladders': ['function finish(w) {', "'classic'", "w === 'p' ? turns : null"],
  sokoban: ['var allDone = clearedCount() === LEVELS.length;', "'classic'", 'clearedCount()'],
  'stack-tower': ['var score = level();', "'classic'", 'score'],
  'star-defender': ['function gameOver() {', "'classic'", 'score'],
  sudoku: ['endTime = elapsed;', 'diff', 'Math.round(endTime * 10)'],
  'tic-tac-toe': ['    saveScores();\n    renderScore();', 'mode', 'is2P() ? null : s.x'],
  'water-sort': ['function win() {', "'level-' + level", 'moves'],
  'whack-a-mole': ['function finish() {', "'classic'", 'score']
};

export function attachArcadeResult(id, html) {
  const [anchor, mode, value, position] = results[id] ?? [];
  const source = html.replaceAll('\r\n', '\n');
  if (!anchor || source.split(anchor).length !== 2) throw new Error('Missing or ambiguous result hook: ' + id);
  const call = `PHArcadeRoom.record('${id}', ${mode}, ${value});`;
  return source.replace(anchor, position === 'before' ? call + '\n    ' + anchor : anchor + '\n    ' + call);
}
