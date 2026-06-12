type GenreContext = {
  title?: string;
  track?: string;
  artist?: string;
  creator?: string;
  uploader?: string;
  channel?: string;
  channelTitle?: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  topicCategories?: string[];
  topicIds?: string[];
};

type GenreSourceKind =
  | 'title'
  | 'track'
  | 'artist'
  | 'channel'
  | 'description'
  | 'tags'
  | 'categories'
  | 'topicCategories'
  | 'topicIds';

type GenreSource = {
  kind: GenreSourceKind;
  value: string;
  weight: number;
};

type GenreRule = {
  genre: string;
  patterns: RegExp[];
  weight: number;
};

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
  'youtube music',
]);

const GENRE_RULES: GenreRule[] = [
  {
    genre: 'Acoustic',
    weight: 3,
    patterns: [/\b(fingerstyle|acoustic|classical guitar|guitar cover|guitar instrumental)\b/],
  },
  {
    genre: 'Soundtrack',
    weight: 3,
    patterns: [/\b(ost|soundtrack|main theme|movie theme|game theme|the last of us|hans zimmer)\b/],
  },
  {
    genre: 'Electronic',
    weight: 3,
    patterns: [/\b(avicii|edm|dance|club|house|progressive house|electronic|techno|trance)\b/],
  },
  {
    genre: 'Lofi',
    weight: 3,
    patterns: [/\b(lofi|lo-fi|chillhop|beats to relax|study beats)\b/],
  },
  {
    genre: 'Synthwave',
    weight: 3,
    patterns: [/\b(synthwave|retrowave|outrun|kavinsky|m83|the midnight)\b/],
  },
  {
    genre: 'Hip-Hop',
    weight: 3,
    patterns: [/\b(hip hop|hip-hop|rap|trap)\b/],
  },
  {
    genre: 'Metal',
    weight: 4,
    patterns: [
      /\b(heavy metal|metalcore|metal|metallica|iron maiden|slipknot|pantera|megadeth|slayer|black sabbath|judas priest)\b/,
    ],
  },
  {
    genre: 'Rock',
    weight: 4,
    patterns: [
      /\b(rock|hard rock|classic rock|punk|alternative|indie rock|ac\/dc|ac dc|acdc|led zeppelin|queen|aerosmith|pink floyd|guns n'? roses|the rolling stones)\b/,
    ],
  },
  {
    genre: 'Pop',
    weight: 2,
    patterns: [/\b(pop|official lyric video|radio edit|sia|onerepublic)\b/],
  },
  {
    genre: 'Jazz',
    weight: 3,
    patterns: [/\b(jazz|blues|soul|funk)\b/],
  },
  {
    genre: 'Classical',
    weight: 3,
    patterns: [/\b(classical|orchestra|piano|symphony|cello|violin)\b/],
  },
  {
    genre: 'Country',
    weight: 3,
    patterns: [/\b(country|bluegrass)\b/],
  },
  {
    genre: 'Reggae',
    weight: 3,
    patterns: [/\b(reggae|dancehall)\b/],
  },
  {
    genre: 'Latin',
    weight: 3,
    patterns: [/\b(latin|reggaeton|salsa|bachata)\b/],
  },
  {
    genre: 'Folk',
    weight: 3,
    patterns: [/\b(folk|singer-songwriter)\b/],
  },
];

const TOPIC_RULES: GenreRule[] = [
  {
    genre: 'Electronic',
    weight: 8,
    patterns: [/\b(electronic music|electronic_music|edm|house music|techno|trance)\b/],
  },
  {
    genre: 'Rock',
    weight: 8,
    patterns: [/\b(rock music|rock_and_roll|hard rock|classic rock|alternative rock)\b/],
  },
  {
    genre: 'Metal',
    weight: 8,
    patterns: [/\b(heavy metal|metal music)\b/],
  },
  {
    genre: 'Hip-Hop',
    weight: 8,
    patterns: [/\b(hip hop music|hip_hop_music|rap music)\b/],
  },
  {
    genre: 'Pop',
    weight: 7,
    patterns: [/\b(pop music|pop_music)\b/],
  },
  {
    genre: 'Classical',
    weight: 7,
    patterns: [/\b(classical music|classical_music)\b/],
  },
  {
    genre: 'Jazz',
    weight: 7,
    patterns: [/\b(jazz music)\b/],
  },
  {
    genre: 'Country',
    weight: 7,
    patterns: [/\b(country music|country_music)\b/],
  },
  {
    genre: 'Reggae',
    weight: 7,
    patterns: [/\b(reggae music)\b/],
  },
  {
    genre: 'Latin',
    weight: 7,
    patterns: [/\b(latin music)\b/],
  },
  {
    genre: 'Folk',
    weight: 7,
    patterns: [/\b(folk music)\b/],
  },
];

const SOURCE_WEIGHTS: Record<GenreSourceKind, number> = {
  title: 6,
  track: 6,
  artist: 5,
  channel: 4,
  description: 2,
  tags: 7,
  categories: 2,
  topicCategories: 8,
  topicIds: 8,
};

const SOURCE_MULTIPLIERS: Record<GenreSourceKind, number> = {
  title: 1,
  track: 1,
  artist: 1,
  channel: 1,
  description: 0.75,
  tags: 1.2,
  categories: 0.6,
  topicCategories: 1.8,
  topicIds: 1.6,
};

export function resolveMusicGenre(primary: any, fallback?: any) {
  const context = normalizeGenreContext(primary, fallback);
  const explicitGenre = resolveExplicitGenreLabel([
    primary?.genre,
    ...(Array.isArray(primary?.genres) ? primary.genres : []),
    fallback?.genre,
    ...(Array.isArray(fallback?.genres) ? fallback.genres : []),
  ]);
  if (explicitGenre) return explicitGenre;

  const topicGenre = resolveTopicGenre(context);
  if (topicGenre) return topicGenre;

  return scoreGenreContext(context) || 'Music';
}

export function isBroadMetadataLabel(value: unknown) {
  const normalized = normalizeGenreText(value);
  return !normalized || BROAD_METADATA_LABELS.has(normalized);
}

export function inferGenre(text: string) {
  return scoreGenreContext({
    title: text,
    tags: [text],
  });
}

function scoreGenreContext(context: GenreContext) {
  const sources = buildGenreSources(context);
  const scores = new Map<string, number>();

  for (const source of sources) {
    const normalized = normalizeGenreText(source.value);
    if (!normalized || isBroadMetadataLabel(normalized)) continue;

    for (const rule of GENRE_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(normalized))) {
        const score = source.weight * rule.weight * SOURCE_MULTIPLIERS[source.kind];
        scores.set(rule.genre, (scores.get(rule.genre) || 0) + score);
      }
    }
  }

  return pickHighestScore(scores);
}

function resolveTopicGenre(context: GenreContext) {
  const topicCandidates = [...(context.topicCategories || []), ...(context.topicIds || [])];

  for (const candidate of topicCandidates) {
    const matchedGenre = matchTopicGenre(candidate);
    if (matchedGenre) return matchedGenre;
  }

  return '';
}

function resolveExplicitGenreLabel(candidates: unknown[]) {
  for (const candidate of candidates) {
    const normalized = normalizeGenreText(candidate);
    if (!normalized || isBroadMetadataLabel(normalized)) continue;

    const scored = scoreGenreContext({
      title: normalized,
      track: normalized,
      artist: normalized,
      tags: [normalized],
      categories: [normalized],
    });
    if (scored) return scored;

    return formatGenre(candidate);
  }

  return '';
}

function matchTopicGenre(value: string) {
  const normalized = normalizeLooseText(value);
  for (const rule of TOPIC_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.genre;
    }
  }

  if (normalized.includes('electronic_music')) return 'Electronic';
  if (normalized.includes('rock_music') || normalized.includes('rock_and_roll')) return 'Rock';
  if (normalized.includes('metal_music')) return 'Metal';
  if (normalized.includes('hip_hop_music')) return 'Hip-Hop';
  if (normalized.includes('pop_music')) return 'Pop';
  if (normalized.includes('classical_music')) return 'Classical';

  return '';
}

function buildGenreSources(context: GenreContext) {
  const sources: GenreSource[] = [];
  const topicChannelBoost = isTopicChannel(context.channelTitle || context.channel) ? 1.35 : 1;

  addSource(sources, 'title', context.title, SOURCE_WEIGHTS.title);
  addSource(sources, 'track', context.track, SOURCE_WEIGHTS.track);
  addSource(
    sources,
    'artist',
    context.artist || context.creator || context.uploader,
    SOURCE_WEIGHTS.artist,
  );
  addSource(
    sources,
    'channel',
    context.channelTitle || context.channel,
    SOURCE_WEIGHTS.channel * topicChannelBoost,
  );
  addSource(sources, 'description', context.description, SOURCE_WEIGHTS.description);
  addArraySources(sources, 'tags', context.tags, SOURCE_WEIGHTS.tags);
  addArraySources(sources, 'categories', context.categories, SOURCE_WEIGHTS.categories);
  addArraySources(
    sources,
    'topicCategories',
    context.topicCategories,
    SOURCE_WEIGHTS.topicCategories,
  );
  addArraySources(sources, 'topicIds', context.topicIds, SOURCE_WEIGHTS.topicIds);

  return sources;
}

function addSource(
  sources: GenreSource[],
  kind: GenreSourceKind,
  value: string | undefined,
  weight: number,
) {
  if (!value) return;

  sources.push({
    kind,
    value,
    weight,
  });
}

function addArraySources(
  sources: GenreSource[],
  kind: GenreSourceKind,
  values: string[] | undefined,
  weight: number,
) {
  if (!Array.isArray(values)) return;

  values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .forEach((value) => {
      sources.push({
        kind,
        value,
        weight,
      });
    });
}

function pickHighestScore(scores: Map<string, number>) {
  let winner = '';
  let winnerScore = 0;

  for (const [genre, score] of scores.entries()) {
    if (score > winnerScore) {
      winner = genre;
      winnerScore = score;
    }
  }

  return winner;
}

function formatGenre(value: unknown) {
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeGenreContext(primary: any, fallback?: any): GenreContext {
  return {
    title: firstString(primary?.title, primary?.track, fallback?.title, fallback?.track),
    track: firstString(primary?.track, primary?.title, fallback?.track, fallback?.title),
    artist: firstString(
      primary?.artist,
      primary?.creator,
      primary?.uploader,
      primary?.channel,
      fallback?.artist,
      fallback?.creator,
      fallback?.uploader,
      fallback?.channel,
    ),
    creator: firstString(primary?.creator, fallback?.creator),
    uploader: firstString(primary?.uploader, fallback?.uploader),
    channel: firstString(
      primary?.channelTitle,
      primary?.channel,
      primary?.uploader,
      primary?.creator,
      fallback?.channelTitle,
      fallback?.channel,
      fallback?.uploader,
      fallback?.creator,
    ),
    channelTitle: firstString(
      primary?.channelTitle,
      primary?.channel,
      primary?.uploader,
      primary?.creator,
      fallback?.channelTitle,
      fallback?.channel,
      fallback?.uploader,
      fallback?.creator,
    ),
    description: firstString(primary?.description, fallback?.description),
    tags: collectStrings(primary?.tags, fallback?.tags),
    categories: collectStrings(primary?.categories, fallback?.categories),
    topicCategories: collectStrings(
      primary?.topicCategories,
      primary?.topic_categories,
      primary?.topicDetails?.topicCategories,
      primary?.topicDetails?.topic_categories,
      fallback?.topicCategories,
      fallback?.topic_categories,
      fallback?.topicDetails?.topicCategories,
      fallback?.topicDetails?.topic_categories,
    ),
    topicIds: collectStrings(
      primary?.topicIds,
      primary?.topic_ids,
      primary?.topicDetails?.topicIds,
      primary?.topicDetails?.topic_ids,
      fallback?.topicIds,
      fallback?.topic_ids,
      fallback?.topicDetails?.topicIds,
      fallback?.topicDetails?.topic_ids,
    ),
  };
}

function collectStrings(...inputs: any[]) {
  return inputs.flatMap((input) => {
    if (Array.isArray(input)) {
      return input.map((value) => String(value || '').trim()).filter((value) => value.length > 0);
    }

    if (typeof input === 'string') {
      const trimmed = input.trim();
      return trimmed ? [trimmed] : [];
    }

    return [];
  });
}

function firstString(...values: any[]) {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  return '';
}

function isTopicChannel(channel: string | undefined) {
  return Boolean(channel && /- topic$/i.test(channel.trim()));
}

function normalizeLooseText(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeGenreText(value: unknown) {
  return normalizeLooseText(value).replace(/[._/]/g, ' ');
}
