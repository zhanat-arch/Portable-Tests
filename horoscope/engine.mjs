export const SIGN_IDS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
export const BODY_IDS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
export const PERIOD_RANGES = {
  night: ['00:00', '03:00', '05:59'],
  morning: ['06:00', '09:00', '11:59'],
  day: ['12:00', '15:00', '17:59'],
  evening: ['18:00', '21:00', '23:59'],
  unknown: ['00:00', '12:00', '23:59']
};

export const normalizeDegrees = value => ((Number(value) % 360) + 360) % 360;
export const signedDegrees = value => ((Number(value) + 540) % 360) - 180;

export function signPosition(longitude) {
  const normalized = normalizeDegrees(longitude);
  const index = Math.floor(normalized / 30);
  return { id: SIGN_IDS[index], index, degree: normalized - index * 30, longitude: normalized };
}

export function wholeSignHouses(ascendantLongitude) {
  const first = signPosition(ascendantLongitude).index;
  return Array.from({ length: 12 }, (_, index) => ({
    house: index + 1,
    sign: SIGN_IDS[(first + index) % 12],
    signIndex: (first + index) % 12
  }));
}

function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

export function zonedLocalDate(dateText, timeText, timeZone) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText));
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(String(timeText));
  if (!dateMatch || !timeMatch) throw new TypeError('Invalid local date or time');
  const target = {
    year: Number(dateMatch[1]), month: Number(dateMatch[2]), day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]), minute: Number(timeMatch[2]), second: 0
  };
  if (target.month < 1 || target.month > 12 || target.hour > 23 || target.minute > 59) throw new TypeError('Invalid local date or time');
  const expected = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
  const checkDate = new Date(Date.UTC(target.year, target.month - 1, target.day));
  if (checkDate.getUTCFullYear() !== target.year || checkDate.getUTCMonth() !== target.month - 1 || checkDate.getUTCDate() !== target.day) throw new TypeError('Invalid local date');
  let timestamp = expected;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const shown = localParts(new Date(timestamp), timeZone);
    const represented = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second);
    const correction = expected - represented;
    timestamp += correction;
    if (correction === 0) break;
  }
  const result = new Date(timestamp);
  const shown = localParts(result, timeZone);
  const matched = ['year', 'month', 'day', 'hour', 'minute'].every(key => shown[key] === target[key]);
  return { date: result, matched, local: target, timeZone };
}

export function meanObliquity(date) {
  const julianDay = date.getTime() / 86400000 + 2440587.5;
  const centuries = (julianDay - 2451545) / 36525;
  return 23.439291111 - 0.013004167 * centuries - 1.63889e-7 * centuries ** 2 + 5.03611e-7 * centuries ** 3;
}

export function ascendantLongitude(date, latitude, longitude, siderealHours) {
  const radians = Math.PI / 180;
  const theta = normalizeDegrees(siderealHours * 15 + Number(longitude)) * radians;
  const phi = Number(latitude) * radians;
  const epsilon = meanObliquity(date) * radians;
  const lambda = Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)) / radians + 180;
  return normalizeDegrees(lambda);
}

export function midheavenLongitude(date, longitude, siderealHours) {
  const radians = Math.PI / 180;
  const theta = normalizeDegrees(siderealHours * 15 + Number(longitude)) * radians;
  const epsilon = meanObliquity(date) * radians;
  return normalizeDegrees(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(epsilon)) / radians);
}

const astronomyTime = date => (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;

function geocentricLongitude(Astronomy, body, date) {
  const vector = Astronomy.GeoVector(Astronomy.Body[body], astronomyTime(date), true);
  return normalizeDegrees(Astronomy.Ecliptic(vector).elon);
}

function bodyPosition(Astronomy, body, date) {
  const longitude = geocentricLongitude(Astronomy, body, date);
  const before = geocentricLongitude(Astronomy, body, new Date(date.getTime() - 12 * 60 * 60 * 1000));
  const after = geocentricLongitude(Astronomy, body, new Date(date.getTime() + 12 * 60 * 60 * 1000));
  return { body, ...signPosition(longitude), retrograde: signedDegrees(after - before) < 0 };
}

export function sampleChart(Astronomy, date, location, includeAngles = true) {
  if (!Astronomy?.GeoVector || !Astronomy?.Ecliptic || !Astronomy?.SiderealTime) throw new TypeError('Astronomy engine unavailable');
  const positions = BODY_IDS.map(body => bodyPosition(Astronomy, body, date));
  if (!includeAngles) return { date, positions, ascendant: null, midheaven: null, houses: null };
  const sidereal = Astronomy.SiderealTime(astronomyTime(date));
  const ascendant = signPosition(ascendantLongitude(date, location.latitude, location.longitude, sidereal));
  const midheaven = signPosition(midheavenLongitude(date, location.longitude, sidereal));
  const houses = wholeSignHouses(ascendant.longitude);
  return { date, positions, ascendant, midheaven, houses };
}

const ASPECTS = [
  { id: 'conjunction', angle: 0, orb: 8 },
  { id: 'sextile', angle: 60, orb: 4 },
  { id: 'square', angle: 90, orb: 6 },
  { id: 'trine', angle: 120, orb: 6 },
  { id: 'opposition', angle: 180, orb: 8 }
];

function aspectFor(first, second) {
  const distance = Math.abs(signedDegrees(first.longitude - second.longitude));
  const candidates = ASPECTS.map(aspect => ({ ...aspect, distance, difference: Math.abs(distance - aspect.angle) })).filter(aspect => aspect.difference <= aspect.orb);
  if (!candidates.length) return null;
  const aspect = candidates.sort((a, b) => a.difference - b.difference)[0];
  return { id: aspect.id, first: first.body, second: second.body, orb: aspect.difference };
}

export function chartAspects(positions) {
  const found = [];
  for (let first = 0; first < positions.length; first += 1) {
    for (let second = first + 1; second < positions.length; second += 1) {
      const aspect = aspectFor(positions[first], positions[second]);
      if (aspect) found.push(aspect);
    }
  }
  return found.sort((a, b) => a.orb - b.orb).slice(0, 8);
}

function unique(values) {
  return [...new Set(values)];
}

export function buildNatalChart(Astronomy, input) {
  const { birth, mode, exactTime = '', period = 'day', location } = input;
  if (!birth || !location?.timezone || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) throw new TypeError('Birth date and selected location are required');
  const timeTexts = mode === 'exact' ? [exactTime] : PERIOD_RANGES[mode === 'approx' ? period : 'unknown'];
  if (!timeTexts?.every(Boolean)) throw new TypeError('Birth time is required');
  const conversions = timeTexts.map(time => zonedLocalDate(birth, time, location.timezone));
  if (conversions.some(item => !item.matched)) throw new RangeError('Local time does not exist in selected time zone');
  const includeAngles = mode !== 'unknown';
  const samples = conversions.map(item => sampleChart(Astronomy, item.date, location, includeAngles));
  const middle = samples[Math.floor(samples.length / 2)];
  const positions = middle.positions.map(position => {
    const possibleSigns = unique(samples.map(sample => sample.positions.find(item => item.body === position.body).id));
    return { ...position, possibleSigns, stable: possibleSigns.length === 1 };
  });
  const possibleAscendants = includeAngles ? unique(samples.map(sample => sample.ascendant.id)) : [];
  const possibleMidheavens = includeAngles ? unique(samples.map(sample => sample.midheaven.id)) : [];
  const stableAspectKeys = samples.map(sample => new Set(chartAspects(sample.positions).map(item => `${item.first}|${item.second}|${item.id}`)));
  const aspects = chartAspects(middle.positions).filter(item => stableAspectKeys.every(keys => keys.has(`${item.first}|${item.second}|${item.id}`)));
  const housesReliable = mode === 'exact' || (mode === 'approx' && possibleAscendants.length === 1);
  const ascSign = possibleAscendants.length === 1 ? SIGN_IDS.indexOf(possibleAscendants[0]) : -1;
  positions.forEach(position => {
    position.house = housesReliable ? ((position.index - ascSign + 12) % 12) + 1 : null;
  });
  return {
    input: { birth, mode, exactTime, period, location },
    samples: samples.map(sample => sample.date.toISOString()),
    positions,
    aspects,
    ascendant: mode === 'exact' ? middle.ascendant : null,
    midheaven: mode === 'exact' ? middle.midheaven : null,
    possibleAscendants,
    possibleMidheavens,
    houses: housesReliable ? middle.houses : null,
    precision: mode === 'exact' ? 'exact' : mode === 'approx' ? 'range' : 'dateOnly'
  };
}
