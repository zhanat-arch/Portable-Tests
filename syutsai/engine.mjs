export const FORMULA_VERSION = 'syutsai-date-core-v2+weekly-adapter-v1';

export const rootNumber = value => {
  let number = Math.abs(Number(value) || 0);
  while (number > 9) {
    number = String(number).split('').reduce((sum, digit) => sum + Number(digit), 0);
  }
  return number || 9;
};

export function parseBirth(birth) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birth));
  if (!match) throw new TypeError('Invalid birth date');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new TypeError('Invalid birth date');
  }
  return { year, month, day, date };
}

export function syutsaiCore(birth) {
  const parsed = parseBirth(birth);
  const rawDigits = String(birth).replace(/\D/g, '').split('').map(Number);
  const matrixDigits = rawDigits.filter(Boolean);
  const counts = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index + 1, 0]));
  matrixDigits.forEach(digit => { counts[digit] += 1; });
  const present = Object.entries(counts).filter(([, count]) => count > 0).map(([digit]) => Number(digit));
  const missing = Object.entries(counts).filter(([, count]) => count === 0).map(([digit]) => Number(digit));
  const dominant = Object.entries(counts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    .map(([digit, count]) => ({ digit: Number(digit), count }));
  return {
    consciousness: rootNumber(parsed.day),
    mission: rootNumber(rawDigits.reduce((sum, digit) => sum + digit, 0)),
    matrix: { counts, present, missing, dominant }
  };
}

export function isoWeek(date) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return {
    year: current.getUTCFullYear(),
    week: Math.ceil((((current - start) / 86400000) + 1) / 7)
  };
}

export const hash = value => {
  let result = 2166136261;
  for (const character of String(value)) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

export const seeded = (seed, id, count) => hash(`${seed}|${id}`) % count;

export function cycles(birth, now = new Date()) {
  const core = syutsaiCore(birth);
  const currentWeek = isoWeek(now);
  const yearDigits = String(currentWeek.year).split('').reduce((sum, digit) => sum + Number(digit), 0);
  const year = rootNumber(core.mission + yearDigits);
  const month = rootNumber(year + now.getUTCMonth() + 1);
  const week = rootNumber(month + currentWeek.week);
  return {
    base: core.mission,
    consciousness: core.consciousness,
    mission: core.mission,
    year,
    month,
    week,
    isoYear: currentWeek.year,
    isoWeek: currentWeek.week,
    formula: FORMULA_VERSION
  };
}

export function birthRhythm(birthTime) {
  if (!birthTime) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(String(birthTime));
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  const period = hour < 5 ? 'night' : hour < 11 ? 'morning' : hour < 17 ? 'day' : hour < 22 ? 'evening' : 'night';
  return { hour, minute, period };
}

export function zodiacSign(birth) {
  const { month, day } = parseBirth(birth);
  const edge = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  const signs = ['capricorn', 'aquarius', 'pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn'];
  return signs[month - 1 + Number(day >= edge[month - 1])];
}

export const normalize = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const WEEK_TAGS = {
  1: ['initiative', 'speed'], 2: ['cooperation', 'patience'], 3: ['communication', 'creative'],
  4: ['structure', 'focus'], 5: ['change', 'experiment'], 6: ['care', 'responsibility'],
  7: ['depth', 'analysis'], 8: ['ambition', 'money'], 9: ['completion', 'meaning']
};

const TRAIT_TAGS = {
  analytical: ['analysis', 'depth', 'focus'], technical: ['focus', 'structure', 'analysis'],
  creative: ['creative', 'experiment', 'change'], social: ['communication', 'cooperation', 'care'],
  enterprising: ['initiative', 'speed', 'ambition'], organizing: ['structure', 'responsibility', 'completion'],
  practical: ['focus', 'responsibility', 'completion'], flexibility: ['change', 'experiment', 'cooperation'],
  balance: ['patience', 'cooperation', 'meaning']
};

const FRICTION = {
  analytical: ['speed'], technical: ['change'], creative: ['structure'], social: ['depth'],
  enterprising: ['patience'], organizing: ['experiment'], practical: ['creative'], flexibility: ['focus']
};

export function buildForecast({ birth, birthTime = '', now = new Date(), traits = {} }) {
  const core = syutsaiCore(birth);
  const cycle = cycles(birth, now);
  const entries = Object.entries(traits)
    .map(([id, value]) => ({ id, value: normalize(value) }))
    .sort((a, b) => b.value - a.value);
  const hasTestProfile = entries.length > 0;
  const top = entries[0] || { id: 'balance', value: 50 };
  const second = entries[1] || { id: 'flexibility', value: 50 };
  const low = [...entries].sort((a, b) => a.value - b.value)[0] || { id: 'social', value: 50 };
  const tags = WEEK_TAGS[cycle.week];
  const aligned = (TRAIT_TAGS[top.id] || []).some(tag => tags.includes(tag));
  const friction = (FRICTION[top.id] || []).some(tag => tags.includes(tag));
  const relation = aligned ? 'boost' : friction && top.value >= 70 ? 'conflict' : friction ? 'compensation' : 'neutral';
  const seed = hash(`${birth}|${cycle.isoYear}-W${cycle.isoWeek}|${top.id}|${second.id}`);
  const relationShift = relation === 'boost' ? 1 : relation === 'conflict' ? -1 : 0;
  const score = domain => Math.max(3, Math.min(10, 6 + relationShift + seeded(seed, domain, 3) - 1));

  return {
    core,
    cycles: cycle,
    seed,
    rhythm: birthRhythm(birthTime),
    zodiac: zodiacSign(birth),
    profile: {
      top,
      second,
      low,
      signals: entries.slice(0, 5),
      hasTestProfile,
      depth: entries.length >= 5 ? 'deep' : entries.length >= 2 ? 'good' : 'basic'
    },
    week: {
      tags,
      relation,
      work: score('work'),
      money: score('money'),
      relations: score('relations'),
      decisions: score('decisions'),
      energy: score('energy')
    }
  };
}
