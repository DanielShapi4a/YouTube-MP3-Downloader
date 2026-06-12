const BROAD_METADATA_LABELS = new Set([
  'autos & vehicles',
  'comedy',
  'education',
  'entertainment',
  'film & animation',
  'gaming',
  'howto & style',
  'music',
  'news & politics',
  'nonprofits & activism',
  'people & blogs',
  'pets & animals',
  'science & technology',
  'sports',
  'travel & events',
  'youtube audio',
]);

const GENRE_RULES: Array<[RegExp, string]> = [
  [/\b(fingerstyle|acoustic|classical guitar|guitar cover|guitar instrumental)\b/, 'Acoustic'],
  [
    /\b(ost|soundtrack|main theme|movie theme|game theme|the last of us|hans zimmer)\b/,
    'Soundtrack',
  ],
  [/\b(avicii|edm|dance|club|house|progressive house|electronic|techno|trance)\b/, 'Electronic'],
  [/\b(lofi|lo-fi|chillhop|beats to relax|study beats)\b/, 'Lofi'],
  [/\b(synthwave|retrowave|outrun|kavinsky|m83|the midnight)\b/, 'Synthwave'],
  [/\b(hip hop|hip-hop|rap|trap)\b/, 'Hip-Hop'],
  [/\b(heavy metal|metalcore|metal)\b/, 'Metal'],
  [/\b(rock|punk|alternative|indie rock)\b/, 'Rock'],
  [/\b(pop|official lyric video|radio edit|sia|onerepublic)\b/, 'Pop'],
  [/\b(jazz|blues|soul|funk)\b/, 'Jazz'],
  [/\b(classical|orchestra|piano|symphony|cello|violin)\b/, 'Classical'],
  [/\b(country|bluegrass)\b/, 'Country'],
  [/\b(reggae|dancehall)\b/, 'Reggae'],
  [/\b(latin|reggaeton|salsa|bachata)\b/, 'Latin'],
  [/\b(folk|singer-songwriter)\b/, 'Folk'],
];

export function resolveMusicGenre(primary: any, fallback?: any) {
  const explicitCandidates = [
    primary?.genre,
    ...(Array.isArray(primary?.genres) ? primary.genres : []),
    fallback?.genre,
    ...(Array.isArray(fallback?.genres) ? fallback.genres : []),
  ];

  for (const candidate of explicitCandidates) {
    const canonicalGenre = canonicalizeGenre(candidate);
    if (canonicalGenre) return canonicalGenre;

    if (!isBroadMetadataLabel(candidate)) {
      return formatGenre(candidate);
    }
  }

  const searchableText = [
    primary?.title,
    primary?.track,
    primary?.artist,
    primary?.creator,
    primary?.uploader,
    primary?.channel,
    ...(Array.isArray(primary?.tags) ? primary.tags : []),
    ...(Array.isArray(primary?.categories) ? primary.categories : []),
    fallback?.title,
    fallback?.track,
    fallback?.artist,
    fallback?.creator,
    fallback?.uploader,
    fallback?.channel,
    ...(Array.isArray(fallback?.tags) ? fallback.tags : []),
    ...(Array.isArray(fallback?.categories) ? fallback.categories : []),
  ]
    .filter(Boolean)
    .join(' ');

  return inferGenre(searchableText) || 'Music';
}

export function isBroadMetadataLabel(value: unknown) {
  const normalized = normalizeGenreText(value);
  return !normalized || BROAD_METADATA_LABELS.has(normalized);
}

export function inferGenre(text: string) {
  const normalized = normalizeGenreText(text);
  return GENRE_RULES.find(([pattern]) => pattern.test(normalized))?.[1];
}

function canonicalizeGenre(value: unknown) {
  const normalized = normalizeGenreText(value);
  if (!normalized || BROAD_METADATA_LABELS.has(normalized)) return '';

  return inferGenre(normalized) || '';
}

function formatGenre(value: unknown) {
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeGenreText(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
