(() => {
  // syutsai/engine.mjs
  var rootNumber = (value) => {
    let number = Math.abs(Number(value) || 0);
    while (number > 9) {
      number = String(number).split("").reduce((sum, digit) => sum + Number(digit), 0);
    }
    return number || 9;
  };
  function parseBirth(birth) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birth));
    if (!match) throw new TypeError("Invalid birth date");
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new TypeError("Invalid birth date");
    }
    return { year, month, day, date };
  }
  function syutsaiCore(birth) {
    const parsed = parseBirth(birth);
    const rawDigits = String(birth).replace(/\D/g, "").split("").map(Number);
    const matrixDigits = rawDigits.filter(Boolean);
    const counts = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index + 1, 0]));
    matrixDigits.forEach((digit) => {
      counts[digit] += 1;
    });
    const present = Object.entries(counts).filter(([, count]) => count > 0).map(([digit]) => Number(digit));
    const missing = Object.entries(counts).filter(([, count]) => count === 0).map(([digit]) => Number(digit));
    const dominant = Object.entries(counts).filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0])).map(([digit, count]) => ({ digit: Number(digit), count }));
    return {
      consciousness: rootNumber(parsed.day),
      mission: rootNumber(rawDigits.reduce((sum, digit) => sum + digit, 0)),
      matrix: { counts, present, missing, dominant }
    };
  }
  function zodiacSign(birth) {
    const { month, day } = parseBirth(birth);
    const edge = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
    const signs2 = ["capricorn", "aquarius", "pisces", "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn"];
    return signs2[month - 1 + Number(day >= edge[month - 1])];
  }

  // compatibility/engine.mjs?v=1116
  var ENGINE_VERSION = "compatibility-symbolic-v2";
  var categories = ["communication", "emotions", "daily", "attraction", "pace", "repair"];
  var signs = {
    aries: { element: "fire", modality: "cardinal", traits: { communication: 86, emotions: 61, daily: 46, attraction: 92, pace: 94, repair: 72 } },
    taurus: { element: "earth", modality: "fixed", traits: { communication: 58, emotions: 84, daily: 92, attraction: 78, pace: 42, repair: 66 } },
    gemini: { element: "air", modality: "mutable", traits: { communication: 96, emotions: 55, daily: 40, attraction: 82, pace: 82, repair: 81 } },
    cancer: { element: "water", modality: "cardinal", traits: { communication: 64, emotions: 96, daily: 80, attraction: 76, pace: 47, repair: 74 } },
    leo: { element: "fire", modality: "fixed", traits: { communication: 82, emotions: 78, daily: 57, attraction: 95, pace: 76, repair: 67 } },
    virgo: { element: "earth", modality: "mutable", traits: { communication: 70, emotions: 66, daily: 96, attraction: 57, pace: 59, repair: 83 } },
    libra: { element: "air", modality: "cardinal", traits: { communication: 94, emotions: 80, daily: 67, attraction: 86, pace: 62, repair: 88 } },
    scorpio: { element: "water", modality: "fixed", traits: { communication: 53, emotions: 97, daily: 69, attraction: 98, pace: 55, repair: 58 } },
    sagittarius: { element: "fire", modality: "mutable", traits: { communication: 81, emotions: 57, daily: 36, attraction: 88, pace: 95, repair: 79 } },
    capricorn: { element: "earth", modality: "cardinal", traits: { communication: 59, emotions: 67, daily: 97, attraction: 61, pace: 64, repair: 76 } },
    aquarius: { element: "air", modality: "fixed", traits: { communication: 89, emotions: 45, daily: 56, attraction: 74, pace: 73, repair: 70 } },
    pisces: { element: "water", modality: "mutable", traits: { communication: 66, emotions: 94, daily: 49, attraction: 83, pace: 44, repair: 77 } }
  };
  var numbers = {
    1: { traits: { communication: 78, emotions: 55, daily: 57, attraction: 88, pace: 92, repair: 64 } },
    2: { traits: { communication: 90, emotions: 94, daily: 76, attraction: 72, pace: 44, repair: 91 } },
    3: { traits: { communication: 96, emotions: 73, daily: 43, attraction: 86, pace: 77, repair: 82 } },
    4: { traits: { communication: 58, emotions: 68, daily: 98, attraction: 55, pace: 49, repair: 74 } },
    5: { traits: { communication: 85, emotions: 50, daily: 33, attraction: 94, pace: 97, repair: 70 } },
    6: { traits: { communication: 82, emotions: 96, daily: 90, attraction: 80, pace: 54, repair: 88 } },
    7: { traits: { communication: 46, emotions: 61, daily: 71, attraction: 64, pace: 41, repair: 62 } },
    8: { traits: { communication: 69, emotions: 58, daily: 92, attraction: 77, pace: 84, repair: 68 } },
    9: { traits: { communication: 88, emotions: 90, daily: 54, attraction: 82, pace: 59, repair: 86 } }
  };
  var elementBase = {
    fire: { fire: 76, earth: 60, air: 86, water: 55 },
    earth: { fire: 60, earth: 81, air: 58, water: 85 },
    air: { fire: 86, earth: 58, air: 79, water: 65 },
    water: { fire: 55, earth: 85, air: 65, water: 82 }
  };
  var modalityBase = { same: 68, different: 78 };
  var categoryWeights = { communication: 0.18, emotions: 0.18, daily: 0.15, attraction: 0.18, pace: 0.13, repair: 0.18 };
  var clamp = (value) => Math.max(28, Math.min(97, Math.round(value)));
  var similarity = (a, b) => 100 - Math.abs(a - b);
  var pairCode = (a, b) => [String(a), String(b)].sort().join("_");
  function scoreBand(score) {
    if (score < 45) return "fragile";
    if (score < 56) return "contrast";
    if (score < 67) return "sparks";
    if (score < 76) return "workable";
    if (score < 85) return "strong";
    if (score < 92) return "close";
    return "rare";
  }
  function stableHash(value) {
    let hash = 2166136261;
    for (const char of String(value)) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function weightedOverall(scores) {
    return clamp(categories.reduce((sum, key) => sum + scores[key] * categoryWeights[key], 0));
  }
  function traitScores(left, right, base = 70, modality = 72) {
    return Object.fromEntries(categories.map((category) => {
      const same = similarity(left.traits[category], right.traits[category]);
      let score = same * 0.64 + base * 0.36;
      if (category === "attraction") score = same * 0.42 + base * 0.58 + 4;
      if (category === "emotions") score = same * 0.58 + base * 0.42;
      if (category === "daily" || category === "pace") score = same * 0.72 + base * 0.28;
      if (category === "repair") score = same * 0.52 + base * 0.23 + modality * 0.25;
      return [category, clamp(score)];
    }));
  }
  function rankedContext(scores) {
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { strongest: ranked[0][0], attention: ranked.at(-1)[0], ranked };
  }
  function zodiacCompatibility(leftId, rightId) {
    const left = signs[leftId], right = signs[rightId];
    if (!left || !right) throw new TypeError("Unknown zodiac sign");
    const element = elementBase[left.element][right.element];
    const modality = left.modality === right.modality ? modalityBase.same : modalityBase.different;
    const base = element * 0.72 + modality * 0.28;
    const scores = traitScores(left, right, base, modality);
    const context = rankedContext(scores);
    return { overall: weightedOverall(scores), scores, elements: [left.element, right.element], elementPair: pairCode(left.element, right.element), modalities: [left.modality, right.modality], ...context };
  }
  function numberCompatibility(leftNumber, rightNumber) {
    const left = numbers[leftNumber], right = numbers[rightNumber];
    if (!left || !right) throw new TypeError("Unknown number");
    const numericDistance = Math.abs(Number(leftNumber) - Number(rightNumber));
    const complementBase = 76 - Math.min(numericDistance, 5) * 1.5;
    const scores = traitScores(left, right, complementBase, 74);
    const context = rankedContext(scores);
    return { overall: weightedOverall(scores), scores, numbers: [Number(leftNumber), Number(rightNumber)], numberPair: pairCode(leftNumber, rightNumber), ...context };
  }
  function personFromBirth(birth) {
    const core = syutsaiCore(birth);
    return { sign: zodiacSign(birth), consciousness: core.consciousness, mission: core.mission };
  }
  function personCode(person) {
    return `${person.sign}:${person.consciousness}:${person.mission}`;
  }
  function narrativeContext(people, scores, zodiac, consciousness, mission) {
    const signature = people.map(personCode).sort().join("|");
    const seed = stableHash(signature);
    const ranked = rankedContext(scores);
    return {
      signature,
      seed,
      band: scoreBand(weightedOverall(scores)),
      elementPair: zodiac.elementPair,
      consciousnessPair: consciousness.numberPair,
      missionPair: mission.numberPair,
      strongest: ranked.strongest,
      attention: ranked.attention,
      variants: { headline: seed % 12, analysis: Math.floor(seed / 13) % 12, advice: Math.floor(seed / 157) % 10, share: Math.floor(seed / 1571) % 8 }
    };
  }
  function pairCompatibility(first, second) {
    const a = typeof first === "string" ? personFromBirth(first) : first;
    const b = typeof second === "string" ? personFromBirth(second) : second;
    const zodiac = zodiacCompatibility(a.sign, b.sign);
    const consciousness = numberCompatibility(a.consciousness, b.consciousness);
    const mission = numberCompatibility(a.mission, b.mission);
    const numberScores = Object.fromEntries(categories.map((key) => [key, clamp(consciousness.scores[key] * 0.72 + mission.scores[key] * 0.28)]));
    const numberOverall = weightedOverall(numberScores);
    const scores = Object.fromEntries(categories.map((key) => [key, clamp(zodiac.scores[key] * 0.52 + numberScores[key] * 0.48)]));
    const overall = weightedOverall(scores);
    const context = narrativeContext([a, b], scores, zodiac, consciousness, mission);
    context.band = scoreBand(overall);
    return { version: ENGINE_VERSION, people: [a, b], overall, scores, zodiac, syutsai: { overall: numberOverall, scores: numberScores, consciousness, mission }, strongest: context.strongest, attention: context.attention, context };
  }
  function soloCompatibility(birth) {
    const person = typeof birth === "string" ? personFromBirth(birth) : birth;
    const signRanking = Object.keys(signs).map((sign) => {
      const match = zodiacCompatibility(person.sign, sign);
      return { id: sign, value: match.overall, strongest: match.strongest, attention: match.attention, elementPair: match.elementPair };
    }).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
    const numberRanking = Object.keys(numbers).map((number) => {
      const match = numberCompatibility(person.consciousness, Number(number));
      return { id: Number(number), value: match.overall, strongest: match.strongest, attention: match.attention, numberPair: match.numberPair };
    }).sort((a, b) => b.value - a.value || a.id - b.id);
    return { version: ENGINE_VERSION, person, signRanking, numberRanking };
  }

  // compatibility/narratives.mjs?v=1116
  var COPY = {
    ru: {
      ui: { normal: "\u{1F607} \u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E", humor: "\u{1F3AD} \u0421 \u044E\u043C\u043E\u0440\u043E\u043C", toneLabel: "\u041A\u0430\u043A \u0440\u0430\u0441\u0441\u043A\u0430\u0437\u0430\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442", locked: "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u0432\u0435\u0440\u0434\u0438\u043A\u0442 \u0433\u043E\u0442\u043E\u0432", unlock: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432\u0435\u0440\u0434\u0438\u043A\u0442", unlocked: "\u0412\u0435\u0440\u0434\u0438\u043A\u0442 \u043E\u0442\u043A\u0440\u044B\u0442", strength: "\u0427\u0442\u043E \u0432\u0430\u0441 \u0441\u0431\u043B\u0438\u0436\u0430\u0435\u0442", friction: "\u0413\u0434\u0435 \u043C\u043E\u0436\u0435\u0442 \u0438\u0441\u043A\u0440\u0438\u0442\u044C", advice: "\u0427\u0442\u043E \u0440\u0435\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u043C\u043E\u0436\u0435\u0442", details: "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430 \u0441\u0444\u0435\u0440\u0443 \u2014 \u043F\u043E\u043A\u0430\u0436\u0435\u043C, \u043E\u0442\u043A\u0443\u0434\u0430 \u0432\u0437\u044F\u043B\u0430\u0441\u044C \u043E\u0446\u0435\u043D\u043A\u0430", why: "\u041F\u043E\u0447\u0435\u043C\u0443 \u0442\u0430\u043A", sharePair: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043D\u0430\u0448\u0438\u043C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u043C", shareSafe: "\u0412 \u0441\u0441\u044B\u043B\u043A\u0435 \u0431\u0443\u0434\u0443\u0442 \u0438\u043C\u0435\u043D\u0430 \u0438 \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u0430\u0440\u044B. \u0414\u0430\u0442\u044B \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u044E\u0442\u0441\u044F.", shareSafeSolo: "\u0412 \u0441\u0441\u044B\u043B\u043A\u0435 \u0431\u0443\u0434\u0443\u0442 \u0438\u043C\u044F, \u0437\u043D\u0430\u043A \u0438 \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u0440\u0435\u0439\u0442\u0438\u043D\u0433. \u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u0441\u044F.", rankOpen: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u044F\u0441\u043D\u0435\u043D\u0438\u0435", rankWhy: "\u041F\u043E\u0447\u0435\u043C\u0443 \u043F\u043E\u0434\u0445\u043E\u0434\u0438\u0442", rankRisk: "\u0413\u0434\u0435 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u0430 \u0441\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u044C", rankTip: "\u0427\u0442\u043E \u043F\u043E\u043C\u043E\u0436\u0435\u0442" },
      bands: {
        fragile: { normal: ["\u041E\u0447\u0435\u043D\u044C \u0440\u0430\u0437\u043D\u044B\u0435 \u0441\u043F\u043E\u0441\u043E\u0431\u044B \u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0431\u043B\u0438\u0437\u043E\u0441\u0442\u044C", "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043D\u0443\u0436\u043D\u044B \u044F\u0441\u043D\u044B\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0451\u043D\u043D\u043E\u0441\u0442\u0438"], humor: ["\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F \u043A \u044D\u0442\u043E\u043C\u0443 \u0441\u043E\u044E\u0437\u0443 \u0442\u043E\u043B\u0449\u0435, \u0447\u0435\u043C \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0438\u043F\u043E\u0442\u0435\u043A\u0438", "\u041F\u0440\u0438\u0442\u044F\u0436\u0435\u043D\u0438\u0435 \u0435\u0441\u0442\u044C, \u0430 \u0437\u0430\u0432\u043E\u0434\u0441\u043A\u0438\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u044F\u0432\u043D\u043E \u0438\u0437 \u0440\u0430\u0437\u043D\u044B\u0445 \u043A\u043E\u0440\u043E\u0431\u043E\u043A"] },
        contrast: { normal: ["\u0420\u0430\u0437\u043B\u0438\u0447\u0438\u044F \u0437\u0430\u043C\u0435\u0442\u043D\u044B, \u043D\u043E \u0438\u043C\u0438 \u043C\u043E\u0436\u043D\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C", "\u0421\u043E\u044E\u0437 \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442\u043E\u0432 \u0441 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u0438\u043C\u0438 \u0432\u0430\u0436\u043D\u044B\u043C\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438"], humor: ["\u0412\u043C\u0435\u0441\u0442\u0435 \u043C\u043E\u0436\u043D\u043E, \u043D\u043E \u0442\u0435\u0445\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\u043C \u043F\u043E\u043D\u0430\u0434\u043E\u0431\u0438\u0442\u0441\u044F", "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u044C \u0432 \u0440\u0435\u0436\u0438\u043C\u0435: \xAB\u0430 \u0434\u0430\u0432\u0430\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437 \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E \u043E\u0431\u044A\u044F\u0441\u043D\u0438\u043C\xBB"] },
        sparks: { normal: ["\u041A\u043E\u043D\u0442\u0430\u043A\u0442 \u0435\u0441\u0442\u044C, \u0430 \u0440\u0438\u0442\u043C \u0435\u0449\u0451 \u043F\u0440\u0435\u0434\u0441\u0442\u043E\u0438\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C", "\u0416\u0438\u0432\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u0441 \u0437\u0430\u043C\u0435\u0442\u043D\u044B\u043C\u0438 \u0442\u043E\u0447\u043A\u0430\u043C\u0438 \u0440\u043E\u0441\u0442\u0430"], humor: ["\u0418\u0441\u043A\u0440\u044B \u043B\u0435\u0442\u044F\u0442 \u2014 \u0438\u043D\u043E\u0433\u0434\u0430 \u043E\u0442 \u0445\u0438\u043C\u0438\u0438, \u0438\u043D\u043E\u0433\u0434\u0430 \u043E\u0442 \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0433\u043E \u0437\u0430\u043C\u044B\u043A\u0430\u043D\u0438\u044F", "\u0412\u0437\u0430\u0438\u043C\u043D\u044B\u0439 \u0438\u043D\u0442\u0435\u0440\u0435\u0441 \u0435\u0441\u0442\u044C. \u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F \u043F\u043E \u044D\u043A\u0441\u043F\u043B\u0443\u0430\u0442\u0430\u0446\u0438\u0438 \u043F\u043E\u0442\u0435\u0440\u044F\u043B\u0430\u0441\u044C"] },
        workable: { normal: ["\u0425\u043E\u0440\u043E\u0448\u0430\u044F \u043E\u0441\u043D\u043E\u0432\u0430, \u0435\u0441\u043B\u0438 \u043D\u0435 \u0437\u0430\u043C\u0430\u043B\u0447\u0438\u0432\u0430\u0442\u044C \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u044F", "\u0423\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u0441 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E\u043C \u0434\u043B\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438"], humor: ["\u041D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E \u0441\u043A\u043B\u0435\u0438\u043B\u0438\u0441\u044C \u2014 \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0442\u044C \u0448\u043E\u0432 \u0431\u044B\u0442\u043E\u0432\u0443\u0445\u043E\u0439 \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C", "\u0421\u043E\u044E\u0437 \u0440\u0430\u0431\u043E\u0447\u0438\u0439: \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F, \u043C\u0435\u043B\u043A\u0438\u0435 \u0431\u0430\u0433\u0438 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B"] },
        strong: { normal: ["\u0421\u0438\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u0441 \u0445\u043E\u0440\u043E\u0448\u0438\u043C \u0437\u0430\u043F\u0430\u0441\u043E\u043C \u0432\u0437\u0430\u0438\u043C\u043E\u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u044F", "\u041C\u043D\u043E\u0433\u043E \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u0442\u043E\u0447\u0435\u043A \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u044F"], humor: ["\u0414\u0432\u0430 \u0441\u0430\u043F\u043E\u0433\u0430 \u043F\u0430\u0440\u0430, \u0438 \u043E\u0431\u0430 \u0437\u043D\u0430\u044E\u0442, \u0433\u0434\u0435 \u043B\u0435\u0436\u0438\u0442 \u0432\u0442\u043E\u0440\u043E\u0439 \u043D\u043E\u0441\u043E\u043A", "\u041E\u0434\u0438\u043D \u043F\u0440\u0438\u0434\u0443\u043C\u0430\u043B \u0441\u0442\u0440\u0430\u043D\u043D\u0443\u044E \u0438\u0434\u0435\u044E \u2014 \u0432\u0442\u043E\u0440\u043E\u0439 \u0443\u0436\u0435 \u0434\u043E\u0431\u0430\u0432\u0438\u043B \u0435\u0451 \u0432 \u043A\u043E\u0440\u0437\u0438\u043D\u0443"] },
        close: { normal: ["\u041E\u0447\u0435\u043D\u044C \u0431\u043B\u0438\u0437\u043A\u0438\u0439 \u0440\u0438\u0442\u043C \u0438 \u0437\u0430\u043C\u0435\u0442\u043D\u0430\u044F \u0432\u0437\u0430\u0438\u043C\u043D\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430", "\u0420\u0435\u0434\u043A\u043E \u0443\u0434\u043E\u0431\u043D\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u043E\u0432"], humor: ["\u0412\u044B\u043F\u0438\u043D\u044B\u0432\u0430\u0442\u044C \u0431\u0443\u0434\u0435\u0448\u044C \u2014 \u0434\u0430\u043B\u0435\u043A\u043E \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u043D\u0435 \u0443\u0439\u0434\u0451\u0442", "\u041C\u043E\u0436\u0435\u0442\u0435 \u043C\u043E\u043B\u0447\u0430 \u0437\u0430\u043B\u0438\u043F\u0430\u0442\u044C \u0432 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u044B \u0438 \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u044D\u0442\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u043C \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0435\u043C"] },
        rare: { normal: ["\u041D\u0435\u043E\u0431\u044B\u0447\u043D\u043E \u0446\u0435\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u043F\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u043C \u0441\u0438\u0441\u0442\u0435\u043C\u0430\u043C", "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u0431\u043B\u0438\u0437\u043A\u0438\u0439 \u0441\u0438\u043C\u0432\u043E\u043B\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0438\u0442\u043C"], humor: ["\u0421\u043B\u0438\u043F\u043B\u0438\u0441\u044C \u043D\u0430 \u0443\u0440\u043E\u0432\u043D\u0435 \u043A\u043E\u0441\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E Wi\u2011Fi", "\u041F\u043E\u0434\u043E\u0437\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0445\u043E\u0440\u043E\u0448\u043E \u0441\u043E\u0432\u043F\u0430\u043B\u0438. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435, \u043D\u0435 \u0447\u0438\u0442\u0430\u0435\u0442\u0435 \u043B\u0438 \u043C\u044B\u0441\u043B\u0438 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430"] }
      },
      elements: {
        air_air: ["\u041E\u0431\u0430 \u0446\u0435\u043D\u0438\u0442\u0435 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440, \u0441\u0432\u043E\u0431\u043E\u0434\u0443 \u043C\u044B\u0441\u043B\u0438 \u0438 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0438\u0434\u0435\u0439.", "\u0414\u0432\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440\u0430 \u0438\u0434\u0435\u0439: \u0432\u043A\u043B\u0430\u0434\u043E\u043A \u043C\u043D\u043E\u0433\u043E, \u0441\u043A\u0443\u043A\u0438 \u043C\u0430\u043B\u043E."],
        air_fire: ["\u041E\u0433\u043E\u043D\u044C \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435, \u0432\u043E\u0437\u0434\u0443\u0445 \u043F\u043E\u0434\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0435\u0442 \u0438\u0434\u0435\u0438 \u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0430\u0437\u0430\u0440\u0442.", "\u041E\u0434\u0438\u043D \u0437\u0430\u0436\u0438\u0433\u0430\u0435\u0442, \u0432\u0442\u043E\u0440\u043E\u0439 \u0440\u0430\u0437\u0434\u0443\u0432\u0430\u0435\u0442 \u2014 \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u043D\u0435 \u0441\u043F\u0430\u043B\u0438\u0442\u044C \u043E\u0431\u0449\u0438\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C."],
        air_earth: ["\u041E\u0434\u0438\u043D \u0441\u043B\u043E\u0439 \u0438\u0449\u0435\u0442 \u0441\u0432\u043E\u0431\u043E\u0434\u0443 \u0438 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B, \u0434\u0440\u0443\u0433\u043E\u0439 \u2014 \u043D\u0430\u0434\u0451\u0436\u043D\u043E\u0441\u0442\u044C \u0438 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u0438\u043A\u0443.", "\u041E\u0434\u0438\u043D \u0441\u0442\u0440\u043E\u0438\u0442 \u0432\u043E\u0437\u0434\u0443\u0448\u043D\u044B\u0439 \u0437\u0430\u043C\u043E\u043A, \u0432\u0442\u043E\u0440\u043E\u0439 \u0443\u0436\u0435 \u0441\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442 \u0441\u043C\u0435\u0442\u0443 \u0438 \u0441\u0440\u043E\u043A\u0438."],
        air_water: ["\u0420\u0430\u0437\u0443\u043C \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0430 \u0433\u043E\u0432\u043E\u0440\u044F\u0442 \u043D\u0430 \u0440\u0430\u0437\u043D\u044B\u0445 \u0434\u0438\u0430\u043B\u0435\u043A\u0442\u0430\u0445, \u0437\u0430\u0442\u043E \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u044B \u043C\u043D\u043E\u0433\u043E\u043C\u0443 \u043D\u0430\u0443\u0447\u0438\u0442\u044C \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430.", "\u041E\u0434\u0438\u043D \u043E\u0431\u044A\u044F\u0441\u043D\u044F\u0435\u0442 \u043B\u043E\u0433\u0438\u043A\u043E\u0439, \u0432\u0442\u043E\u0440\u043E\u0439 \u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442 \u043F\u0430\u0443\u0437\u0443 \u043C\u0435\u0436\u0434\u0443 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F\u043C\u0438."],
        fire_fire: ["\u0422\u0435\u043C\u043F \u0432\u044B\u0441\u043E\u043A\u0438\u0439, \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0430 \u0432\u0437\u0430\u0438\u043C\u043D\u0430\u044F, \u0430 \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0446\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u0431\u044B\u0441\u0442\u0440\u043E.", "\u0414\u0432\u0430 \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043B\u044F, \u043E\u0434\u0438\u043D \u0440\u0443\u043B\u044C \u0438 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044F \u0435\u0445\u0430\u0442\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E."],
        earth_fire: ["\u0418\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0430 \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u0442\u0441\u044F \u0441 \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u043D\u043E\u0441\u0442\u044C\u044E: \u0445\u043E\u0440\u043E\u0448\u0438\u0439 \u0441\u043E\u044E\u0437, \u0435\u0441\u043B\u0438 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0441\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u043D\u0430.", "\u041E\u0434\u0438\u043D \u0443\u0436\u0435 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0430\u043B, \u0432\u0442\u043E\u0440\u043E\u0439 \u0435\u0449\u0451 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u044E \u0438 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B."],
        fire_water: ["\u041F\u0440\u044F\u043C\u043E\u0442\u0430 \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0441\u043E\u0437\u0434\u0430\u044E\u0442 \u0441\u0438\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0438\u0442\u044F\u0436\u0435\u043D\u0438\u0435, \u043D\u043E \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0431\u0435\u0440\u0435\u0436\u043D\u043E\u0439 \u043F\u043E\u0434\u0430\u0447\u0438.", "\u041E\u0434\u0438\u043D \u0441\u043A\u0430\u0437\u0430\u043B \u043A\u0430\u043A \u0435\u0441\u0442\u044C, \u0432\u0442\u043E\u0440\u043E\u0439 \u0443\u0441\u043B\u044B\u0448\u0430\u043B \u0435\u0449\u0451 \u0442\u0440\u0438 \u0441\u043A\u0440\u044B\u0442\u044B\u0445 \u0441\u043C\u044B\u0441\u043B\u0430."],
        earth_earth: ["\u0412\u0430\u0436\u043D\u044B \u043D\u0430\u0434\u0451\u0436\u043D\u043E\u0441\u0442\u044C, \u043F\u043E\u043D\u044F\u0442\u043D\u044B\u0435 \u043F\u043B\u0430\u043D\u044B \u0438 \u043F\u043E\u0441\u0442\u0443\u043F\u043A\u0438 \u0432\u043C\u0435\u0441\u0442\u043E \u043E\u0431\u0435\u0449\u0430\u043D\u0438\u0439.", "\u0420\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0430 \u043F\u043E \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044E \u0442\u043E\u0436\u0435 \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0430, \u043E\u0441\u043E\u0431\u0435\u043D\u043D\u043E \u0435\u0441\u043B\u0438 \u0441\u0442\u043E\u043B\u0438\u043A \u0437\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D \u0437\u0430\u0440\u0430\u043D\u0435\u0435."],
        earth_water: ["\u041F\u0440\u0430\u043A\u0442\u0438\u0447\u043D\u043E\u0441\u0442\u044C \u0434\u0430\u0451\u0442 \u043E\u043F\u043E\u0440\u0443 \u044D\u043C\u043E\u0446\u0438\u044F\u043C, \u0430 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\u043C \u0433\u043B\u0443\u0431\u0438\u043D\u0443.", "\u041E\u0434\u0438\u043D \u043F\u0440\u0438\u043D\u043E\u0441\u0438\u0442 \u043F\u043B\u0435\u0434, \u0432\u0442\u043E\u0440\u043E\u0439 \u043E\u0431\u044A\u044F\u0441\u043D\u044F\u0435\u0442, \u043F\u043E\u0447\u0435\u043C\u0443 \u044D\u0442\u043E\u0442 \u043F\u043B\u0435\u0434 \u0441\u0435\u0439\u0447\u0430\u0441 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u043E \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C."],
        water_water: ["\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0432\u044B\u0441\u043E\u043A\u0430\u044F, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 \u0431\u044B\u0441\u0442\u0440\u043E \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043E\u0431\u0449\u0438\u043C.", "\u041E\u0434\u0438\u043D \u0432\u0437\u0434\u043E\u0445\u043D\u0443\u043B \u2014 \u0432\u0442\u043E\u0440\u043E\u0439 \u0443\u0436\u0435 \u043F\u043E\u043D\u044F\u043B \u0441\u044E\u0436\u0435\u0442, \u043F\u0440\u0438\u0447\u0438\u043D\u0443 \u0438 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u044B\u0439 \u0444\u0438\u043D\u0430\u043B."]
      },
      numberRelations: { same: ["\u041F\u043E\u0445\u043E\u0436\u0438\u0435 \u0447\u0438\u0441\u043B\u0430 \u0441\u043E\u0437\u043D\u0430\u043D\u0438\u044F \u0434\u0430\u044E\u0442 \u0443\u0437\u043D\u0430\u0432\u0430\u0435\u043C\u044B\u0439 \u0441\u043F\u043E\u0441\u043E\u0431 \u0440\u0435\u0430\u0433\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C \u0440\u0435\u0448\u0435\u043D\u0438\u044F.", "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u043E\u0445\u043E\u0436\u0438: \u0438\u043D\u043E\u0433\u0434\u0430 \u043F\u043E\u043D\u0438\u043C\u0430\u0435\u0442\u0435 \u0431\u0435\u0437 \u0441\u043B\u043E\u0432, \u0438\u043D\u043E\u0433\u0434\u0430 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u043E \u0443\u043F\u0440\u044F\u043C\u0438\u0442\u0435\u0441\u044C."], near: ["\u0427\u0438\u0441\u043B\u043E\u0432\u044B\u0435 \u0440\u043E\u043B\u0438 \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0431\u043B\u0438\u0437\u043A\u0438, \u0447\u0442\u043E\u0431\u044B \u0431\u044B\u0441\u0442\u0440\u043E \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C \u043E\u0431\u0449\u0438\u0439 \u0441\u043F\u043E\u0441\u043E\u0431 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F.", "\u041C\u0435\u0445\u0430\u043D\u0438\u043A\u0430 \u043F\u043E\u0445\u043E\u0436\u0430\u044F, \u043D\u043E \u043A\u043D\u043E\u043F\u043A\u0438 \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u044B \u0447\u0443\u0442\u044C \u043F\u043E-\u0440\u0430\u0437\u043D\u043E\u043C\u0443."], mixed: ["\u0427\u0438\u0441\u043B\u0430 \u0434\u0430\u044E\u0442 \u0440\u0430\u0437\u043D\u044B\u0435, \u043D\u043E \u0432\u0437\u0430\u0438\u043C\u043E\u0434\u043E\u043F\u043E\u043B\u043D\u044F\u044E\u0449\u0438\u0435 \u0440\u043E\u043B\u0438 \u0432 \u043F\u0430\u0440\u0435.", "\u041E\u0434\u0438\u043D \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043A\u0432\u0435\u0441\u0442, \u0432\u0442\u043E\u0440\u043E\u0439 \u0432\u043D\u0435\u0437\u0430\u043F\u043D\u043E \u0437\u043D\u0430\u0435\u0442, \u0433\u0434\u0435 \u043B\u0435\u0436\u0438\u0442 \u043D\u0443\u0436\u043D\u044B\u0439 \u043A\u043B\u044E\u0447."], contrast: ["\u0427\u0438\u0441\u043B\u043E\u0432\u044B\u0435 \u0440\u043E\u043B\u0438 \u0437\u0430\u043C\u0435\u0442\u043D\u043E \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u044E\u0442\u0441\u044F; \u043E\u0441\u043E\u0431\u0435\u043D\u043D\u043E \u0432\u0430\u0436\u043D\u044B \u044F\u0441\u043D\u044B\u0435 \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F.", "\u0423 \u043E\u0434\u043D\u043E\u0433\u043E \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F \u043D\u0430 \u043E\u0434\u043D\u0443 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443, \u0443 \u0432\u0442\u043E\u0440\u043E\u0433\u043E \u2014 \u0440\u0435\u0436\u0438\u0441\u0441\u0451\u0440\u0441\u043A\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u043D\u0430 \u0442\u0440\u0438 \u0447\u0430\u0441\u0430."] },
      strong: { communication: ["\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u043B\u0435\u0433\u0447\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0432\u0430\u0441 \u043D\u0430 \u043E\u0434\u043D\u0443 \u0441\u0442\u043E\u0440\u043E\u043D\u0443.", "\u041C\u043E\u0436\u0435\u0442\u0435 \u043D\u0430\u0447\u0430\u0442\u044C \u0441\u043E \u0441\u043F\u043E\u0440\u0430, \u0430 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u0442\u044C \u043E\u0431\u0449\u0435\u0439 \u0448\u0443\u0442\u043A\u043E\u0439 \u0438 \u0437\u0430\u043A\u0430\u0437\u043E\u043C \u0435\u0434\u044B."], emotions: ["\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443 \u043F\u0440\u043E\u0449\u0435 \u0437\u0430\u043C\u0435\u0447\u0430\u0442\u044C \u0438 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C \u0431\u0435\u0437 \u0434\u043B\u0438\u043D\u043D\u044B\u0445 \u043E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0439.", "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 Wi\u2011Fi \u043B\u043E\u0432\u0438\u0442 \u0434\u0430\u0436\u0435 \u0447\u0435\u0440\u0435\u0437 \u0441\u0442\u0435\u043D\u0443 \u0438 \u0440\u0435\u0436\u0438\u043C \xAB\u044F \u0432 \u043F\u043E\u0440\u044F\u0434\u043A\u0435\xBB."], daily: ["\u0411\u044B\u0442\u043E\u0432\u044B\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0451\u043D\u043D\u043E\u0441\u0442\u0438 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0431\u0435\u0437 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044F.", "\u0415\u0441\u0442\u044C \u0448\u0430\u043D\u0441 \u0434\u0435\u043B\u0438\u0442\u044C \u0431\u044B\u0442 \u0431\u0435\u0437 \u043C\u0435\u0436\u0434\u0443\u043D\u0430\u0440\u043E\u0434\u043D\u043E\u0433\u043E \u0441\u0443\u0434\u0430 \u0438\u0437-\u0437\u0430 \u043A\u0440\u0443\u0436\u043A\u0438 \u0432 \u0440\u0430\u043A\u043E\u0432\u0438\u043D\u0435."], attraction: ["\u041C\u0435\u0436\u0434\u0443 \u0432\u0430\u043C\u0438 \u043B\u0435\u0433\u043A\u043E \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0438\u043D\u0442\u0435\u0440\u0435\u0441 \u0438 \u0436\u0435\u043B\u0430\u043D\u0438\u0435 \u0431\u044B\u0442\u044C \u0431\u043B\u0438\u0436\u0435.", "\u0425\u0438\u043C\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u0431\u044B\u0441\u0442\u0440\u0435\u0435, \u0447\u0435\u043C \u0437\u0434\u0440\u0430\u0432\u044B\u0439 \u0441\u043C\u044B\u0441\u043B \u0443\u0441\u043F\u0435\u0432\u0430\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044E."], pace: ["\u041F\u043E\u0445\u043E\u0436\u0438\u0439 \u0442\u0435\u043C\u043F \u0443\u043C\u0435\u043D\u044C\u0448\u0430\u0435\u0442 \u043E\u0449\u0443\u0449\u0435\u043D\u0438\u0435, \u0447\u0442\u043E \u043E\u0434\u043D\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E \u0442\u043E\u0440\u043E\u043F\u044F\u0442 \u0438\u043B\u0438 \u0442\u043E\u0440\u043C\u043E\u0437\u044F\u0442.", "\u0418\u0434\u0451\u0442\u0435 \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u0441 \u043E\u0434\u043D\u043E\u0439 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C\u044E \u2014 \u043D\u0438\u043A\u0442\u043E \u043D\u0435 \u0442\u0430\u0449\u0438\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0437\u0430 \u043A\u0430\u043F\u044E\u0448\u043E\u043D."], repair: ["\u041F\u043E\u0441\u043B\u0435 \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u044F \u0432\u0430\u043C \u043F\u0440\u043E\u0449\u0435 \u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0443 \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442.", "\u041C\u043E\u0436\u0435\u0442\u0435 \u043F\u043E\u0441\u0441\u043E\u0440\u0438\u0442\u044C\u0441\u044F, \u043E\u0441\u0442\u044B\u0442\u044C \u0438 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0441\u0435\u0437\u043E\u043D \u0441\u0435\u0440\u0438\u0430\u043B\u0430 \xAB\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u0435 \u043D\u0430 \u0442\u0440\u043E\u0435 \u0441\u0443\u0442\u043E\u043A\xBB."] },
      friction: { communication: ["\u041D\u0435 \u0434\u043E\u0434\u0443\u043C\u044B\u0432\u0430\u0439\u0442\u0435 \u0438\u043D\u0442\u043E\u043D\u0430\u0446\u0438\u044E \u0437\u0430 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u2014 \u0443\u0442\u043E\u0447\u043D\u044F\u0439\u0442\u0435 \u0441\u043C\u044B\u0441\u043B \u043F\u0440\u044F\u043C\u043E.", "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u0432\u0440\u0430\u0433 \u2014 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \xAB\u044F\u0441\u043D\u043E\xBB. \u041E\u043D\u043E \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u043E\u0437\u043D\u0430\u0447\u0430\u0435\u0442 \u043F\u0440\u043E\u0441\u0442\u043E \xAB\u044F\u0441\u043D\u043E\xBB."], emotions: ["\u041F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u044C \u0432 \u0431\u043B\u0438\u0437\u043E\u0441\u0442\u0438 \u0438 \u043B\u0438\u0447\u043D\u043E\u043C \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0435 \u043C\u043E\u0436\u0435\u0442 \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0442\u044C\u0441\u044F.", "\u041E\u0434\u0438\u043D \u0445\u043E\u0447\u0435\u0442 \u043E\u0431\u043D\u0438\u043C\u0430\u0442\u044C\u0441\u044F, \u0432\u0442\u043E\u0440\u043E\u0439 \u0432 \u044D\u0442\u043E\u0442 \u043C\u043E\u043C\u0435\u043D\u0442 \u0445\u043E\u0447\u0435\u0442, \u0447\u0442\u043E\u0431\u044B \u0435\u0433\u043E \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u043B\u0438 \u0434\u0430\u0436\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F."], daily: ["\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u043E \u043F\u043E\u0440\u044F\u0434\u043A\u0435 \u0438 \u043E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u044F\u0445 \u043B\u0443\u0447\u0448\u0435 \u043D\u0430\u0437\u0432\u0430\u0442\u044C \u0437\u0430\u0440\u0430\u043D\u0435\u0435.", "\u041B\u044E\u0431\u043E\u0432\u044C \u043B\u044E\u0431\u043E\u0432\u044C\u044E, \u043D\u043E \u043A\u0442\u043E-\u0442\u043E \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0434\u043E\u043B\u0436\u0435\u043D \u0432\u0441\u043F\u043E\u043C\u043D\u0438\u0442\u044C \u043F\u0440\u043E \u043C\u0443\u0441\u043E\u0440 \u0438 \u0442\u0443\u0430\u043B\u0435\u0442\u043D\u0443\u044E \u0431\u0443\u043C\u0430\u0433\u0443."], attraction: ["\u0421\u0438\u043B\u044C\u043D\u0430\u044F \u0438\u0441\u043A\u0440\u0430 \u043D\u0435 \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0451\u043D\u043D\u043E\u0441\u0442\u0438 \u0438 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435 \u043A \u0433\u0440\u0430\u043D\u0438\u0446\u0430\u043C.", "\u0425\u0438\u043C\u0438\u044F \u043E\u0442\u043B\u0438\u0447\u043D\u0430\u044F, \u043D\u043E \u043E\u0434\u043D\u043E\u0439 \u0445\u0438\u043C\u0438\u0435\u0439 \u0430\u0440\u0435\u043D\u0434\u0443 \u0438 \u043E\u0431\u0438\u0434\u044B \u043D\u0435 \u0437\u0430\u043A\u0440\u043E\u0435\u0448\u044C."], pace: ["\u0420\u0435\u0448\u0435\u043D\u0438\u044F \u043C\u043E\u0433\u0443\u0442 \u0441\u043E\u0437\u0440\u0435\u0432\u0430\u0442\u044C \u0441 \u0440\u0430\u0437\u043D\u043E\u0439 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C\u044E.", "\u041E\u0434\u0438\u043D \u0443\u0436\u0435 \u0432\u044B\u0431\u0440\u0430\u043B \u043E\u0442\u043F\u0443\u0441\u043A, \u0432\u0442\u043E\u0440\u043E\u0439 \u0435\u0449\u0451 \u043D\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u043B\u0441\u044F \u0432\u044B\u0439\u0442\u0438 \u0438\u0437 \u0434\u043E\u043C\u0430."], repair: ["\u041F\u043E\u0441\u043B\u0435 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0430 \u043E\u0434\u0438\u043D \u043C\u043E\u0436\u0435\u0442 \u0438\u0441\u043A\u0430\u0442\u044C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440, \u0430 \u0434\u0440\u0443\u0433\u043E\u0439 \u2014 \u043F\u0430\u0443\u0437\u0443.", "\u041E\u0434\u0438\u043D \u0433\u043E\u0442\u043E\u0432 \u043C\u0438\u0440\u0438\u0442\u044C\u0441\u044F \u0441\u0435\u0439\u0447\u0430\u0441, \u0432\u0442\u043E\u0440\u043E\u0439 \u0435\u0449\u0451 \u043C\u044B\u0441\u043B\u0435\u043D\u043D\u043E \u0432\u044B\u0438\u0433\u0440\u044B\u0432\u0430\u0435\u0442 \u0441\u043F\u043E\u0440 \u0432 \u0434\u0443\u0448\u0435."] },
      advice: { communication: ["\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043C\u044B\u0441\u043B\u044C \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u0441\u0432\u043E\u0438\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438, \u043F\u0440\u0435\u0436\u0434\u0435 \u0447\u0435\u043C \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C.", "\u0417\u0430\u043F\u0440\u0435\u0442\u0438\u0442\u0435 \u043D\u0430 \u0441\u0443\u0442\u043A\u0438 \u0444\u0440\u0430\u0437\u0443 \xAB\u0442\u044B \u0441\u0430\u043C \u0432\u0441\u0451 \u043F\u043E\u043D\u0438\u043C\u0430\u0435\u0448\u044C\xBB. \u0421\u043F\u043E\u0439\u043B\u0435\u0440: \u043D\u0435 \u043F\u043E\u043D\u0438\u043C\u0430\u0435\u0442."], emotions: ["\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435: \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u0443\u0436\u043D\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430, \u0441\u043E\u0432\u0435\u0442 \u0438\u043B\u0438 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430?", "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0440\u0438 \u0440\u0435\u0436\u0438\u043C\u0430: \u043E\u0431\u043D\u044F\u0442\u044C, \u0432\u044B\u0441\u043B\u0443\u0448\u0430\u0442\u044C, \u043E\u0442\u043E\u0439\u0442\u0438 \u0438 \u043F\u0440\u0438\u043D\u0435\u0441\u0442\u0438 \u0432\u043A\u0443\u0441\u043D\u043E\u0435."], daily: ["\u0420\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0440\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0438\u0445\u0441\u044F \u0434\u0435\u043B\u0430 \u0438 \u043F\u0435\u0440\u0435\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0434\u0435\u043B\u044E.", "\u0414\u0432\u0430 \u043E\u0434\u0435\u044F\u043B\u0430 \u0438 \u043F\u043E\u043D\u044F\u0442\u043D\u0430\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u0437\u0430 \u043C\u0443\u0441\u043E\u0440\u043E\u043C \u0441\u043F\u0430\u0441\u043B\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 \u0441\u043E\u044E\u0437\u043E\u0432, \u0447\u0435\u043C \u043A\u0440\u0430\u0441\u0438\u0432\u044B\u0435 \u0446\u0438\u0442\u0430\u0442\u044B."], attraction: ["\u041D\u0435 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u044F\u0440\u043A\u043E\u0441\u0442\u044C \u043D\u0430\u0447\u0430\u043B\u0430 \u0432 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0442\u0443 \u0436\u0435 \u0438\u043D\u0442\u0435\u043D\u0441\u0438\u0432\u043D\u043E\u0441\u0442\u044C.", "\u0418\u043D\u043E\u0433\u0434\u0430 \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0435 \u2014 \u044D\u0442\u043E \u0435\u0434\u0430, \u0442\u0438\u0448\u0438\u043D\u0430 \u0438 \u043D\u0438\u043A\u0442\u043E \u043D\u0435 \u0432\u044B\u044F\u0441\u043D\u044F\u0435\u0442 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F \u0432 01:40."], pace: ["\u0414\u043B\u044F \u0432\u0430\u0436\u043D\u043E\u0433\u043E \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441\u0440\u0430\u0437\u0443 \u043D\u0430\u0437\u043D\u0430\u0447\u044C\u0442\u0435 \u0441\u0440\u043E\u043A, \u043A\u043E\u0433\u0434\u0430 \u0432\u0435\u0440\u043D\u0451\u0442\u0435\u0441\u044C \u043A \u043D\u0435\u043C\u0443.", "\u041F\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0434\u0435\u0434\u043B\u0430\u0439\u043D \u0434\u0430\u0436\u0435 \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0435: \u0438\u043D\u0430\u0447\u0435 \u043E\u0434\u0438\u043D \u0443\u0436\u0435 \u0436\u0438\u0432\u0451\u0442 \u0432\u043C\u0435\u0441\u0442\u0435, \u0434\u0440\u0443\u0433\u043E\u0439 \u0435\u0449\u0451 \u043F\u0435\u0447\u0430\u0442\u0430\u0435\u0442 \u043E\u0442\u0432\u0435\u0442."], repair: ["\u0417\u0430\u0440\u0430\u043D\u0435\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u0441\u044C, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u0438\u0442\u0441\u044F \u043F\u0430\u0443\u0437\u0430 \u0438 \u043A\u0442\u043E \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440.", "\u0421\u0441\u043E\u0440\u0438\u0442\u044C\u0441\u044F \u043C\u043E\u0436\u043D\u043E. \u0418\u0441\u0447\u0435\u0437\u0430\u0442\u044C \u0432 \u0442\u0443\u043C\u0430\u043D \u0431\u0435\u0437 \u0441\u0440\u043E\u043A\u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0430 \u2014 \u0443\u0436\u0435 \u043F\u043B\u043E\u0445\u043E\u0439 \u0441\u0435\u0440\u0438\u0430\u043B."] }
    },
    en: {
      ui: { normal: "\u{1F607} Calm", humor: "\u{1F3AD} With humor", toneLabel: "How to tell the story", locked: "Your main verdict is ready", unlock: "Reveal verdict", unlocked: "Verdict revealed", strength: "What brings you together", friction: "Where sparks may fly", advice: "What actually helps", details: "Tap a category to see what shaped the score", why: "Why this result", sharePair: "Share our result", shareSafe: "The link includes names and the ready result. Birth dates are not shared.", shareSafeSolo: "The link includes the name, sign and ready ranking. The birth date is not shared.", rankOpen: "Open explanation", rankWhy: "Why it fits", rankRisk: "Possible friction", rankTip: "What helps" },
      bands: { fragile: { normal: ["Very different ways of building closeness", "A match that needs clear agreements"], humor: ["This relationship manual is thicker than a mortgage contract", "There is attraction, but your factory settings came from different boxes"] }, contrast: { normal: ["Clear differences that can still be managed", "A contrasting match with a few important conditions"], humor: ["It can work, but the relationship may need tech support", "Compatibility mode: \u201Clet me explain that one more time\u201D"] }, sparks: { normal: ["There is a connection; the rhythm still needs tuning", "A lively match with visible room to grow"], humor: ["Sparks are flying\u2014sometimes chemistry, sometimes a short circuit", "Mutual interest found. User manual missing"] }, workable: { normal: ["A good base when differences are not ignored", "A steady match with room for adjustment"], humor: ["Nicely glued together\u2014just do not stress-test it with chores daily", "The relationship runs; a few known bugs remain"] }, strong: { normal: ["A strong match with plenty of mutual understanding", "Many natural points of connection"], humor: ["Two matching shoes, and both know where the missing sock went", "One imagines a weird idea; the other has already added it to cart"] }, close: { normal: ["A very close rhythm with visible mutual support", "An unusually comfortable character match"], humor: ["Even if pushed away, nobody is going very far", "You can scroll in silence and call it quality time"] }, rare: { normal: ["An unusually cohesive match in these traditions", "An exceptionally close symbolic rhythm"], humor: ["Connected through cosmic Wi\u2011Fi", "Suspiciously compatible. Check for accidental mind-reading"] } },
      elements: { air_air: ["Both value conversation, freedom of thought, and moving ideas.", "Two idea generators: many tabs, very little boredom."], air_fire: ["Fire starts action while air feeds ideas and excitement.", "One lights the spark, the other fans it\u2014keep the shared calendar safe."], air_earth: ["One seeks options and freedom; the other wants reliability and specifics.", "One builds a castle in the air; the other requests a quote and deadline."], air_water: ["Logic and feeling use different dialects but can teach each other a lot.", "One explains with logic; the other reads the pause between messages."], fire_fire: ["High pace, shared initiative, and quick competition.", "Two engines, one steering wheel, zero interest in driving slowly."], earth_fire: ["Initiative meets practicality when both agree on speed.", "One has started; the other is checking the warranty and paperwork."], fire_water: ["Directness and sensitivity create attraction but need careful delivery.", "One says it plainly; the other hears three hidden meanings."], earth_earth: ["Reliability, clear plans, and actions matter more than promises.", "Scheduled romance is still romance when the table is booked."], earth_water: ["Practicality grounds emotion, while feeling adds depth.", "One brings a blanket; the other explains why the blanket is emotionally essential."], water_water: ["Emotional sensitivity is high, so moods quickly become shared.", "One sighs; the other already knows the plot, cause, and ending."] },
      numberRelations: { same: ["Similar consciousness numbers create familiar reactions and decisions.", "Similar settings: sometimes wordless understanding, sometimes synchronized stubbornness."], near: ["The number roles are close enough to find a shared way of acting.", "Similar mechanics, slightly different button placement."], mixed: ["The numbers suggest different but complementary roles.", "One starts the quest; the other somehow knows where the key is."], contrast: ["The number roles differ, so expectations need to be explicit.", "One has a one-page manual; the other comes with a three-hour director\u2019s cut."] },
      strong: { communication: ["Conversation can bring you back to the same side.", "A debate can end as a shared joke and a food order."], emotions: ["Support is easier to notice and receive.", "Emotional Wi\u2011Fi works through walls and the phrase \u201CI\u2019m fine.\u201D"], daily: ["Everyday agreements can work without constant supervision.", "Chores may be shared without an international trial over a cup in the sink."], attraction: ["Interest and closeness arise naturally.", "Chemistry loads before common sense opens the manual."], pace: ["A similar pace means less pushing and pulling.", "You move at roughly the same speed; nobody gets dragged by the hoodie."], repair: ["It is easier to reconnect after tension.", "You can argue, cool down, and skip the three-day silent-series premiere."] },
      friction: { communication: ["Do not invent the other person\u2019s tone\u2014ask what was meant.", "The main enemy is \u201Cfine.\u201D It is almost never just fine."], emotions: ["Needs for closeness and personal space may differ.", "One wants a hug; the other wants even notifications to stop touching them."], daily: ["Name expectations about order and responsibility early.", "Love is love, but somebody still has to remember trash bags."], attraction: ["Strong chemistry cannot replace boundaries and agreements.", "Chemistry is great, but it cannot pay rent or settle every hurt."], pace: ["Decisions may mature at different speeds.", "One picked the vacation; the other has not agreed to leave home."], repair: ["After conflict, one may want dialogue while the other needs a pause.", "One is ready to reconcile; the other is still winning the shower argument."] },
      advice: { communication: ["Repeat each other\u2019s point in your own words before replying.", "Ban \u201Cyou know what I mean\u201D for a day. Spoiler: they do not."], emotions: ["Ask whether support, advice, or space is needed right now.", "Use three modes: hug, listen, or step back and bring snacks."], daily: ["Split three recurring tasks and review the deal in a week.", "Two blankets and a clear trash schedule have saved many evenings."], attraction: ["Do not demand that early intensity stay at maximum forever.", "Sometimes a good date is food, silence, and no 1:40 a.m. summit."], pace: ["Set a time to return to an important decision.", "Give romance a deadline: one has moved in mentally while the other is typing."], repair: ["Agree how long a pause lasts and who restarts the talk.", "Arguments happen. Vanishing without a return time is bad television."] }
    },
    kk: {
      ui: { normal: "\u{1F607} \u0411\u0430\u0439\u044B\u043F\u043F\u0435\u043D", humor: "\u{1F3AD} \u04D8\u0437\u0456\u043B\u043C\u0435\u043D", toneLabel: "\u041D\u04D9\u0442\u0438\u0436\u0435\u043D\u0456 \u049B\u0430\u043B\u0430\u0439 \u0430\u0439\u0442\u0430\u043C\u044B\u0437", locked: "\u041D\u0435\u0433\u0456\u0437\u0433\u0456 \u049B\u043E\u0440\u044B\u0442\u044B\u043D\u0434\u044B \u0434\u0430\u0439\u044B\u043D", unlock: "\u049A\u043E\u0440\u044B\u0442\u044B\u043D\u0434\u044B\u043D\u044B \u0430\u0448\u0443", unlocked: "\u049A\u043E\u0440\u044B\u0442\u044B\u043D\u0434\u044B \u0430\u0448\u044B\u043B\u0434\u044B", strength: "\u0421\u0456\u0437\u0434\u0435\u0440\u0434\u0456 \u043D\u0435 \u0436\u0430\u049B\u044B\u043D\u0434\u0430\u0441\u0442\u044B\u0440\u0430\u0434\u044B", friction: "\u049A\u0430\u0439 \u0436\u0435\u0440\u0434\u0435 \u04B1\u0448\u049B\u044B\u043D \u0448\u044B\u0493\u0443\u044B \u043C\u04AF\u043C\u043A\u0456\u043D", advice: "\u041D\u0435 \u043A\u04E9\u043C\u0435\u043A\u0442\u0435\u0441\u0435\u0434\u0456", details: "\u0411\u0430\u0493\u0430\u043D\u044B \u043D\u0435 \u049B\u0430\u043B\u044B\u043F\u0442\u0430\u0441\u0442\u044B\u0440\u0493\u0430\u043D\u044B\u043D \u043A\u04E9\u0440\u0443 \u04AF\u0448\u0456\u043D \u0431\u04E9\u043B\u0456\u043C\u0434\u0456 \u0431\u0430\u0441\u044B\u04A3\u044B\u0437", why: "\u041D\u0435\u0433\u0435 \u0431\u04B1\u043B\u0430\u0439 \u0448\u044B\u049B\u0442\u044B", sharePair: "\u041E\u0440\u0442\u0430\u049B \u043D\u04D9\u0442\u0438\u0436\u0435\u043C\u0456\u0437\u0431\u0435\u043D \u0431\u04E9\u043B\u0456\u0441\u0443", shareSafe: "\u0421\u0456\u043B\u0442\u0435\u043C\u0435\u0434\u0435 \u0435\u0441\u0456\u043C\u0434\u0435\u0440 \u043C\u0435\u043D \u0434\u0430\u0439\u044B\u043D \u043D\u04D9\u0442\u0438\u0436\u0435 \u0431\u043E\u043B\u0430\u0434\u044B. \u0422\u0443\u0493\u0430\u043D \u043A\u04AF\u043D\u0434\u0435\u0440 \u0431\u0435\u0440\u0456\u043B\u043C\u0435\u0439\u0434\u0456.", shareSafeSolo: "\u0421\u0456\u043B\u0442\u0435\u043C\u0435\u0434\u0435 \u0435\u0441\u0456\u043C, \u0431\u0435\u043B\u0433\u0456 \u0436\u04D9\u043D\u0435 \u0434\u0430\u0439\u044B\u043D \u0440\u0435\u0439\u0442\u0438\u043D\u0433 \u0431\u043E\u043B\u0430\u0434\u044B. \u0422\u0443\u0493\u0430\u043D \u043A\u04AF\u043D \u0431\u0435\u0440\u0456\u043B\u043C\u0435\u0439\u0434\u0456.", rankOpen: "\u0422\u04AF\u0441\u0456\u043D\u0434\u0456\u0440\u043C\u0435\u043D\u0456 \u0430\u0448\u0443", rankWhy: "\u041D\u0435\u0433\u0435 \u04AF\u0439\u043B\u0435\u0441\u0435\u0434\u0456", rankRisk: "\u049A\u0430\u0439 \u0436\u0435\u0440\u0434\u0435 \u049B\u0438\u044B\u043D\u0434\u044B\u049B \u0431\u043E\u043B\u0443\u044B \u043C\u04AF\u043C\u043A\u0456\u043D", rankTip: "\u041D\u0435 \u043A\u04E9\u043C\u0435\u043A\u0442\u0435\u0441\u0435\u0434\u0456" },
      bands: { fragile: { normal: ["\u0416\u0430\u049B\u044B\u043D\u0434\u044B\u049B \u049B\u04B1\u0440\u0443 \u0442\u04D9\u0441\u0456\u043B\u0434\u0435\u0440\u0456\u04A3\u0456\u0437 \u04E9\u0442\u0435 \u0431\u04E9\u043B\u0435\u043A", "\u041D\u0430\u049B\u0442\u044B \u043A\u0435\u043B\u0456\u0441\u0456\u043C\u0434\u0456 \u049B\u0430\u0436\u0435\u0442 \u0435\u0442\u0435\u0442\u0456\u043D \u0436\u04B1\u043F"], humor: ["\u0411\u04B1\u043B \u043E\u0434\u0430\u049B\u0442\u044B\u04A3 \u043D\u04B1\u0441\u049B\u0430\u0443\u043B\u044B\u0493\u044B \u0438\u043F\u043E\u0442\u0435\u043A\u0430 \u043A\u0435\u043B\u0456\u0441\u0456\u043C\u0456\u043D\u0435\u043D \u0434\u0435 \u049B\u0430\u043B\u044B\u04A3", "\u0422\u0430\u0440\u0442\u044B\u043B\u044B\u0441 \u0431\u0430\u0440, \u0431\u0456\u0440\u0430\u049B \u0437\u0430\u0443\u044B\u0442\u0442\u044B\u049B \u0431\u0430\u043F\u0442\u0430\u0443\u043B\u0430\u0440 \u0435\u043A\u0456 \u0431\u04E9\u043B\u0435\u043A \u049B\u043E\u0440\u0430\u043F\u0442\u0430\u043D \u0448\u044B\u049B\u049B\u0430\u043D"] }, contrast: { normal: ["\u0410\u0439\u044B\u0440\u043C\u0430\u0448\u044B\u043B\u044B\u049B \u043A\u04E9\u043F, \u0431\u0456\u0440\u0430\u049B \u043E\u043D\u044B \u0431\u0430\u0441\u049B\u0430\u0440\u0443\u0493\u0430 \u0431\u043E\u043B\u0430\u0434\u044B", "\u0411\u0456\u0440\u043D\u0435\u0448\u0435 \u043C\u0430\u04A3\u044B\u0437\u0434\u044B \u0448\u0430\u0440\u0442\u044B \u0431\u0430\u0440 \u049B\u0430\u0440\u0430\u043C\u0430-\u049B\u0430\u0440\u0441\u044B \u0436\u04B1\u043F"], humor: ["\u0411\u0456\u0440\u0433\u0435 \u0431\u043E\u043B\u0443\u0493\u0430 \u0431\u043E\u043B\u0430\u0434\u044B, \u0431\u0456\u0440\u0430\u049B \u049B\u0430\u0440\u044B\u043C-\u049B\u0430\u0442\u044B\u043D\u0430\u0441\u049B\u0430 \u0442\u0435\u0445\u049B\u043E\u043B\u0434\u0430\u0443 \u043A\u0435\u0440\u0435\u043A", "\u04AE\u0439\u043B\u0435\u0441\u0456\u043C \u0440\u0435\u0436\u0438\u043C\u0456: \xAB\u0442\u0430\u0493\u044B \u0431\u0456\u0440 \u0440\u0435\u0442 \u0434\u04B1\u0440\u044B\u0441\u0442\u0430\u043F \u0442\u04AF\u0441\u0456\u043D\u0434\u0456\u0440\u0435\u0439\u0456\u043D\xBB"] }, sparks: { normal: ["\u0411\u0430\u0439\u043B\u0430\u043D\u044B\u0441 \u0431\u0430\u0440, \u043E\u0440\u0442\u0430\u049B \u044B\u0440\u0493\u0430\u049B\u0442\u044B \u04D9\u043B\u0456 \u0431\u0430\u043F\u0442\u0430\u0443 \u043A\u0435\u0440\u0435\u043A", "\u04E8\u0441\u0443\u0433\u0435 \u043C\u04AF\u043C\u043A\u0456\u043D\u0434\u0456\u0433\u0456 \u0431\u0430\u0440 \u0436\u0430\u043D\u0434\u044B \u04AF\u0439\u043B\u0435\u0441\u0456\u043C"], humor: ["\u04B0\u0448\u049B\u044B\u043D \u0431\u0430\u0440: \u043A\u0435\u0439\u0434\u0435 \u0445\u0438\u043C\u0438\u044F\u0434\u0430\u043D, \u043A\u0435\u0439\u0434\u0435 \u049B\u044B\u0441\u049B\u0430 \u0442\u04B1\u0439\u044B\u049B\u0442\u0430\u043B\u0443\u0434\u0430\u043D", "\u049A\u044B\u0437\u044B\u0493\u0443\u0448\u044B\u043B\u044B\u049B \u0442\u0430\u0431\u044B\u043B\u0434\u044B, \u043F\u0430\u0439\u0434\u0430\u043B\u0430\u043D\u0443 \u043D\u04B1\u0441\u049B\u0430\u0443\u043B\u044B\u0493\u044B \u0436\u043E\u0493\u0430\u043B\u0493\u0430\u043D"] }, workable: { normal: ["\u0410\u0439\u044B\u0440\u043C\u0430\u0448\u044B\u043B\u044B\u049B\u0442\u044B \u0436\u0430\u0441\u044B\u0440\u043C\u0430\u0441\u0430\u04A3\u044B\u0437\u0434\u0430\u0440, \u043D\u0435\u0433\u0456\u0437\u0456 \u0436\u0430\u049B\u0441\u044B", "\u0411\u0430\u043F\u0442\u0430\u0443\u0493\u0430 \u0431\u043E\u043B\u0430\u0442\u044B\u043D \u0442\u04B1\u0440\u0430\u049B\u0442\u044B \u04AF\u0439\u043B\u0435\u0441\u0456\u043C"], humor: ["\u0416\u0430\u049B\u0441\u044B \u0436\u0430\u0431\u044B\u0441\u0442\u044B\u04A3\u044B\u0437\u0434\u0430\u0440, \u0442\u0435\u043A \u043A\u04AF\u043D\u0434\u0435 \u0442\u04B1\u0440\u043C\u044B\u0441\u043F\u0435\u043D \u0441\u044B\u043D\u0430\u043C\u0430\u04A3\u044B\u0437\u0434\u0430\u0440", "\u041E\u0434\u0430\u049B \u0436\u04B1\u043C\u044B\u0441 \u0456\u0441\u0442\u0435\u043F \u0442\u04B1\u0440, \u04B1\u0441\u0430\u049B \u0431\u0430\u0433\u0442\u0430\u0440 \u0431\u0435\u043B\u0433\u0456\u043B\u0456"] }, strong: { normal: ["\u04E8\u0437\u0430\u0440\u0430 \u0442\u04AF\u0441\u0456\u043D\u0456\u0441\u0443 \u049B\u043E\u0440\u044B \u043C\u043E\u043B \u043A\u04AF\u0448\u0442\u0456 \u04AF\u0439\u043B\u0435\u0441\u0456\u043C", "\u0422\u0430\u0431\u0438\u0493\u0438 \u0441\u04D9\u0439\u043A\u0435\u0441\u0442\u0456\u043A \u043A\u04E9\u043F"], humor: ["\u0415\u043A\u0456 \u0435\u0442\u0456\u043A \u2014 \u0431\u0456\u0440 \u0436\u04B1\u043F, \u0436\u043E\u0493\u0430\u043B\u0493\u0430\u043D \u0448\u04B1\u043B\u044B\u049B\u0442\u044B\u04A3 \u043E\u0440\u043D\u044B\u043D \u0434\u0430 \u0431\u0456\u043B\u0435\u0441\u0456\u0437\u0434\u0435\u0440", "\u0411\u0456\u0440\u0456 \u049B\u044B\u0437\u044B\u049B \u043E\u0439 \u0430\u0439\u0442\u0430\u0434\u044B, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0441\u0435\u0431\u0435\u0442\u043A\u0435 \u0441\u0430\u043B\u044B\u043F \u049B\u043E\u0439\u0493\u0430\u043D"] }, close: { normal: ["\u042B\u0440\u0493\u0430\u049B\u0442\u0430\u0440\u044B\u04A3\u044B\u0437 \u0436\u0430\u049B\u044B\u043D, \u049B\u043E\u043B\u0434\u0430\u0443 \u0430\u043D\u044B\u049B \u0441\u0435\u0437\u0456\u043B\u0435\u0434\u0456", "\u041C\u0456\u043D\u0435\u0437\u0434\u0435\u0440 \u0441\u0438\u0440\u0435\u043A \u043A\u0435\u0437\u0434\u0435\u0441\u0435\u0442\u0456\u043D\u0434\u0435\u0439 \u044B\u04A3\u0493\u0430\u0439\u043B\u044B \u04AF\u0439\u043B\u0435\u0441\u043A\u0435\u043D"], humor: ["\u049A\u0443\u0441\u0430\u04A3\u044B\u0437 \u0434\u0430 \u0430\u043B\u044B\u0441\u049B\u0430 \u043A\u0435\u0442\u043F\u0435\u0439\u0434\u0456", "\u04AE\u043D\u0434\u0435\u043C\u0435\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u049B\u0430\u0440\u0430\u043F, \u043E\u043D\u044B \u0436\u0430\u049B\u0441\u044B \u043A\u0435\u0437\u0434\u0435\u0441\u0443 \u0434\u0435\u043F \u0441\u0430\u043D\u0430\u0439 \u0430\u043B\u0430\u0441\u044B\u0437\u0434\u0430\u0440"] }, rare: { normal: ["\u0422\u0430\u04A3\u0434\u0430\u043B\u0493\u0430\u043D \u0436\u04AF\u0439\u0435\u043B\u0435\u0440 \u0431\u043E\u0439\u044B\u043D\u0448\u0430 \u04E9\u0442\u0435 \u0442\u04B1\u0442\u0430\u0441 \u04AF\u0439\u043B\u0435\u0441\u0456\u043C", "\u0421\u0438\u043C\u0432\u043E\u043B\u0434\u044B\u049B \u044B\u0440\u0493\u0430\u049B\u0442\u0430\u0440\u044B\u04A3\u044B\u0437 \u0435\u0440\u0435\u043A\u0448\u0435 \u0436\u0430\u049B\u044B\u043D"], humor: ["\u0492\u0430\u0440\u044B\u0448\u0442\u044B\u049B Wi\u2011Fi \u0430\u0440\u049B\u044B\u043B\u044B \u049B\u043E\u0441\u044B\u043B\u0493\u0430\u043D\u0441\u044B\u0437\u0434\u0430\u0440", "\u041A\u04AF\u043C\u04D9\u043D\u0434\u0456 \u0434\u0435\u04A3\u0433\u0435\u0439\u0434\u0435 \u04AF\u0439\u043B\u0435\u0441\u0435\u0441\u0456\u0437\u0434\u0435\u0440: \u043E\u0439 \u043E\u049B\u044B\u043C\u0430\u0439\u0441\u044B\u0437\u0434\u0430\u0440 \u043C\u0430?"] } },
      elements: { air_air: ["\u0415\u043A\u0435\u0443\u0456\u04A3\u0456\u0437\u0433\u0435 \u0434\u0435 \u04D9\u04A3\u0433\u0456\u043C\u0435, \u043E\u0439 \u0435\u0440\u043A\u0456\u043D\u0434\u0456\u0433\u0456 \u0436\u04D9\u043D\u0435 \u0438\u0434\u0435\u044F \u049B\u043E\u0437\u0493\u0430\u043B\u044B\u0441\u044B \u043C\u0430\u04A3\u044B\u0437\u0434\u044B.", "\u0415\u043A\u0456 \u0438\u0434\u0435\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440\u044B: \u0431\u0435\u0442 \u043A\u04E9\u043F, \u0456\u0448 \u043F\u044B\u0441\u043F\u0430\u0439\u0434\u044B."], air_fire: ["\u041E\u0442 \u04D9\u0440\u0435\u043A\u0435\u0442\u0442\u0456 \u0431\u0430\u0441\u0442\u0430\u0439\u0434\u044B, \u0430\u0443\u0430 \u0438\u0434\u0435\u044F \u043C\u0435\u043D \u049B\u04B1\u043B\u0448\u044B\u043D\u044B\u0441\u0442\u044B \u043A\u04AF\u0448\u0435\u0439\u0442\u0435\u0434\u0456.", "\u0411\u0456\u0440\u0456 \u0436\u0430\u0493\u0430\u0434\u044B, \u0431\u0456\u0440\u0456 \u04AF\u0440\u043B\u0435\u0439\u0434\u0456 \u2014 \u043E\u0440\u0442\u0430\u049B \u043A\u04AF\u043D\u0442\u0456\u0437\u0431\u0435\u043D\u0456 \u04E9\u0440\u0442\u0435\u043C\u0435\u04A3\u0456\u0437\u0434\u0435\u0440."], air_earth: ["\u0411\u0456\u0440\u0456 \u0435\u0440\u043A\u0456\u043D\u0434\u0456\u043A \u043F\u0435\u043D \u043D\u04B1\u0441\u049B\u0430 \u0456\u0437\u0434\u0435\u0439\u0434\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u043D\u0430\u049B\u0442\u044B\u043B\u044B\u049B \u043F\u0435\u043D \u0441\u0435\u043D\u0456\u043C\u0434\u0456\u043B\u0456\u043A \u049B\u0430\u043B\u0430\u0439\u0434\u044B.", "\u0411\u0456\u0440\u0456 \u0430\u0443\u0430\u0434\u0430 \u0441\u0430\u0440\u0430\u0439 \u0441\u0430\u043B\u0430\u0434\u044B, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0441\u043C\u0435\u0442\u0430 \u043C\u0435\u043D \u043C\u0435\u0440\u0437\u0456\u043C\u0434\u0456 \u0441\u04B1\u0440\u0430\u043F \u0442\u04B1\u0440."], air_water: ["\u0410\u049B\u044B\u043B \u043C\u0435\u043D \u0441\u0435\u0437\u0456\u043C \u0435\u043A\u0456 \u0442\u0456\u043B\u0434\u0435 \u0441\u04E9\u0439\u043B\u0435\u0433\u0435\u043D\u043C\u0435\u043D, \u0431\u0456\u0440-\u0431\u0456\u0440\u0456\u043D\u0435\u043D \u043A\u04E9\u043F \u043D\u04D9\u0440\u0441\u0435 \u04AF\u0439\u0440\u0435\u043D\u0435\u0434\u0456.", "\u0411\u0456\u0440\u0456 \u043B\u043E\u0433\u0438\u043A\u0430\u043C\u0435\u043D \u0442\u04AF\u0441\u0456\u043D\u0434\u0456\u0440\u0435\u0434\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430 \u0430\u0440\u0430\u0441\u044B\u043D\u0434\u0430\u0493\u044B \u04AF\u0437\u0456\u043B\u0456\u0441\u0442\u0456 \u043E\u049B\u0438\u0434\u044B."], fire_fire: ["\u049A\u0430\u0440\u049B\u044B\u043D \u0436\u043E\u0493\u0430\u0440\u044B, \u0431\u0430\u0441\u0442\u0430\u043C\u0430 \u0435\u043A\u0435\u0443\u0456\u04A3\u0456\u0437\u0434\u0435 \u0434\u0435 \u0431\u0430\u0440, \u0431\u04D9\u0441\u0435\u043A\u0435 \u0442\u0435\u0437 \u049B\u043E\u0441\u044B\u043B\u0430\u0434\u044B.", "\u0415\u043A\u0456 \u049B\u043E\u0437\u0493\u0430\u043B\u0442\u049B\u044B\u0448, \u0431\u0456\u0440 \u0440\u0443\u043B\u044C, \u0431\u0430\u044F\u0443 \u0436\u04AF\u0440\u0443\u0433\u0435 \u043D\u0438\u0435\u0442 \u0436\u043E\u049B."], earth_fire: ["\u0411\u0430\u0441\u0442\u0430\u043C\u0430 \u043C\u0435\u043D \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430\u043B\u044B\u049B \u043A\u04E9\u0437\u049B\u0430\u0440\u0430\u0441 \u0436\u044B\u043B\u0434\u0430\u043C\u0434\u044B\u049B \u043A\u0435\u043B\u0456\u0441\u0456\u043B\u0441\u0435 \u0436\u0430\u049B\u0441\u044B \u0436\u04B1\u043C\u044B\u0441 \u0456\u0441\u0442\u0435\u0439\u0434\u0456.", "\u0411\u0456\u0440\u0456 \u0431\u0430\u0441\u0442\u0430\u043F \u043A\u0435\u0442\u0442\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u043A\u0435\u043F\u0456\u043B\u0434\u0456\u043A \u043F\u0435\u043D \u049B\u04B1\u0436\u0430\u0442\u0442\u044B \u0442\u0435\u043A\u0441\u0435\u0440\u0456\u043F \u0436\u0430\u0442\u044B\u0440."], fire_water: ["\u0422\u0443\u0440\u0430\u043B\u044B\u049B \u043F\u0435\u043D \u0441\u0435\u0437\u0456\u043C\u0442\u0430\u043B\u0434\u044B\u049B \u043A\u04AF\u0448\u0442\u0456 \u0442\u0430\u0440\u0442\u044B\u043B\u044B\u0441 \u0431\u0435\u0440\u0435\u0434\u0456, \u0431\u0456\u0440\u0430\u049B \u0441\u04E9\u0437\u0434\u0456 \u0430\u0431\u0430\u0439\u043B\u0430\u043F \u0430\u0439\u0442\u0443 \u043A\u0435\u0440\u0435\u043A.", "\u0411\u0456\u0440\u0456 \u0430\u0448\u044B\u049B \u0430\u0439\u0442\u0442\u044B, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0442\u0430\u0493\u044B \u04AF\u0448 \u0436\u0430\u0441\u044B\u0440\u044B\u043D \u043C\u0430\u0493\u044B\u043D\u0430 \u0435\u0441\u0442\u0456\u0434\u0456."], earth_earth: ["\u0421\u0435\u043D\u0456\u043C\u0434\u0456\u043B\u0456\u043A, \u043D\u0430\u049B\u0442\u044B \u0436\u043E\u0441\u043F\u0430\u0440 \u0436\u04D9\u043D\u0435 \u0456\u0441 \u0443\u04D9\u0434\u0435\u0434\u0435\u043D \u043C\u0430\u04A3\u044B\u0437\u0434\u044B.", "\u041A\u0435\u0441\u0442\u0435\u0434\u0435\u0433\u0456 \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0430 \u0434\u0430 \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0430, \u04D9\u0441\u0456\u0440\u0435\u0441\u0435 \u04AF\u0441\u0442\u0435\u043B \u0430\u043B\u0434\u044B\u043D \u0430\u043B\u0430 \u0430\u043B\u044B\u043D\u0493\u0430\u043D \u0431\u043E\u043B\u0441\u0430."], earth_water: ["\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430\u043B\u044B\u049B \u043A\u04E9\u0437\u049B\u0430\u0440\u0430\u0441 \u0441\u0435\u0437\u0456\u043C\u0433\u0435 \u0442\u0456\u0440\u0435\u043A, \u0430\u043B \u0441\u0435\u0437\u0456\u043C \u049B\u0430\u0440\u044B\u043C-\u049B\u0430\u0442\u044B\u043D\u0430\u0441\u049B\u0430 \u0442\u0435\u0440\u0435\u04A3\u0434\u0456\u043A \u0431\u0435\u0440\u0435\u0434\u0456.", "\u0411\u0456\u0440\u0456 \u043A\u04E9\u0440\u043F\u0435 \u04D9\u043A\u0435\u043B\u0435\u0434\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u043E\u043D\u044B\u04A3 \u043D\u0435\u0433\u0435 \u0434\u04D9\u043B \u049B\u0430\u0437\u0456\u0440 \u04E9\u0442\u0435 \u049B\u0430\u0436\u0435\u0442 \u0435\u043A\u0435\u043D\u0456\u043D \u0442\u04AF\u0441\u0456\u043D\u0434\u0456\u0440\u0435\u0434\u0456."], water_water: ["\u0421\u0435\u0437\u0456\u043C\u0442\u0430\u043B\u0434\u044B\u049B \u0436\u043E\u0493\u0430\u0440\u044B, \u0441\u043E\u043D\u0434\u044B\u049B\u0442\u0430\u043D \u043A\u04E9\u04A3\u0456\u043B \u043A\u04AF\u0439 \u0442\u0435\u0437 \u043E\u0440\u0442\u0430\u049B \u0431\u043E\u043B\u0430\u0434\u044B.", "\u0411\u0456\u0440\u0456 \u043A\u04AF\u0440\u0441\u0456\u043D\u0434\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u043E\u049B\u0438\u0493\u0430\u043D\u044B, \u0441\u0435\u0431\u0435\u0431\u0456\u043D \u0436\u04D9\u043D\u0435 \u0441\u043E\u04A3\u044B\u043D \u0442\u04AF\u0441\u0456\u043D\u0456\u043F \u049B\u043E\u0439\u0434\u044B."] },
      numberRelations: { same: ["\u04B0\u049B\u0441\u0430\u0441 \u0441\u0430\u043D\u0430 \u0441\u0430\u043D\u0434\u0430\u0440\u044B \u04D9\u0440\u0435\u043A\u0435\u0442 \u043F\u0435\u043D \u0448\u0435\u0448\u0456\u043C \u0442\u04D9\u0441\u0456\u043B\u0456\u043D \u0436\u0430\u049B\u044B\u043D\u0434\u0430\u0442\u0430\u0434\u044B.", "\u0411\u0430\u043F\u0442\u0430\u0443\u043B\u0430\u0440 \u04B1\u049B\u0441\u0430\u0441: \u043A\u0435\u0439\u0434\u0435 \u0441\u04E9\u0437\u0441\u0456\u0437 \u0442\u04AF\u0441\u0456\u043D\u0435\u0441\u0456\u0437\u0434\u0435\u0440, \u043A\u0435\u0439\u0434\u0435 \u0431\u0456\u0440\u0433\u0435 \u049B\u044B\u0440\u0441\u044B\u0493\u0430\u0441\u044B\u0437\u0434\u0430\u0440."], near: ["\u0421\u0430\u043D\u0434\u044B\u049B \u0440\u04E9\u043B\u0434\u0435\u0440 \u043E\u0440\u0442\u0430\u049B \u04D9\u0440\u0435\u043A\u0435\u0442 \u0442\u04D9\u0441\u0456\u043B\u0456\u043D \u0442\u0435\u0437 \u0442\u0430\u0431\u0443\u0493\u0430 \u0436\u0435\u0442\u043A\u0456\u043B\u0456\u043A\u0442\u0456 \u0436\u0430\u049B\u044B\u043D.", "\u041C\u0435\u0445\u0430\u043D\u0438\u043A\u0430 \u0431\u0456\u0440\u0434\u0435\u0439, \u0431\u0430\u0442\u044B\u0440\u043C\u0430\u043B\u0430\u0440 \u0441\u04D9\u043B \u0431\u0430\u0441\u049B\u0430 \u0436\u0435\u0440\u0434\u0435."], mixed: ["\u0421\u0430\u043D\u0434\u0430\u0440 \u0436\u04B1\u043F\u0442\u0430 \u0431\u04E9\u043B\u0435\u043A, \u0431\u0456\u0440\u0430\u049B \u0431\u0456\u0440\u0456\u043D-\u0431\u0456\u0440\u0456 \u0442\u043E\u043B\u044B\u049B\u0442\u044B\u0440\u0430\u0442\u044B\u043D \u0440\u04E9\u043B \u0431\u0435\u0440\u0435\u0434\u0456.", "\u0411\u0456\u0440\u0456 \u043A\u0432\u0435\u0441\u0442\u0442\u0456 \u0430\u0448\u0430\u0434\u044B, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u043A\u0456\u043B\u0442\u0442\u0456\u04A3 \u049B\u0430\u0439\u0434\u0430 \u0436\u0430\u0442\u049B\u0430\u043D\u044B\u043D \u0431\u0456\u043B\u0435\u0434\u0456."], contrast: ["\u0421\u0430\u043D\u0434\u044B\u049B \u0440\u04E9\u043B\u0434\u0435\u0440 \u0431\u04E9\u043B\u0435\u043A, \u0441\u043E\u043D\u0434\u044B\u049B\u0442\u0430\u043D \u043A\u04AF\u0442\u0443\u0434\u0456 \u0430\u043D\u044B\u049B \u0430\u0439\u0442\u0443 \u043C\u0430\u04A3\u044B\u0437\u0434\u044B.", "\u0411\u0456\u0440\u0456\u043D\u0434\u0435 \u0431\u0456\u0440 \u0431\u0435\u0442 \u043D\u04B1\u0441\u049B\u0430\u0443\u043B\u044B\u049B, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456\u043D\u0434\u0435 \u04AF\u0448 \u0441\u0430\u0493\u0430\u0442\u0442\u044B\u049B \u0440\u0435\u0436\u0438\u0441\u0441\u0451\u0440\u043B\u0456\u043A \u043D\u04B1\u0441\u049B\u0430."] },
      strong: { communication: ["\u04D8\u04A3\u0433\u0456\u043C\u0435 \u0441\u0456\u0437\u0434\u0435\u0440\u0434\u0456 \u049B\u0430\u0439\u0442\u0430\u0434\u0430\u043D \u0431\u0456\u0440 \u0436\u0430\u049B\u049B\u0430 \u0448\u044B\u0493\u0430\u0440\u0430 \u0430\u043B\u0430\u0434\u044B.", "\u0414\u0430\u0443\u0434\u044B \u043E\u0440\u0442\u0430\u049B \u04D9\u0437\u0456\u043B\u043C\u0435\u043D \u0436\u04D9\u043D\u0435 \u0442\u0430\u043C\u0430\u049B \u0442\u0430\u043F\u0441\u044B\u0440\u044B\u0441\u044B\u043C\u0435\u043D \u0430\u044F\u049B\u0442\u0430\u0439 \u0430\u043B\u0430\u0441\u044B\u0437\u0434\u0430\u0440."], emotions: ["\u049A\u043E\u043B\u0434\u0430\u0443\u0434\u044B \u0431\u0430\u0439\u049B\u0430\u0443 \u0436\u04D9\u043D\u0435 \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u0443 \u043E\u04A3\u0430\u0439\u044B\u0440\u0430\u049B.", "\u042D\u043C\u043E\u0446\u0438\u044F\u043B\u044B\u049B Wi\u2011Fi \u049B\u0430\u0431\u044B\u0440\u0493\u0430 \u043C\u0435\u043D \xAB\u0431\u04D9\u0440\u0456 \u0436\u0430\u049B\u0441\u044B\xBB \u0440\u0435\u0436\u0438\u043C\u0456\u043D\u0435\u043D \u0434\u0435 \u04E9\u0442\u0435\u0434\u0456."], daily: ["\u0422\u04B1\u0440\u043C\u044B\u0441\u0442\u044B\u049B \u043A\u0435\u043B\u0456\u0441\u0456\u043C \u0442\u04B1\u0440\u0430\u049B\u0442\u044B \u0431\u0430\u049B\u044B\u043B\u0430\u0443\u0441\u044B\u0437 \u0436\u04B1\u043C\u044B\u0441 \u0456\u0441\u0442\u0435\u0439 \u0430\u043B\u0430\u0434\u044B.", "\u0420\u0430\u043A\u043E\u0432\u0438\u043D\u0430\u0434\u0430\u0493\u044B \u043A\u0435\u0441\u0435 \u04AF\u0448\u0456\u043D \u0445\u0430\u043B\u044B\u049B\u0430\u0440\u0430\u043B\u044B\u049B \u0441\u043E\u0442 \u0430\u0448\u043F\u0430\u0439-\u0430\u049B \u0442\u04B1\u0440\u043C\u044B\u0441\u0442\u044B \u0431\u04E9\u043B\u0443\u0433\u0435 \u0431\u043E\u043B\u0430\u0434\u044B."], attraction: ["\u049A\u044B\u0437\u044B\u0493\u0443\u0448\u044B\u043B\u044B\u049B \u043F\u0435\u043D \u0436\u0430\u049B\u044B\u043D\u0434\u0430\u0441\u0443 \u0442\u0430\u0431\u0438\u0493\u0438 \u043F\u0430\u0439\u0434\u0430 \u0431\u043E\u043B\u0430\u0434\u044B.", "\u0425\u0438\u043C\u0438\u044F \u0430\u049B\u044B\u043B \u043D\u04B1\u0441\u049B\u0430\u0443\u043B\u044B\u049B\u0442\u044B \u0430\u0448\u049B\u0430\u043D\u0448\u0430 \u0436\u04AF\u043A\u0442\u0435\u043B\u0456\u043F \u04AF\u043B\u0433\u0435\u0440\u0435\u0434\u0456."], pace: ["\u04B0\u049B\u0441\u0430\u0441 \u049B\u0430\u0440\u049B\u044B\u043D \u0431\u0456\u0440-\u0431\u0456\u0440\u0456\u04A3\u0456\u0437\u0434\u0456 \u0430\u0441\u044B\u049B\u0442\u044B\u0440\u043C\u0430\u0443\u0493\u0430 \u043A\u04E9\u043C\u0435\u043A\u0442\u0435\u0441\u0435\u0434\u0456.", "\u0416\u044B\u043B\u0434\u0430\u043C\u0434\u044B\u049B\u0442\u0430\u0440\u044B\u04A3\u044B\u0437 \u04B1\u049B\u0441\u0430\u0441, \u0435\u0448\u043A\u0456\u043C\u0434\u0456 \u043A\u0438\u0456\u043C\u0456\u043D\u0435\u043D \u0441\u04AF\u0439\u0440\u0435\u0443\u0434\u0456\u04A3 \u049B\u0430\u0436\u0435\u0442\u0456 \u0436\u043E\u049B."], repair: ["\u041A\u0435\u0440\u043D\u0435\u0443\u0434\u0435\u043D \u043A\u0435\u0439\u0456\u043D \u0441\u04E9\u0439\u043B\u0435\u0441\u0443\u0433\u0435 \u049B\u0430\u0439\u0442\u0430 \u043E\u0440\u0430\u043B\u0443 \u043E\u04A3\u0430\u0439\u044B\u0440\u0430\u049B.", "\u04B0\u0440\u044B\u0441\u044B\u043F, \u0442\u044B\u043D\u044B\u0448\u0442\u0430\u043B\u044B\u043F, \u04AF\u0448 \u043A\u04AF\u043D\u0434\u0456\u043A \u04AF\u043D\u0441\u0456\u0437\u0434\u0456\u043A \u0441\u0435\u0440\u0438\u0430\u043B\u044B\u043D \u0431\u0430\u0441\u0442\u0430\u043C\u0430\u0439\u0441\u044B\u0437\u0434\u0430\u0440."] },
      friction: { communication: ["\u0411\u0430\u0441\u049B\u0430 \u0430\u0434\u0430\u043C\u043D\u044B\u04A3 \u04AF\u043D\u0456\u043D \u043E\u0439\u0434\u0430\u043D \u049B\u043E\u0441\u043F\u0430\u0439, \u043C\u0430\u0493\u044B\u043D\u0430\u0441\u044B\u043D \u043D\u0430\u049B\u0442\u044B \u0441\u04B1\u0440\u0430\u04A3\u044B\u0437.", "\u041D\u0435\u0433\u0456\u0437\u0433\u0456 \u0436\u0430\u0443 \u2014 \xAB\u0442\u04AF\u0441\u0456\u043D\u0456\u043A\u0442\u0456\xBB \u0434\u0435\u0433\u0435\u043D \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430. \u041E\u043B \u0435\u0448\u049B\u0430\u0448\u0430\u043D \u0436\u0430\u0439 \u0493\u0430\u043D\u0430 \u0442\u04AF\u0441\u0456\u043D\u0456\u043A\u0442\u0456 \u0435\u043C\u0435\u0441."], emotions: ["\u0416\u0430\u049B\u044B\u043D\u0434\u044B\u049B \u043F\u0435\u043D \u0436\u0435\u043A\u0435 \u043A\u0435\u04A3\u0456\u0441\u0442\u0456\u043A\u043A\u0435 \u049B\u0430\u0436\u0435\u0442\u0442\u0456\u043B\u0456\u043A \u04D9\u0440\u0442\u04AF\u0440\u043B\u0456 \u0431\u043E\u043B\u0443\u044B \u043C\u04AF\u043C\u043A\u0456\u043D.", "\u0411\u0456\u0440\u0456 \u049B\u04B1\u0448\u0430\u049B\u0442\u0430\u0493\u044B\u0441\u044B \u043A\u0435\u043B\u0435\u0434\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430\u043D\u044B\u04A3 \u04E9\u0437\u0456 \u0442\u0438\u043C\u0435\u0441\u0435 \u0434\u0435\u0439\u0434\u0456."], daily: ["\u0422\u04D9\u0440\u0442\u0456\u043F \u043F\u0435\u043D \u043C\u0456\u043D\u0434\u0435\u0442 \u0442\u0443\u0440\u0430\u043B\u044B \u043A\u04AF\u0442\u0443\u0434\u0456 \u0430\u043B\u0434\u044B\u043D \u0430\u043B\u0430 \u0430\u0442\u0430\u04A3\u044B\u0437.", "\u041C\u0430\u0445\u0430\u0431\u0431\u0430\u0442 \u043C\u0430\u0445\u0430\u0431\u0431\u0430\u0442\u043F\u0435\u043D, \u0431\u0456\u0440\u0430\u049B \u049B\u043E\u049B\u044B\u0441 \u043F\u0435\u043D \u049B\u0430\u0493\u0430\u0437\u0434\u044B \u0431\u0456\u0440\u0435\u0443 \u0435\u0441\u0456\u043D\u0435 \u0442\u04AF\u0441\u0456\u0440\u0435\u0434\u0456."], attraction: ["\u041A\u04AF\u0448\u0442\u0456 \u0442\u0430\u0440\u0442\u044B\u043B\u044B\u0441 \u0448\u0435\u043A\u0430\u0440\u0430 \u043C\u0435\u043D \u043A\u0435\u043B\u0456\u0441\u0456\u043C\u0434\u0456 \u0430\u043B\u043C\u0430\u0441\u0442\u044B\u0440\u043C\u0430\u0439\u0434\u044B.", "\u0425\u0438\u043C\u0438\u044F \u043C\u044B\u049B\u0442\u044B, \u0431\u0456\u0440\u0430\u049B \u0436\u0430\u043B\u0434\u0430\u0443 \u0430\u049B\u044B\u0441\u044B \u043C\u0435\u043D \u0440\u0435\u043D\u0456\u0448\u0442\u0456 \u0436\u0430\u043B\u0493\u044B\u0437 \u04E9\u0437\u0456 \u0436\u0430\u043F\u043F\u0430\u0439\u0434\u044B."], pace: ["\u0428\u0435\u0448\u0456\u043C \u04D9\u0440\u0442\u04AF\u0440\u043B\u0456 \u0436\u044B\u043B\u0434\u0430\u043C\u0434\u044B\u049B\u043F\u0435\u043D \u043F\u0456\u0441\u0443\u0456 \u043C\u04AF\u043C\u043A\u0456\u043D.", "\u0411\u0456\u0440\u0456 \u0434\u0435\u043C\u0430\u043B\u044B\u0441\u0442\u044B \u0442\u0430\u04A3\u0434\u0430\u043F \u049B\u043E\u0439\u0434\u044B, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u04AF\u0439\u0434\u0435\u043D \u0448\u044B\u0493\u0443\u0493\u0430 \u04D9\u043B\u0456 \u043A\u0435\u043B\u0456\u0441\u043F\u0435\u0434\u0456."], repair: ["\u0416\u0430\u043D\u0436\u0430\u043B\u0434\u0430\u043D \u043A\u0435\u0439\u0456\u043D \u0431\u0456\u0440\u0456 \u0441\u04E9\u0439\u043B\u0435\u0441\u043A\u0456\u0441\u0456, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u04AF\u0437\u0456\u043B\u0456\u0441 \u0430\u043B\u0493\u044B\u0441\u044B \u043A\u0435\u043B\u0435\u0434\u0456.", "\u0411\u0456\u0440\u0456 \u0442\u0430\u0442\u0443\u043B\u0430\u0441\u0443\u0493\u0430 \u0434\u0430\u0439\u044B\u043D, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0434\u0443\u0448\u0442\u0430 \u0434\u0430\u0443\u0434\u044B \u04D9\u043B\u0456 \u0436\u0435\u04A3\u0456\u043F \u0436\u0430\u0442\u044B\u0440."] },
      advice: { communication: ["\u0416\u0430\u0443\u0430\u043F \u0431\u0435\u0440\u043C\u0435\u0439 \u0442\u04B1\u0440\u044B\u043F, \u0431\u0456\u0440-\u0431\u0456\u0440\u0456\u04A3\u0456\u0437\u0434\u0456\u04A3 \u043E\u0439\u044B\u043D \u04E9\u0437 \u0441\u04E9\u0437\u0456\u04A3\u0456\u0437\u0431\u0435\u043D \u049B\u0430\u0439\u0442\u0430\u043B\u0430\u04A3\u044B\u0437.", "\xAB\u04E8\u0437\u0456\u04A3 \u0442\u04AF\u0441\u0456\u043D\u0456\u043F \u0442\u04B1\u0440\u0441\u044B\u04A3\xBB \u0434\u0435\u0433\u0435\u043D \u0441\u04E9\u0437\u0433\u0435 \u0431\u0456\u0440 \u043A\u04AF\u043D \u0442\u044B\u0439\u044B\u043C \u0441\u0430\u043B\u044B\u04A3\u044B\u0437. \u0422\u04AF\u0441\u0456\u043D\u0431\u0435\u0439\u0434\u0456."], emotions: ["\u049A\u0430\u0437\u0456\u0440 \u049B\u043E\u043B\u0434\u0430\u0443, \u043A\u0435\u04A3\u0435\u0441 \u04D9\u043B\u0434\u0435 \u043A\u0435\u04A3\u0456\u0441\u0442\u0456\u043A \u043A\u0435\u0440\u0435\u043A \u043F\u0435 \u0434\u0435\u043F \u0441\u04B1\u0440\u0430\u04A3\u044B\u0437.", "\u04AE\u0448 \u0440\u0435\u0436\u0438\u043C \u0435\u043D\u0433\u0456\u0437\u0456\u04A3\u0456\u0437: \u049B\u04B1\u0448\u0430\u049B\u0442\u0430\u0443, \u0442\u044B\u04A3\u0434\u0430\u0443 \u043D\u0435\u043C\u0435\u0441\u0435 \u0442\u04D9\u0442\u0442\u0456 \u04D9\u043A\u0435\u043B\u0456\u043F, \u0442\u044B\u043D\u044B\u0448\u0442\u044B\u049B \u0431\u0435\u0440\u0443."], daily: ["\u04AE\u0448 \u049B\u0430\u0439\u0442\u0430\u043B\u0430\u043D\u0430\u0442\u044B\u043D \u0456\u0441\u0442\u0456 \u0431\u04E9\u043B\u0456\u043F, \u0431\u0456\u0440 \u0430\u043F\u0442\u0430\u0434\u0430\u043D \u043A\u0435\u0439\u0456\u043D \u043A\u0435\u043B\u0456\u0441\u0456\u043C\u0434\u0456 \u049B\u0430\u0440\u0430\u04A3\u044B\u0437.", "\u0415\u043A\u0456 \u043A\u04E9\u0440\u043F\u0435 \u043C\u0435\u043D \u049B\u043E\u049B\u044B\u0441 \u043A\u0435\u0437\u0435\u0433\u0456 \u0442\u0430\u043B\u0430\u0439 \u043A\u0435\u0448\u0442\u0456 \u049B\u04B1\u0442\u049B\u0430\u0440\u0493\u0430\u043D."], attraction: ["\u0410\u043B\u0493\u0430\u0448\u049B\u044B \u043A\u04AF\u0448\u0442\u0456 \u0441\u0435\u0437\u0456\u043C\u0434\u0456 \u04AF\u043D\u0435\u043C\u0456 \u0441\u043E\u043B \u0434\u0435\u04A3\u0433\u0435\u0439\u0434\u0435 \u04B1\u0441\u0442\u0430\u0443\u0434\u044B \u0442\u0430\u043B\u0430\u043F \u0435\u0442\u043F\u0435\u04A3\u0456\u0437.", "\u041A\u0435\u0439\u0434\u0435 \u0436\u0430\u049B\u0441\u044B \u043A\u0435\u0437\u0434\u0435\u0441\u0443 \u2014 \u0442\u0430\u043C\u0430\u049B, \u0442\u044B\u043D\u044B\u0448\u0442\u044B\u049B \u0436\u04D9\u043D\u0435 \u0442\u04AF\u043D\u0433\u0456 01:40-\u0442\u0430 \u0436\u0438\u043D\u0430\u043B\u044B\u0441 \u0436\u043E\u049B."], pace: ["\u041C\u0430\u04A3\u044B\u0437\u0434\u044B \u0448\u0435\u0448\u0456\u043C\u0433\u0435 \u049B\u0430\u0448\u0430\u043D \u049B\u0430\u0439\u0442\u0430 \u043E\u0440\u0430\u043B\u0430\u0442\u044B\u043D\u044B\u04A3\u044B\u0437\u0434\u044B \u0431\u0435\u043B\u0433\u0456\u043B\u0435\u04A3\u0456\u0437.", "\u0420\u043E\u043C\u0430\u043D\u0442\u0438\u043A\u0430\u0493\u0430 \u0434\u0430 \u043C\u0435\u0440\u0437\u0456\u043C \u049B\u043E\u0439\u044B\u04A3\u044B\u0437: \u0431\u0456\u0440\u0456 \u0431\u0456\u0440\u0433\u0435 \u0442\u04B1\u0440\u044B\u043F \u0436\u0430\u0442\u044B\u0440, \u0435\u043A\u0456\u043D\u0448\u0456\u0441\u0456 \u0436\u0430\u0443\u0430\u043F \u0442\u0435\u0440\u0456\u043F \u043E\u0442\u044B\u0440."], repair: ["\u04AE\u0437\u0456\u043B\u0456\u0441 \u049B\u0430\u043D\u0448\u0430 \u0441\u043E\u0437\u044B\u043B\u0430\u0442\u044B\u043D\u044B\u043D \u0436\u04D9\u043D\u0435 \u04D9\u04A3\u0433\u0456\u043C\u0435\u043D\u0456 \u043A\u0456\u043C \u0431\u0430\u0441\u0442\u0430\u0439\u0442\u044B\u043D\u044B\u043D \u043A\u0435\u043B\u0456\u0441\u0456\u04A3\u0456\u0437.", "\u04B0\u0440\u044B\u0441\u0443\u0493\u0430 \u0431\u043E\u043B\u0430\u0434\u044B. \u049A\u0430\u0439\u0442\u0443 \u0443\u0430\u049B\u044B\u0442\u044B\u043D \u0430\u0439\u0442\u043F\u0430\u0439 \u0436\u043E\u0493\u0430\u043B\u0443 \u2014 \u043D\u0430\u0448\u0430\u0440 \u0441\u0435\u0440\u0438\u0430\u043B."] }
    },
    fr: {
      ui: { normal: "\u{1F607} Pos\xE9ment", humor: "\u{1F3AD} Avec humour", toneLabel: "Comment raconter le r\xE9sultat", locked: "Votre verdict principal est pr\xEAt", unlock: "R\xE9v\xE9ler le verdict", unlocked: "Verdict r\xE9v\xE9l\xE9", strength: "Ce qui vous rapproche", friction: "L\xE0 o\xF9 \xE7a peut grincer", advice: "Ce qui aide vraiment", details: "Touchez une dimension pour comprendre la note", why: "Pourquoi ce r\xE9sultat", sharePair: "Partager notre r\xE9sultat", shareSafe: "Le lien contient les pr\xE9noms et le r\xE9sultat final. Les dates de naissance ne sont pas partag\xE9es.", shareSafeSolo: "Le lien contient le pr\xE9nom, le signe et le classement final. La date de naissance n\u2019est pas partag\xE9e.", rankOpen: "Ouvrir l\u2019explication", rankWhy: "Pourquoi \xE7a fonctionne", rankRisk: "Point de friction possible", rankTip: "Ce qui aide" },
      bands: { fragile: { normal: ["Deux mani\xE8res tr\xE8s diff\xE9rentes de cr\xE9er de la proximit\xE9", "Une combinaison qui demande des accords clairs"], humor: ["Le mode d\u2019emploi de ce duo d\xE9passe le contrat de cr\xE9dit", "Il y a de l\u2019attirance, mais les r\xE9glages viennent de deux bo\xEEtes diff\xE9rentes"] }, contrast: { normal: ["Des diff\xE9rences nettes, mais g\xE9rables", "Un duo contrast\xE9 avec quelques conditions importantes"], humor: ["\xC7a peut marcher, mais pr\xE9voyez le support technique", "Mode compatibilit\xE9 : \xAB attends, je r\xE9explique \xBB"] }, sparks: { normal: ["Le contact existe, le rythme reste \xE0 accorder", "Un duo vivant avec une belle marge de progression"], humor: ["Des \xE9tincelles : parfois la chimie, parfois le court-circuit", "Int\xE9r\xEAt mutuel d\xE9tect\xE9, mode d\u2019emploi introuvable"] }, workable: { normal: ["Une bonne base si les diff\xE9rences sont dites", "Une combinaison stable qui peut encore s\u2019ajuster"], humor: ["Bien coll\xE9s, \xE9vitez juste le crash-test m\xE9nager quotidien", "Le duo fonctionne, quelques bugs sont d\xE9j\xE0 connus"] }, strong: { normal: ["Une combinaison forte et beaucoup de compr\xE9hension", "De nombreux points d\u2019accord naturels"], humor: ["Deux chaussures de la m\xEAme paire, chaussette perdue comprise", "L\u2019un imagine une id\xE9e \xE9trange, l\u2019autre l\u2019a d\xE9j\xE0 mise au panier"] }, close: { normal: ["Un rythme tr\xE8s proche et un soutien visible", "Une compatibilit\xE9 de caract\xE8res rarement aussi confortable"], humor: ["M\xEAme en poussant, personne ne part tr\xE8s loin", "Vous pouvez scroller en silence et appeler \xE7a un rendez-vous r\xE9ussi"] }, rare: { normal: ["Une combinaison particuli\xE8rement coh\xE9rente dans ces traditions", "Un rythme symbolique exceptionnellement proche"], humor: ["Connect\xE9s au Wi\u2011Fi cosmique", "Compatibilit\xE9 suspecte : v\xE9rifiez la lecture de pens\xE9e"] } },
      elements: { air_air: ["Vous aimez tous les deux les \xE9changes, la libert\xE9 et les id\xE9es.", "Deux g\xE9n\xE9rateurs d\u2019id\xE9es : beaucoup d\u2019onglets, peu d\u2019ennui."], air_fire: ["Le feu lance l\u2019action, l\u2019air nourrit les id\xE9es et l\u2019\xE9lan.", "L\u2019un allume, l\u2019autre souffle : prot\xE9gez le calendrier commun."], air_earth: ["L\u2019un cherche les options, l\u2019autre la fiabilit\xE9 et le concret.", "L\u2019un construit un ch\xE2teau en l\u2019air, l\u2019autre demande le devis."], air_water: ["La logique et l\u2019\xE9motion parlent deux dialectes qui peuvent s\u2019enrichir.", "L\u2019un explique par la logique, l\u2019autre lit la pause entre deux messages."], fire_fire: ["Le rythme est \xE9lev\xE9, l\u2019initiative partag\xE9e et la comp\xE9tition rapide.", "Deux moteurs, un volant, aucune envie de ralentir."], earth_fire: ["L\u2019initiative rencontre le pragmatisme quand la vitesse est n\xE9goci\xE9e.", "L\u2019un d\xE9marre, l\u2019autre v\xE9rifie la garantie et les papiers."], fire_water: ["La franchise et la sensibilit\xE9 cr\xE9ent une forte attirance \xE0 manier avec soin.", "L\u2019un parle franchement, l\u2019autre entend trois sens cach\xE9s."], earth_earth: ["La fiabilit\xE9, les plans clairs et les actes comptent beaucoup.", "La romance planifi\xE9e reste romantique quand la table est r\xE9serv\xE9e."], earth_water: ["Le concret stabilise l\u2019\xE9motion, qui donne en retour de la profondeur.", "L\u2019un apporte un plaid, l\u2019autre explique pourquoi il est vital maintenant."], water_water: ["La sensibilit\xE9 est forte et l\u2019humeur devient vite commune.", "L\u2019un soupire, l\u2019autre conna\xEEt d\xE9j\xE0 l\u2019histoire, la cause et la fin."] },
      numberRelations: { same: ["Des nombres proches donnent des r\xE9actions et d\xE9cisions famili\xE8res.", "R\xE9glages similaires : compr\xE9hension silencieuse ou ent\xEAtement synchronis\xE9."], near: ["Les r\xF4les num\xE9riques trouvent assez vite une fa\xE7on commune d\u2019agir.", "M\xEAme m\xE9canique, boutons plac\xE9s un peu diff\xE9remment."], mixed: ["Les nombres proposent des r\xF4les diff\xE9rents mais compl\xE9mentaires.", "L\u2019un ouvre la qu\xEAte, l\u2019autre sait d\xE9j\xE0 o\xF9 se trouve la cl\xE9."], contrast: ["Les r\xF4les diff\xE8rent et demandent des attentes explicites.", "L\u2019un a une notice d\u2019une page, l\u2019autre la version longue de trois heures."] },
      strong: { communication: ["Le dialogue peut facilement vous remettre du m\xEAme c\xF4t\xE9.", "Un d\xE9bat peut finir en blague commune et commande de repas."], emotions: ["Le soutien est plus facile \xE0 voir et \xE0 recevoir.", "Le Wi\u2011Fi \xE9motionnel traverse m\xEAme le mur du \xAB tout va bien \xBB."], daily: ["Les accords du quotidien peuvent fonctionner sans surveillance constante.", "Le m\xE9nage peut se partager sans proc\xE8s international pour une tasse."], attraction: ["L\u2019int\xE9r\xEAt et l\u2019envie de proximit\xE9 apparaissent naturellement.", "La chimie d\xE9marre avant que la raison ouvre la notice."], pace: ["Un rythme proche r\xE9duit la sensation de pousser ou freiner l\u2019autre.", "Vous avancez \xE0 la m\xEAme vitesse, personne ne tire l\u2019autre par la capuche."], repair: ["Apr\xE8s une tension, le contact revient plus facilement.", "Vous pouvez vous disputer sans lancer une s\xE9rie de trois jours de silence."] },
      friction: { communication: ["Ne devinez pas le ton de l\u2019autre : demandez le sens.", "L\u2019ennemi principal est \xAB d\u2019accord \xBB. Il veut rarement dire seulement d\u2019accord."], emotions: ["Le besoin de proximit\xE9 et d\u2019espace personnel peut diff\xE9rer.", "L\u2019un veut un c\xE2lin, l\u2019autre ne veut m\xEAme plus \xEAtre touch\xE9 par les notifications."], daily: ["Parlez t\xF4t des attentes sur l\u2019ordre et les responsabilit\xE9s.", "L\u2019amour est l\xE0, mais quelqu\u2019un doit penser aux poubelles."], attraction: ["Une forte chimie ne remplace ni les limites ni les accords.", "La chimie est belle, mais elle ne paie pas le loyer ni toutes les blessures."], pace: ["Les d\xE9cisions peuvent m\xFBrir \xE0 des vitesses diff\xE9rentes.", "L\u2019un a choisi les vacances, l\u2019autre n\u2019a pas accept\xE9 de sortir."], repair: ["Apr\xE8s un conflit, l\u2019un cherche le dialogue et l\u2019autre une pause.", "L\u2019un veut se r\xE9concilier, l\u2019autre gagne encore la dispute sous la douche."] },
      advice: { communication: ["Reformulez la pens\xE9e de l\u2019autre avant de r\xE9pondre.", "Interdisez \xAB tu sais tr\xE8s bien \xBB pendant une journ\xE9e. Non, pas toujours."], emotions: ["Demandez : soutien, conseil ou espace maintenant ?", "Trois modes : enlacer, \xE9couter, ou reculer avec quelque chose de bon."], daily: ["Partagez trois t\xE2ches r\xE9currentes et revoyez l\u2019accord dans une semaine.", "Deux couvertures et un tour de poubelle clair sauvent bien des soir\xE9es."], attraction: ["N\u2019exigez pas que l\u2019intensit\xE9 du d\xE9but reste toujours maximale.", "Parfois un bon rendez-vous, c\u2019est manger en paix sans sommet \xE0 1 h 40."], pace: ["Fixez le moment o\xF9 vous reprendrez une d\xE9cision importante.", "M\xEAme la romance a besoin d\u2019un d\xE9lai : l\u2019un a emm\xE9nag\xE9 en pens\xE9e, l\u2019autre \xE9crit."], repair: ["D\xE9cidez combien dure une pause et qui relance la discussion.", "Se disputer arrive. Dispara\xEEtre sans heure de retour, c\u2019est une mauvaise s\xE9rie."] }
    }
  };
  var pick = (items, index) => items[index % items.length];
  var fill = (text, values) => Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), text);
  var numberRelation = (pair) => {
    const [a, b] = pair.split("_").map(Number), distance = Math.abs(a - b);
    return distance === 0 ? "same" : distance <= 2 ? "near" : distance >= 5 ? "contrast" : "mixed";
  };
  function narrativeUi(lang2) {
    return (COPY[lang2] || COPY.ru).ui;
  }
  function buildPairNarrative(result, names, lang2 = "ru", tone2 = "humor") {
    const C = COPY[lang2] || COPY.ru, style = tone2 === "normal" ? 0 : 1, ctx = result.context;
    const band = C.bands[ctx.band][tone2] || C.bands[ctx.band].normal;
    const element = C.elements[ctx.elementPair] || C.elements.air_earth;
    const relation = C.numberRelations[numberRelation(ctx.consciousnessPair)];
    const values = { a: names[0], b: names[1] };
    return {
      tone: tone2,
      headline: fill(pick(band, ctx.variants.headline), values),
      element: element[style],
      numbers: relation[style],
      strength: C.strong[ctx.strongest][style],
      friction: C.friction[ctx.attention][style],
      advice: C.advice[ctx.attention][style],
      share: lang2 === "ru" ? `${names[0]} + ${names[1]} \u2014 ${result.overall}%. \u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u0432\u0435\u0440\u0434\u0438\u043A\u0442 \u043B\u0443\u0447\u0448\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435.` : lang2 === "kk" ? `${names[0]} + ${names[1]} \u2014 ${result.overall}%. \u041D\u0435\u0433\u0456\u0437\u0433\u0456 \u049B\u043E\u0440\u044B\u0442\u044B\u043D\u0434\u044B\u043D\u044B \u04E9\u0437\u0456\u04A3 \u043A\u04E9\u0440.` : lang2 === "fr" ? `${names[0]} + ${names[1]} : ${result.overall} %. Le verdict vaut le d\xE9tour.` : `${names[0]} + ${names[1]} \u2014 ${result.overall}%. You should see the main verdict yourself.`
    };
  }
  function buildRankingDetail(item, lang2 = "ru", tone2 = "normal") {
    const C = COPY[lang2] || COPY.ru, style = tone2 === "normal" ? 0 : 1;
    return { why: C.strong[item.strongest][style], risk: C.friction[item.attention][style], tip: C.advice[item.attention][style] };
  }

  // loader-overlay.js?v=1116
  var COPY2 = {
    ru: {
      title: "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0432\u0430\u0448 \u0440\u0430\u0437\u0431\u043E\u0440",
      local: "\u0420\u0430\u0441\u0447\u0451\u0442 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435",
      horoscope: ["\u0421\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u043C \u0430\u0441\u0442\u0440\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u043C\u0430\u0442\u0440\u0438\u0446\u0443\u2026", "\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u043A\u0430\u0440\u0442\u044B \u043D\u0435\u0431\u0430\u2026", "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u2026"],
      syutsai: ["\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0447\u0438\u0441\u043B\u043E\u0432\u044B\u0435 \u043A\u043E\u0434\u044B \u0421\u044E\u0446\u0430\u0439\u2026", "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u043B\u0438\u0447\u043D\u044B\u0435 \u0446\u0438\u043A\u043B\u044B \u043D\u0435\u0434\u0435\u043B\u0438\u2026", "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u043F\u043E\u043D\u044F\u0442\u043D\u044B\u0439 \u0440\u0430\u0437\u0431\u043E\u0440\u2026"],
      numerology: ["\u0421\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u043C \u043E\u0442\u0432\u0435\u0442\u044B \u0442\u0435\u0441\u0442\u0430\u2026", "\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0447\u0438\u0441\u043B\u043E \u0434\u0430\u0442\u044B\u2026", "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u043A\u0430\u0440\u044C\u0435\u0440\u043D\u044B\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C\u2026"],
      dreams: ["\u0421\u043E\u0435\u0434\u0438\u043D\u044F\u0435\u043C \u0434\u0435\u0442\u0430\u043B\u0438 \u0441\u043D\u0430\u2026", "\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0442\u0440\u0438 \u0442\u0440\u0430\u0434\u0438\u0446\u0438\u0438\u2026", "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u043B\u0438\u0447\u043D\u043E\u0435 \u0442\u043E\u043B\u043A\u043E\u0432\u0430\u043D\u0438\u0435\u2026"],
      compatibility: ["\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0437\u043D\u0430\u043A\u0438 \u0437\u043E\u0434\u0438\u0430\u043A\u0430\u2026", "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u0447\u0438\u0441\u0435\u043B \u0421\u044E\u0446\u0430\u0439\u2026", "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0440\u0430\u0437\u0431\u043E\u0440 \u0432\u0430\u0448\u0435\u0439 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438\u2026"]
    },
    kk: {
      title: "\u0422\u0430\u043B\u0434\u0430\u0443\u044B\u04A3\u044B\u0437\u0434\u044B \u0436\u0438\u043D\u0430\u043F \u0436\u0430\u0442\u044B\u0440\u043C\u044B\u0437",
      local: "\u0415\u0441\u0435\u043F \u043E\u0441\u044B \u049B\u04B1\u0440\u044B\u043B\u0493\u044B\u0434\u0430 \u043E\u0440\u044B\u043D\u0434\u0430\u043B\u0430\u0434\u044B",
      horoscope: ["\u0410\u0441\u0442\u0440\u043E\u043B\u043E\u0433\u0438\u044F\u043B\u044B\u049B \u043C\u0430\u0442\u0440\u0438\u0446\u0430\u043D\u044B \u043E\u049B\u044B\u043F \u0436\u0430\u0442\u044B\u0440\u043C\u044B\u0437\u2026", "\u0410\u0441\u043F\u0430\u043D \u043A\u0430\u0440\u0442\u0430\u0441\u044B\u043D\u044B\u04A3 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0442\u0430\u0440\u044B\u043D \u0441\u0430\u043B\u044B\u0441\u0442\u044B\u0440\u0430\u043C\u044B\u0437\u2026", "\u0416\u0435\u043A\u0435 \u0431\u043E\u043B\u0436\u0430\u043C\u0434\u044B \u0436\u0438\u043D\u0430\u0439\u043C\u044B\u0437\u2026"],
      syutsai: ["\u0421\u044E\u0446\u0430\u0439 \u0441\u0430\u043D\u0434\u044B\u049B \u043A\u043E\u0434\u0442\u0430\u0440\u044B\u043D \u0441\u0430\u043B\u044B\u0441\u0442\u044B\u0440\u0430\u043C\u044B\u0437\u2026", "\u0410\u043F\u0442\u0430\u043D\u044B\u04A3 \u0436\u0435\u043A\u0435 \u0446\u0438\u043A\u043B\u0434\u0435\u0440\u0456\u043D \u0442\u0435\u043A\u0441\u0435\u0440\u0435\u043C\u0456\u0437\u2026", "\u0422\u04AF\u0441\u0456\u043D\u0456\u043A\u0442\u0456 \u0442\u0430\u043B\u0434\u0430\u0443\u0434\u044B \u0436\u0438\u043D\u0430\u0439\u043C\u044B\u0437\u2026"],
      numerology: ["\u0422\u0435\u0441\u0442 \u0436\u0430\u0443\u0430\u043F\u0442\u0430\u0440\u044B\u043D \u043E\u049B\u0438\u043C\u044B\u0437\u2026", "\u041A\u04AF\u043D \u0441\u0430\u043D\u044B\u043D \u0441\u0430\u043B\u044B\u0441\u0442\u044B\u0440\u0430\u043C\u044B\u0437\u2026", "\u041C\u0430\u043D\u0441\u0430\u043F \u043F\u0440\u043E\u0444\u0438\u043B\u0456\u043D \u0436\u0438\u043D\u0430\u0439\u043C\u044B\u0437\u2026"],
      dreams: ["\u0422\u04AF\u0441 \u0434\u0435\u0442\u0430\u043B\u044C\u0434\u0435\u0440\u0456\u043D \u0431\u0456\u0440\u0456\u043A\u0442\u0456\u0440\u0435\u043C\u0456\u0437\u2026", "\u04AE\u0448 \u0434\u04D9\u0441\u0442\u04AF\u0440\u0434\u0456 \u0441\u0430\u043B\u044B\u0441\u0442\u044B\u0440\u0430\u043C\u044B\u0437\u2026", "\u0416\u0435\u043A\u0435 \u0436\u043E\u0440\u0443\u0434\u044B \u0436\u0438\u043D\u0430\u0439\u043C\u044B\u0437\u2026"],
      compatibility: ["\u0417\u043E\u0434\u0438\u0430\u043A \u0431\u0435\u043B\u0433\u0456\u043B\u0435\u0440\u0456\u043D \u0441\u0430\u043B\u044B\u0441\u0442\u044B\u0440\u0430\u043C\u044B\u0437\u2026", "\u0421\u044E\u0446\u0430\u0439 \u0441\u0430\u043D\u0434\u0430\u0440\u044B\u043D\u044B\u04A3 \u04AF\u0439\u043B\u0435\u0441\u0456\u043C\u0456\u043D \u0442\u0435\u043A\u0441\u0435\u0440\u0435\u043C\u0456\u0437\u2026", "\u04AE\u0439\u043B\u0435\u0441\u0456\u043C\u0434\u0456\u043B\u0456\u043A \u0442\u0430\u043B\u0434\u0430\u0443\u044B\u043D \u0436\u0438\u043D\u0430\u0439\u043C\u044B\u0437\u2026"]
    },
    en: {
      title: "Assembling your reading",
      local: "The calculation runs on this device",
      horoscope: ["Reading the astrological matrix\u2026", "Matching the sky-chart coordinates\u2026", "Assembling your personal forecast\u2026"],
      syutsai: ["Matching the Syutsai number codes\u2026", "Checking your weekly cycles\u2026", "Assembling a clear reading\u2026"],
      numerology: ["Reading your quiz answers\u2026", "Matching the birth-date number\u2026", "Assembling your career profile\u2026"],
      dreams: ["Connecting the dream details\u2026", "Comparing three traditions\u2026", "Assembling your personal interpretation\u2026"],
      compatibility: ["Matching your zodiac signs\u2026", "Checking your Syutsai number pairing\u2026", "Assembling your compatibility reading\u2026"]
    },
    fr: {
      title: "Cr\xE9ation de votre analyse",
      local: "Le calcul s\u2019effectue sur cet appareil",
      horoscope: ["Lecture de la matrice astrologique\u2026", "Comparaison des coordonn\xE9es du ciel\u2026", "Cr\xE9ation de votre pr\xE9vision personnelle\u2026"],
      syutsai: ["Comparaison des codes num\xE9riques Syutsai\u2026", "V\xE9rification de vos cycles de la semaine\u2026", "Cr\xE9ation d\u2019une analyse claire\u2026"],
      numerology: ["Lecture de vos r\xE9ponses\u2026", "Comparaison du nombre de naissance\u2026", "Cr\xE9ation de votre profil professionnel\u2026"],
      dreams: ["Connexion des d\xE9tails du r\xEAve\u2026", "Comparaison de trois traditions\u2026", "Cr\xE9ation de votre interpr\xE9tation personnelle\u2026"],
      compatibility: ["Comparaison de vos signes du zodiaque\u2026", "V\xE9rification des nombres Syutsai\u2026", "Cr\xE9ation de votre analyse de compatibilit\xE9\u2026"]
    }
  };
  var activeLoader = null;
  function installStyles() {
    if (document.getElementById("calculation-loader-styles")) return;
    const style = document.createElement("style");
    style.id = "calculation-loader-styles";
    style.textContent = `
    .calculation-overlay{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 30%,#372274 0,#111027 46%,#080712 100%);color:#fff;text-align:center;opacity:1;transition:opacity .28s;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.calculation-overlay.closing{opacity:0}.calculation-loader-card{width:min(520px,100%);padding:26px 20px;border:1px solid #ffffff20;border-radius:30px;background:#17142bd9;box-shadow:0 35px 100px #000b;backdrop-filter:blur(18px)}.calculation-canvas{display:block;width:min(320px,78vw);height:min(320px,78vw);margin:auto}.calculation-loader-card h2{margin:4px 0 8px;font-size:clamp(1.65rem,6vw,2.35rem);letter-spacing:-.04em}.calculation-status{min-height:48px;margin:0;color:#d8d0ec;font-size:1rem;line-height:1.5}.calculation-local{display:inline-flex;margin-top:12px;padding:7px 10px;border-radius:999px;background:#ffffff0d;color:#aaa2c2;font-size:.76rem;font-weight:800}.calculation-dots{display:flex;justify-content:center;gap:7px;margin:13px 0 0}.calculation-dots i{width:7px;height:7px;border-radius:50%;background:#6655aa}.calculation-dots i.active{background:#f1c86f;box-shadow:0 0 18px #f1c86f}.calculation-reveal>*{animation:calculation-rise .55s both}.calculation-reveal>*:nth-child(2){animation-delay:.08s}.calculation-reveal>*:nth-child(3){animation-delay:.16s}.calculation-reveal>*:nth-child(4){animation-delay:.24s}.calculation-typewriter::after{content:'\u258D';color:#735cff;animation:calculation-caret .7s step-end infinite}@keyframes calculation-rise{from{opacity:0;transform:translateY(14px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}@keyframes calculation-caret{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.calculation-reveal>*{animation:none}.calculation-typewriter::after{display:none}}
  `;
    document.head.appendChild(style);
  }
  function makeOverlay(copy2) {
    const overlay = document.createElement("div");
    overlay.className = "calculation-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `<section class="calculation-loader-card"><canvas class="calculation-canvas" aria-hidden="true"></canvas><h2>${copy2.title}</h2><p class="calculation-status"></p><div class="calculation-dots"><i class="active"></i><i></i><i></i></div><span class="calculation-local">\u{1F512} ${copy2.local}</span></section>`;
    return overlay;
  }
  function rotate4([x, y, z, w], angle) {
    let c = Math.cos(angle), s = Math.sin(angle);
    [x, w] = [x * c - w * s, x * s + w * c];
    c = Math.cos(angle * 0.73);
    s = Math.sin(angle * 0.73);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(angle * 0.41);
    s = Math.sin(angle * 0.41);
    [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z, w];
  }
  function animateScanner(canvas) {
    const context = canvas.getContext("2d");
    const vertices = Array.from({ length: 16 }, (_, index) => [index & 1 ? 1 : -1, index & 2 ? 1 : -1, index & 4 ? 1 : -1, index & 8 ? 1 : -1]);
    const edges = [];
    for (let a = 0; a < 16; a++) for (let b = a + 1; b < 16; b++) if (((a ^ b) & (a ^ b) - 1) === 0) edges.push([a, b]);
    const particles = Array.from({ length: 42 }, (_, index) => ({ a: index * 2.399, r: 65 + index % 7 * 13, s: 0.25 + index % 5 * 0.08, o: 0.18 + index % 4 * 0.1 }));
    let frame = 0, stopped = false;
    const draw = (time) => {
      if (stopped) return;
      const size = Math.min(360, innerWidth * 0.78), dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(size * dpr)) {
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, size, size);
      const center = size / 2, t = time / 1e3;
      for (const particle of particles) {
        const a = particle.a + t * particle.s, x = center + Math.cos(a) * particle.r, y = center + Math.sin(a * 1.19) * particle.r * 0.72;
        context.fillStyle = `rgba(164,133,255,${particle.o})`;
        context.beginPath();
        context.arc(x, y, 1.1 + particle.r % 3, 0, Math.PI * 2);
        context.fill();
      }
      const points = vertices.map((point) => {
        const [x, y, z, w] = rotate4(point, t * 0.8);
        const p4 = 2.7 / (3.5 - w);
        const X = x * p4, Y = y * p4, Z = z * p4;
        const p3 = 3.8 / (5 - Z);
        return [center + X * p3 * 66, center + Y * p3 * 66, Z];
      });
      context.lineWidth = 1.5;
      context.shadowBlur = 15;
      context.shadowColor = "#9d7cff";
      edges.forEach(([a, b], index) => {
        const alpha = 0.25 + (index + frame) % 9 / 16;
        const gradient = context.createLinearGradient(points[a][0], points[a][1], points[b][0], points[b][1]);
        gradient.addColorStop(0, `rgba(112,91,255,${alpha})`);
        gradient.addColorStop(1, `rgba(242,184,219,${alpha})`);
        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(points[a][0], points[a][1]);
        context.lineTo(points[b][0], points[b][1]);
        context.stroke();
      });
      context.shadowBlur = 10;
      points.forEach((point, index) => {
        context.fillStyle = index % 3 ? "#b7a5ff" : "#f2ca72";
        context.beginPath();
        context.arc(point[0], point[1], 2.2, 0, Math.PI * 2);
        context.fill();
      });
      context.shadowBlur = 0;
      frame++;
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    return () => {
      stopped = true;
    };
  }
  async function runCalculationLoader({ kind = "horoscope", lang: lang2 = "ru", duration = 3e3 } = {}) {
    var _a2, _b;
    installStyles();
    (_a2 = document.querySelector(".calculation-overlay")) == null ? void 0 : _a2.remove();
    const code = COPY2[lang2] ? lang2 : "ru", copy2 = COPY2[code], statuses = (_b = copy2[kind]) != null ? _b : copy2.horoscope;
    const overlay = makeOverlay(copy2), status = overlay.querySelector(".calculation-status"), dots = [...overlay.querySelectorAll(".calculation-dots i")];
    document.body.appendChild(overlay);
    const stop = animateScanner(overlay.querySelector("canvas"));
    let index = 0;
    status.textContent = statuses[index];
    const timer = setInterval(() => {
      index = Math.min(index + 1, statuses.length - 1);
      status.textContent = statuses[index];
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    }, 800);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await new Promise((resolve) => setTimeout(resolve, reduced ? 450 : duration));
    clearInterval(timer);
    stop();
    overlay.classList.add("closing");
    await new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 280));
    overlay.remove();
  }
  function showCalculationLoader(options = {}) {
    if (activeLoader) return activeLoader;
    activeLoader = runCalculationLoader(options).finally(() => {
      activeLoader = null;
    });
    return activeLoader;
  }
  function revealCalculatedResult(root) {
    if (!root) return;
    installStyles();
    root.classList.add("calculation-reveal");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = root.querySelector("[data-typewriter], h1");
    if (!target || target.dataset.typed === "1") return;
    const value = target.textContent.trim();
    if (!value) return;
    target.dataset.typed = "1";
    target.setAttribute("aria-label", value);
    target.textContent = "";
    target.classList.add("calculation-typewriter");
    let index = 0;
    const step = () => {
      index = Math.min(value.length, index + Math.max(1, Math.ceil(value.length / 28)));
      target.textContent = value.slice(0, index);
      if (index < value.length) setTimeout(step, 24);
      else setTimeout(() => target.classList.remove("calculation-typewriter"), 350);
    };
    step();
  }

  // compatibility/app.js
  var _a;
  var ONLINE = ((_a = globalThis.PT_CONFIG) == null ? void 0 : _a.onlineRoot) || new URL("../", location.href).href;
  var supported = ["ru", "kk", "en", "fr"];
  var browserLang = (navigator.language || "ru").toLowerCase().split("-")[0];
  var lang = localStorage.getItem("pt.lang") || (supported.includes(browserLang) ? browserLang : "ru");
  var tone = localStorage.getItem("pt.compatibility.tone") || "humor";
  if (!["normal", "humor"].includes(tone)) tone = "humor";
  var L;
  var mode = "pair";
  var resultData = null;
  var verdictRevealed = false;
  var glyph = { aries: "\u2648", taurus: "\u2649", gemini: "\u264A", cancer: "\u264B", leo: "\u264C", virgo: "\u264D", libra: "\u264E", scorpio: "\u264F", sagittarius: "\u2650", capricorn: "\u2651", aquarius: "\u2652", pisces: "\u2653" };
  var enc = (value) => btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  var dec = (value) => {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(value.replaceAll("-", "+").replaceAll("_", "/")))));
    } catch (e) {
      return null;
    }
  };
  var shared = dec(location.hash.startsWith("#r=") ? location.hash.slice(3) : "");
  if (!["pair", "solo"].includes(shared == null ? void 0 : shared.mode)) shared = null;
  if (shared && supported.includes(shared.lang)) lang = shared.lang;
  if (shared && ["normal", "humor"].includes(shared.tone)) tone = shared.tone;
  var $ = (selector) => document.querySelector(selector);
  var app = $("#app");
  var load = async (code) => {
    try {
      return await fetch(`locales/${code}.json?v=1116`, { cache: "no-store" }).then((response) => response.json());
    } catch (e) {
      return fetch("locales/ru.json?v=1116", { cache: "no-store" }).then((response) => response.json());
    }
  };
  var f = (template, values = {}) => Object.entries(values).reduce((value, [key, replacement]) => value.replaceAll(`{${key}}`, replacement), template);
  var esc = (value) => String(value != null ? value : "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  var cleanName = (value) => String(value || "").trim().replace(/\s+/g, " ").slice(0, 32);
  var ui = () => narrativeUi(lang);
  function track(name, extra = {}) {
    var _a2, _b;
    (_b = (_a2 = globalThis.ptAnalytics) == null ? void 0 : _a2.track) == null ? void 0 : _b.call(_a2, name, { module_id: "compatibility", ...extra });
  }
  function shell(body) {
    app.innerHTML = `<header class="top"><a class="brand" href="../index.html"><span class="mark">P</span><span>${L.app}</span></a><div class="tools"><a class="home" href="../index.html">\u2302 ${L.home}</a><select id="lang" aria-label="${L.language}">${supported.map((code) => `<option>${code.toUpperCase()}</option>`).join("")}</select></div></header>${body}`;
    $("#lang").value = lang.toUpperCase();
    $("#lang").onchange = async (event) => {
      lang = event.target.value.toLowerCase();
      localStorage.setItem("pt.lang", lang);
      document.documentElement.lang = lang;
      L = await load(lang);
      render();
    };
  }
  function hero() {
    return `<section class="panel hero"><span class="badge">${L.badge}</span><h1>${L.title}</h1><p>${L.intro}</p><div class="hero-facts"><span>\u{1F512} ${L.factLocal}</span><span>\u2726 ${L.factLayers}</span><span>\u2713 ${L.factScience}</span></div></section>`;
  }
  function research() {
    return `<section class="panel research"><div class="eyebrow">${L.researchKicker}</div><h2>${L.researchTitle}</h2><p>${L.researchIntro}</p><div class="fact"><b>10M+</b><div><strong>${L.voasTitle}</strong><p>${L.voasText}</p></div></div><div class="fact"><b>65K+</b><div><strong>${L.swedenTitle}</strong><p>${L.swedenText}</p></div></div><div class="fact"><b>\u2194</b><div><strong>${L.realTitle}</strong><p>${L.realText}</p></div></div><details><summary>${L.sources}</summary><ul><li><a href="https://magonia.com/wp-content/uploads/2018/04/voas-astrology.pdf" target="_blank" rel="noopener">${L.sourceVoas}</a></li><li><a href="https://link.springer.com/article/10.1186/s41118-020-00103-5" target="_blank" rel="noopener">${L.sourceSweden}</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4298140/" target="_blank" rel="noopener">${L.sourceCommunication}</a></li></ul></details><p class="disclaimer">${L.researchLimit}</p></section>`;
  }
  function personForm(prefix, title, stored = {}) {
    const person = stored && typeof stored === "object" ? stored : {};
    return `<section class="person"><h2>${title}</h2><div class="field"><label for="${prefix}-name">${L.name}</label><input id="${prefix}-name" maxlength="32" autocomplete="off" placeholder="${L.namePlaceholder}" value="${esc(person.name || "")}"><small>${L.nameHint}</small></div><div class="field"><label for="${prefix}-birth">${L.birth} *</label><input id="${prefix}-birth" type="date" max="${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}" value="${esc(person.birth || "")}"></div></section>`;
  }
  function intro() {
    const saved = (() => {
      try {
        const value = JSON.parse(localStorage.getItem("pt.compatibility.form") || "{}");
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
      } catch (e) {
        return {};
      }
    })();
    shell(`${hero()}<div class="tabs"><button class="tab ${mode === "pair" ? "active" : ""}" data-mode="pair">\u2661 ${L.pairMode}</button><button class="tab ${mode === "solo" ? "active" : ""}" data-mode="solo">\u2726 ${L.soloMode}</button></div><section class="panel form-panel">${mode === "pair" ? `<div class="form-grid">${personForm("a", L.personA, saved.a)}${personForm("b", L.personB, saved.b)}</div><div class="vs">${L.vs}</div>` : personForm("a", L.yourProfile, saved.a)}<div class="honesty">\u{1F4A1} ${L.honesty}</div><div class="privacy">\u{1F512} ${L.privacy}</div><button class="primary wide" id="calculate">${mode === "pair" ? L.calculatePair : L.calculateSolo}</button></section>${research()}`);
    document.querySelectorAll(".tab").forEach((button) => button.onclick = () => {
      mode = button.dataset.mode;
      render();
    });
    $("#calculate").onclick = calculate;
  }
  async function calculate() {
    const a = { name: cleanName($("#a-name").value), birth: $("#a-birth").value };
    const b = mode === "pair" ? { name: cleanName($("#b-name").value), birth: $("#b-birth").value } : null;
    if (!a.birth || mode === "pair" && !b.birth) return toast(L.missing);
    localStorage.setItem("pt.compatibility.form", JSON.stringify({ a, b }));
    verdictRevealed = false;
    if (mode === "pair") {
      const result = pairCompatibility(a.birth, b.birth);
      resultData = { mode: "pair", names: [a.name || L.personA, b.name || L.personB], people: result.people, result };
    } else {
      const result = soloCompatibility(a.birth);
      resultData = { mode: "solo", name: a.name || L.personA, person: result.person, result };
    }
    history.replaceState(null, "", location.pathname);
    trackMetric();
    track("compatibility_calculate", { calculation_mode: mode });
    await showCalculationLoader({ kind: "compatibility", lang });
    render();
    revealCalculatedResult(app.querySelector("main"));
  }
  function toneControl() {
    const U = ui();
    return `<section class="tone-control" aria-label="${U.toneLabel}"><span>${U.toneLabel}</span><div class="tone-options"><button type="button" data-tone="normal" class="${tone === "normal" ? "active" : ""}" aria-pressed="${tone === "normal"}">${U.normal}</button><button type="button" data-tone="humor" class="${tone === "humor" ? "active" : ""}" aria-pressed="${tone === "humor"}">${U.humor}</button></div></section>`;
  }
  function bindTone() {
    document.querySelectorAll("[data-tone]").forEach((button) => button.onclick = () => {
      tone = button.dataset.tone;
      localStorage.setItem("pt.compatibility.tone", tone);
      track("compatibility_tone", { tone });
      render();
    });
  }
  function socialProof() {
    return `<section class="card social-proof" id="social-proof" hidden data-metric="compatibility_calculated" data-min="100"><strong id="social-count"></strong><p>${L.socialPrivacy}</p></section>`;
  }
  function categoryCards(scores) {
    const U = ui();
    return `<section class="card category-panel"><h2>${L.categoriesTitle}</h2><p class="muted">${U.details}</p><div class="category-list">${Object.entries(scores).map(([key, value]) => {
      const detail = buildRankingDetail({ strongest: key, attention: key }, lang, tone);
      return `<article class="category"><button type="button" class="category-button" data-category="${key}" aria-expanded="false"><span><strong>${L.categories[key]}</strong><small>${scoreMeaning(value)}</small></span><b>${value}%</b><span class="category-chevron">\u2304</span><span class="track"><i style="width:${value}%"></i></span></button><div class="category-detail" hidden><p><b>${U.rankWhy}:</b> ${esc(detail.why)}</p><p><b>${U.rankRisk}:</b> ${esc(detail.risk)}</p><p><b>${U.rankTip}:</b> ${esc(detail.tip)}</p></div></article>`;
    }).join("")}</div><details class="algorithm-note"><summary>${L.howRead}</summary><p>${L.howReadText}</p></details></section>`;
  }
  function scoreMeaning(value) {
    const labels = { ru: ["\u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F", "\u0435\u0441\u0442\u044C \u0442\u043E\u0447\u043A\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", "\u0445\u043E\u0440\u043E\u0448\u0438\u0439 \u0437\u0430\u043F\u0430\u0441", "\u043E\u0434\u043D\u0430 \u0438\u0437 \u0441\u0438\u043B\u044C\u043D\u044B\u0445 \u0437\u043E\u043D"], kk: ["\u043D\u0430\u0437\u0430\u0440 \u0430\u0443\u0434\u0430\u0440\u0443 \u043A\u0435\u0440\u0435\u043A", "\u0431\u0430\u043F\u0442\u0430\u0439\u0442\u044B\u043D \u0442\u04B1\u0441\u0442\u0430\u0440\u044B \u0431\u0430\u0440", "\u0436\u0430\u049B\u0441\u044B \u049B\u043E\u0440 \u0431\u0430\u0440", "\u0435\u04A3 \u043A\u04AF\u0448\u0442\u0456 \u0442\u04B1\u0441\u0442\u0430\u0440\u0434\u044B\u04A3 \u0431\u0456\u0440\u0456"], en: ["needs attention", "has room to tune", "a good reserve", "one of your strongest areas"], fr: ["demande de l\u2019attention", "peut encore s\u2019ajuster", "une bonne r\xE9serve", "un de vos points forts"] };
    return labels[lang][value < 56 ? 0 : value < 72 ? 1 : value < 85 ? 2 : 3];
  }
  function bindCategories() {
    document.querySelectorAll(".category-button").forEach((button) => button.onclick = () => {
      const detail = button.closest(".category").querySelector(".category-detail"), open = detail.hidden;
      detail.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      if (open) track("compatibility_category_open", { category: button.dataset.category });
    });
  }
  function actions(payload, title, shareText) {
    const U = ui(), url = `${ONLINE}compatibility/index.html#r=${enc(payload)}`;
    return `<div class="share-note">\u{1F512} ${payload.mode === "pair" ? U.shareSafe : U.shareSafeSolo}</div><div class="footer-actions"><button class="primary" id="share">${payload.mode === "pair" ? U.sharePair : L.share}</button><button class="secondary" id="copy">${L.copy}</button><button class="secondary" id="again">${L.again}</button><a class="btn ghost" href="../index.html">${L.other}</a></div><span id="share-data" data-url="${esc(url)}" data-title="${esc(title)}" data-text="${esc(shareText)}"></span>`;
  }
  function verdictCard(narrative) {
    const U = ui();
    return `<section class="panel verdict-shell ${verdictRevealed ? "revealed" : "locked"}"><div class="verdict-lock"><span>\u2726</span><strong>${verdictRevealed ? U.unlocked : U.locked}</strong>${verdictRevealed ? "" : `<button class="primary" id="unlock-verdict">${U.unlock}</button>`}</div><div class="verdict-content" aria-hidden="${!verdictRevealed}"><div class="eyebrow">${tone === "humor" ? U.humor : U.normal}</div><h2>${esc(narrative.headline)}</h2><p class="verdict-analysis">${esc(narrative.element)} ${esc(narrative.numbers)}</p><div class="verdict-grid"><article><span>\u2726</span><h3>${U.strength}</h3><p>${esc(narrative.strength)}</p></article><article><span>\u26A1</span><h3>${U.friction}</h3><p>${esc(narrative.friction)}</p></article><article><span>\u2192</span><h3>${U.advice}</h3><p>${esc(narrative.advice)}</p></article></div></div></section>`;
  }
  function pairResult() {
    const data = resultData, [a, b] = data.names, result = data.result, [personA, personB] = result.people, U = ui();
    const narrative = buildPairNarrative(result, data.names, lang, tone);
    const payload = { v: 2, mode: "pair", lang, tone, names: data.names, people: result.people };
    shell(`<main>${toneControl()}<section class="panel result-head"><div class="eyebrow">${shared ? L.sharedResult || L.pairResult : L.pairResult}</div><div class="ring" style="--score:${result.overall}"><strong>${result.overall}%</strong><small>${L.symbolicIndex}</small></div><h1>${esc(a)} + ${esc(b)}</h1><p class="result-lead">${f(L.pairLead, { a: esc(a), b: esc(b), strong: L.categories[result.strongest], attention: L.categories[result.attention] })}</p></section>${verdictCard(narrative)}<section class="system-grid"><article class="card"><div class="eyebrow">${L.zodiacTitle}</div><div class="system-score">${result.zodiac.overall}%</div><h3>${glyph[personA.sign]} ${L.signs[personA.sign]} + ${glyph[personB.sign]} ${L.signs[personB.sign]}</h3><p>${f(L.zodiacText, { signA: L.signs[personA.sign], elementA: L.elements[signs[personA.sign].element], signB: L.signs[personB.sign], elementB: L.elements[signs[personB.sign].element] })}</p><small>${L.systemIndex}</small></article><article class="card"><div class="eyebrow">${L.syutsaiTitle}</div><div class="system-score">${result.syutsai.overall}%</div><h3>${personA.consciousness} \xB7 ${L.numbers[personA.consciousness]} + ${personB.consciousness} \xB7 ${L.numbers[personB.consciousness]}</h3><p>${f(L.syutsaiText, { conA: personA.consciousness, conB: personB.consciousness, missionA: personA.mission, missionB: personB.mission })}</p><small>${L.systemIndex}</small></article></section>${categoryCards(result.scores)}${socialProof()}${research()}<section class="panel result-actions"><p class="disclaimer">${L.disclaimer}</p>${actions(payload, `${a} + ${b} \xB7 ${result.overall}%`, narrative.share)}</section></main>`);
    bindTone();
    bindCategories();
    if ($("#unlock-verdict")) $("#unlock-verdict").onclick = () => {
      verdictRevealed = true;
      track("compatibility_verdict_reveal", { tone });
      render();
    };
    bindActions();
    loadMetric();
  }
  function ranking(title, items, type) {
    const U = ui();
    return `<section class="ranking"><h2>${title}</h2>${items.map((item, index) => {
      const detail = buildRankingDetail(item, lang, tone);
      return `<details class="rank-item" ${index >= 5 ? "hidden" : ""}><summary><span>${index + 1}</span><span><strong>${type === "sign" ? `${glyph[item.id]} ${L.signs[item.id]}` : `${item.id} \xB7 ${L.numbers[item.id]}`}</strong><small>${U.rankOpen}</small></span><b>${item.value}%</b></summary><div class="rank-detail"><p><b>${U.rankWhy}:</b> ${esc(detail.why)}</p><p><b>${U.rankRisk}:</b> ${esc(detail.risk)}</p><p><b>${U.rankTip}:</b> ${esc(detail.tip)}</p></div></details>`;
    }).join("")}<button class="secondary rank-toggle">${L.showAll}</button></section>`;
  }
  function soloResult() {
    const data = resultData, result = data.result, person = result.person;
    const payload = { v: 2, mode: "solo", lang, tone, name: data.name, person };
    const shareText = `${L.signs[person.sign]} \xB7 ${L.consciousness} ${person.consciousness}: ${result.signRanking.slice(0, 3).map((item) => L.signs[item.id]).join(", ")}.`;
    shell(`<main>${toneControl()}<section class="panel result-head"><div class="eyebrow">${L.soloResult}</div><div class="symbols">${glyph[person.sign]}</div><h1>${esc(data.name)}: ${L.signs[person.sign]} \xB7 ${person.consciousness}</h1><p class="result-lead">${f(L.soloLead, { name: esc(data.name) })}</p><div class="honesty">${L.namesDontScore}</div></section><section class="rankings">${ranking(L.signRanking, result.signRanking, "sign")}${ranking(L.numberRanking, result.numberRanking, "number")}</section>${socialProof()}${research()}<section class="panel result-actions"><p class="disclaimer">${L.disclaimer}</p>${actions(payload, `${data.name} \xB7 ${L.signs[person.sign]}`, shareText)}</section></main>`);
    bindTone();
    document.querySelectorAll(".rank-toggle").forEach((button) => button.onclick = () => {
      const box = button.closest(".ranking"), extra = box.querySelectorAll(".rank-item[hidden]");
      if (extra.length) {
        extra.forEach((item) => item.hidden = false);
        button.textContent = L.hideAll;
      } else {
        box.querySelectorAll(".rank-item").forEach((item, index) => {
          if (index >= 5) item.hidden = true;
        });
        button.textContent = L.showAll;
      }
    });
    document.querySelectorAll(".rank-item").forEach((item) => item.addEventListener("toggle", () => {
      if (item.open) track("compatibility_ranking_open");
    }));
    bindActions();
    loadMetric();
  }
  function bindActions() {
    const data = $("#share-data");
    $("#share").onclick = async () => {
      track("compatibility_result_share", { share_kind: "pair_result" });
      if (navigator.share) {
        try {
          await navigator.share({ title: data.dataset.title, text: data.dataset.text, url: data.dataset.url });
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }
      copy(`${data.dataset.text}
${data.dataset.url}`);
    };
    $("#copy").onclick = () => {
      track("compatibility_result_share", { share_kind: "copy" });
      copy(`${data.dataset.text}
${data.dataset.url}`);
    };
    $("#again").onclick = () => {
      history.replaceState(null, "", location.pathname);
      shared = null;
      resultData = null;
      verdictRevealed = false;
      render();
    };
  }
  function restoreShared() {
    if (!shared) return;
    if (shared.mode === "pair" && Array.isArray(shared.people) && shared.people.length === 2) {
      const names = (shared.names || []).map(cleanName);
      resultData = { mode: "pair", names: [names[0] || L.personA, names[1] || L.personB], people: shared.people, result: pairCompatibility(shared.people[0], shared.people[1]) };
    } else if (shared.mode === "solo" && shared.person) {
      resultData = { mode: "solo", name: cleanName(shared.name) || L.personA, person: shared.person, result: soloCompatibility(shared.person) };
    } else shared = null;
  }
  async function trackMetric() {
    const endpoint = globalThis.PORTABLE_METRICS_ENDPOINT;
    if (!endpoint) return;
    try {
      await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: "compatibility_calculated" }) });
    } catch (e) {
    }
  }
  async function loadMetric() {
    const endpoint = globalThis.PORTABLE_METRICS_ENDPOINT, box = $("#social-proof");
    if (!endpoint || !box) return;
    try {
      const response = await fetch(`${endpoint}?event=compatibility_calculated`, { cache: "no-store" });
      const data = await response.json();
      const count = Number(data.count) || 0;
      if (count >= 100) {
        $("#social-count").textContent = f(L.socialProof, { count: new Intl.NumberFormat(lang).format(count) });
        box.hidden = false;
      }
    } catch (e) {
    }
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    toast(L.copied);
  }
  function toast(value) {
    const element = $("#toast");
    element.textContent = value;
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), 1800);
  }
  function render() {
    document.documentElement.lang = lang;
    document.title = `${L.title} \xB7 PortHub`;
    if (shared && !resultData) restoreShared();
    if ((resultData == null ? void 0 : resultData.mode) === "pair") pairResult();
    else if ((resultData == null ? void 0 : resultData.mode) === "solo") soloResult();
    else intro();
  }
  load(lang).then((locale) => {
    L = locale;
    render();
  }).catch((error) => {
    var _a2;
    console.error("Compatibility startup failed", error);
    app.innerHTML = `<main class="startup-error"><section class="panel"><span class="badge">PortHub</span><h1>\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0441\u0447\u0451\u0442</h1><p>\u0424\u0430\u0439\u043B\u044B \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0438\u0441\u044C \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E. \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u2014 \u0432\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u0440\u0430\u043D\u0435\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435.</p><button class="primary wide" type="button" id="startup-retry">\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443</button></section></main>`;
    (_a2 = document.querySelector("#startup-retry")) == null ? void 0 : _a2.addEventListener("click", () => location.reload());
  });
})();
