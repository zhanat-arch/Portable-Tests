const points = { metric: 'points', max: 100000000 };
const moves = { metric: 'moves', minWins: true, max: 100000, numbered: true };
const wins = { metric: 'wins', max: 100000, difficulty: true };

export const snakeStartSpeeds = { slow: 1.3, normal: 1, fast: 0.8 };
const snakeModes = ['classic', 'wrap', 'turbo'].flatMap(mode =>
  Object.keys(snakeStartSpeeds).map(speed => speed === 'normal' ? mode : mode + '-' + speed));

export const arcadeRules = {
  'air-hockey': { ...wins, numbered: true, metric: 'lead' },
  'ant-flap': points,
  'ant-jump': { metric: 'metres', max: 1000000 },
  'balloon-pop': points,
  battleship: wins,
  'block-drop': points,
  bowling: { metric: 'points', max: 300 },
  breakout: points,
  'bubble-shooter': points,
  checkers: wins,
  'connect-four': wins,
  'cross-road': { ...points, metric: 'tiles' },
  'dino-run': points,
  'fruit-slice': points,
  'gem-match': points,
  gomoku: wins,
  hanoi: moves,
  helicopter: { ...points, metric: 'metres' },
  'helix-drop': points,
  'hoop-shot': points,
  'lights-out': moves,
  'mahjong-link': { metric: 'level', max: 1000 },
  mancala: wins,
  'maze-muncher': points,
  'memory-match': { ...moves, difficulty: true },
  'merge-drop': points,
  minesweeper: { metric: 'seconds', minWins: true, max: 86400, difficulty: true },
  'mini-golf': { metric: 'strokes', minWins: true, max: 10000 },
  nonogram: { metric: 'level', max: 1000 },
  'paddle-duel': { ...points, metric: 'hits', difficulty: true },
  'penalty-kick': { ...points, metric: 'goals' },
  'piano-tap': { ...points, metric: 'tiles' },
  'pipe-connect': moves,
  reversi: wins,
  'rush-hour': moves,
  'simon-says': { ...points, metric: 'steps' },
  'slide-puzzle': moves,
  slingshot: points,
  snake: { metric: 'points', max: 3970, unit: 10, modes: snakeModes },
  'snakes-ladders': { metric: 'rolls', minWins: true, max: 100000 },
  sokoban: { metric: 'level', max: 1000 },
  'stack-tower': { ...points, metric: 'blocks' },
  'star-defender': points,
  sudoku: { metric: 'seconds', scale: 10, minWins: true, max: 864000, difficulty: true },
  'tic-tac-toe': wins,
  'water-sort': moves,
  'whack-a-mole': { metric: 'points', max: 1500 }
};

export function validArcadeMode(rule, mode) {
  return typeof mode === 'string' && (rule.modes ? rule.modes.includes(mode) :
    mode === 'classic' || (rule.difficulty && /^(easy|medium|normal|hard|expert)$/.test(mode)) ||
    (rule.numbered && /^(level|size|difficulty)-(?:0|[1-9]\d{0,2})$/.test(mode)));
}
