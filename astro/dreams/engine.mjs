const FALLBACK_LANG = 'ru';

export function pick(value, lang = FALLBACK_LANG) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value[FALLBACK_LANG] ?? Object.values(value)[0] ?? '';
}

export function normalize(value = '') {
  return String(value)
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .trim();
}

export function searchObjects(objects = [], query = '', lang = FALLBACK_LANG, limit = 8) {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const languageOrder = [...new Set([lang, FALLBACK_LANG, 'kk', 'en', 'fr'])];

  return objects
    .map((object) => {
      const currentName = normalize(pick(object.name, lang));
      const tokens = languageOrder.flatMap((code) => [
        pick(object.name, code),
        ...(object.keywords?.[code] ?? [])
      ]).map(normalize);
      let rank = Number.POSITIVE_INFINITY;
      if (currentName === needle) rank = 0;
      else if (currentName.startsWith(needle)) rank = 1;
      else if (tokens.some((token) => token === needle)) rank = 2;
      else if (tokens.some((token) => token.startsWith(needle))) rank = 3;
      else if (tokens.some((token) => token.includes(needle))) rank = 4;
      return { object, rank };
    })
    .filter(({ rank }) => Number.isFinite(rank))
    .sort((a, b) => a.rank - b.rank || pick(a.object.name, lang).localeCompare(pick(b.object.name, lang)))
    .slice(0, limit)
    .map(({ object }) => object);
}

export function interpolate(template = '', values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function findById(items, id, fallbackId) {
  return items.find((item) => item.id === id) ?? items.find((item) => item.id === fallbackId) ?? items[0];
}

function firstSentence(text) {
  const match = String(text).match(/^.*?[.!?](?:\s|$)/u);
  return (match?.[0] ?? text).trim();
}

export function interpretDream(selection, objectsData, rulesData, locale, lang = FALLBACK_LANG) {
  const object = objectsData.objects.find((item) => item.id === selection.objectId);
  if (!object) throw new Error('UNKNOWN_OBJECT');

  const target = findById(rulesData.targets, selection.targetId, 'observe');
  const action = findById(rulesData.actions, selection.actionId, 'neutral');
  const detail = findById(rulesData.details, selection.detailId, 'none');
  const emotion = findById(rulesData.emotions, selection.emotionId, 'neutral');
  const values = {
    object: pick(object.name, lang),
    focus: pick(object.focus, lang),
    target: pick(target.label, lang).toLocaleLowerCase(),
    action: pick(action.label, lang).toLocaleLowerCase(),
    detail: pick(detail.label, lang).toLocaleLowerCase(),
    emotion: pick(emotion.label, lang).toLocaleLowerCase()
  };

  const summary = [
    interpolate(locale.summaryLead, values),
    firstSentence(pick(action.vibe, lang))
  ].join(' ');

  const schoolText = (school) => [
    interpolate(locale.schoolIntro[school], values),
    pick(target.impact, lang),
    pick(action.schools[school], lang),
    interpolate(locale.emotionBridge[school], { ...values, emotionText: pick(emotion.text, lang) })
  ].join(' ');

  return {
    object: { id: object.id, icon: object.icon, name: values.object, focus: values.focus },
    selection: {
      target: { id: target.id, icon: target.icon, label: pick(target.label, lang) },
      action: { id: action.id, icon: action.icon, label: pick(action.label, lang) },
      detail: { id: detail.id, icon: detail.icon, label: pick(detail.label, lang), text: pick(detail.text, lang) },
      emotion: { id: emotion.id, icon: emotion.icon, label: pick(emotion.label, lang), text: pick(emotion.text, lang) }
    },
    summary,
    schools: {
      islamic: schoolText('islamic'),
      psychology: schoolText('psychology'),
      popular: schoolText('popular')
    }
  };
}

export function encodeResult(selection, lang = FALLBACK_LANG) {
  const compact = {
    v: 1,
    l: lang,
    o: selection.objectId,
    t: selection.targetId,
    a: selection.actionId,
    d: selection.detailId,
    e: selection.emotionId
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeResult(value) {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data.v !== 1 || !data.o || !data.t || !data.a || !data.d || !data.e) return null;
    return {
      lang: data.l,
      selection: { objectId: data.o, targetId: data.t, actionId: data.a, detailId: data.d, emotionId: data.e }
    };
  } catch {
    return null;
  }
}
