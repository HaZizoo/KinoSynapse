import { imageUrl } from '../lib/images.js';
import type {
  CastMember,
  Genre,
  MediaSummary,
  MovieDetails,
  MovieSnapshot,
  MovieSummary,
  PaginatedMedia,
  PaginatedMovies,
  PaginatedTv,
  QueryInterpretation,
  TvDetails,
  TvSummary,
} from '../types.js';

/**
 * Deterministic offline catalog.
 *
 * Every poster path below points at a real film poster on the public TMDB image
 * CDN, which serves images without an API key. When TMDB is unavailable or its
 * key is missing/placeholder, the movie endpoints are served from this list so
 * the app stays useful with zero configuration.
 */

export const CATALOG_PAGE_SIZE = 12;

interface CatalogMovie {
  id: number;
  title: string;
  originalTitle: string;
  tagline: string;
  overview: string;
  releaseDate: string;
  runtime: number;
  genres: Genre[];
  rating: { average: number; count: number };
  popularity: number;
  posterPath: string;
  /** Portrait posters double as hero art for entries without a stored backdrop. */
  backdropPath: string;
  certification: string;
  director: { id: number; name: string };
  cast: Array<{ id: number; name: string; character: string }>;
  trailer: { key: string; name: string; site: string } | null;
  homepage: string | null;
  budget: number | null;
  revenue: number | null;
  keywords: string[];
}

const GENRE_IDS: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Science Fiction': 878,
  Thriller: 53,
};

function genre(name: keyof typeof GENRE_IDS): Genre {
  return { id: GENRE_IDS[name] ?? 0, name };
}

const movies: CatalogMovie[] = [
  {
    id: 603,
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    tagline: 'Welcome to the Real World.',
    overview:
      'A burned-out hacker discovers that reality is a simulation built to keep humanity docile, and joins a crew of rebels fighting to wake the world up.',
    releaseDate: '1999-03-31',
    runtime: 136,
    genres: [genre('Action'), genre('Science Fiction')],
    rating: { average: 8.2, count: 25_489 },
    popularity: 92.4,
    posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropPath: '/icmmSD4vTTDKOq2vvdulafOGw93.jpg',
    certification: 'R',
    director: { id: 9339, name: 'Lana Wachowski' },
    cast: [
      { id: 6384, name: 'Keanu Reeves', character: 'Neo' },
      { id: 2975, name: 'Laurence Fishburne', character: 'Morpheus' },
      { id: 530, name: 'Carrie-Anne Moss', character: 'Trinity' },
      { id: 1331, name: 'Hugo Weaving', character: 'Agent Smith' },
      { id: 532, name: 'Joe Pantoliano', character: 'Cypher' },
    ],
    trailer: { key: 'vKQi3bBA1y8', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 63_000_000,
    revenue: 463_517_383,
    keywords: ['simulation', 'dystopia', 'artificial intelligence', 'cyberpunk', 'chosen one'],
  },
  {
    id: 27205,
    title: 'Inception',
    originalTitle: 'Inception',
    tagline: 'Your mind is the scene of the crime.',
    overview:
      'A thief who steals secrets from dreams is offered one last job: plant an idea deep inside a target’s subconscious without waking him.',
    releaseDate: '2010-07-15',
    runtime: 148,
    genres: [genre('Action'), genre('Science Fiction'), genre('Thriller')],
    rating: { average: 8.4, count: 37_812 },
    popularity: 88.1,
    posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropPath: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    certification: 'PG-13',
    director: { id: 525, name: 'Christopher Nolan' },
    cast: [
      { id: 6193, name: 'Leonardo DiCaprio', character: 'Dom Cobb' },
      { id: 24045, name: 'Joseph Gordon-Levitt', character: 'Arthur' },
      { id: 27578, name: 'Elliot Page', character: 'Ariadne' },
      { id: 2524, name: 'Tom Hardy', character: 'Eames' },
      { id: 8293, name: 'Marion Cotillard', character: 'Mal' },
    ],
    trailer: { key: 'YoHD9XEInc0', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 160_000_000,
    revenue: 836_836_763,
    keywords: ['dream', 'heist', 'memory', 'mind bending', 'time'],
  },
  {
    id: 157336,
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    overview:
      'With Earth’s harvests failing, a former pilot leads a small crew through a wormhole in search of a habitable world — and a way back to his children.',
    releaseDate: '2014-11-05',
    runtime: 169,
    genres: [genre('Adventure'), genre('Drama'), genre('Science Fiction')],
    rating: { average: 8.4, count: 36_190 },
    popularity: 96.7,
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    certification: 'PG-13',
    director: { id: 525, name: 'Christopher Nolan' },
    cast: [
      { id: 10297, name: 'Matthew McConaughey', character: 'Cooper' },
      { id: 1813, name: 'Anne Hathaway', character: 'Brand' },
      { id: 83002, name: 'Jessica Chastain', character: 'Murph' },
      { id: 3894, name: 'Michael Caine', character: 'Professor Brand' },
      { id: 1892, name: 'Matt Damon', character: 'Mann' },
    ],
    trailer: { key: 'zSWdZVtXT7E', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 165_000_000,
    revenue: 701_729_917,
    keywords: ['space travel', 'wormhole', 'family', 'survival', 'time dilation'],
  },
  {
    id: 335984,
    title: 'Blade Runner 2049',
    originalTitle: 'Blade Runner 2049',
    tagline: 'There is an order to things.',
    overview:
      'Thirty years after the original blackout, a young blade runner uncovers a secret that could unravel what is left of society — and lead him to a legend.',
    releaseDate: '2017-10-04',
    runtime: 164,
    genres: [genre('Drama'), genre('Science Fiction'), genre('Thriller')],
    rating: { average: 7.6, count: 12_904 },
    popularity: 74.3,
    posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropPath: '/ilRyazdMJwN05exqhwK4tMKBYZs.jpg',
    certification: 'R',
    director: { id: 137427, name: 'Denis Villeneuve' },
    cast: [
      { id: 30614, name: 'Ryan Gosling', character: 'K' },
      { id: 3, name: 'Harrison Ford', character: 'Rick Deckard' },
      { id: 224513, name: 'Ana de Armas', character: 'Joi' },
      { id: 1373737, name: 'Sylvia Hoeks', character: 'Luv' },
      { id: 7499, name: 'Jared Leto', character: 'Niander Wallace' },
    ],
    trailer: { key: 'gCcx85zbxz4', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 150_000_000,
    revenue: 259_239_658,
    keywords: ['replicant', 'dystopia', 'identity', 'neo-noir', 'artificial intelligence'],
  },
  {
    id: 329865,
    title: 'Arrival',
    originalTitle: 'Arrival',
    tagline: 'Why are they here?',
    overview:
      'A linguist is recruited to communicate with visitors whose ships have appeared around the world, and discovers that language can reshape how time is experienced.',
    releaseDate: '2016-11-10',
    runtime: 116,
    genres: [genre('Drama'), genre('Mystery'), genre('Science Fiction')],
    rating: { average: 7.6, count: 16_847 },
    popularity: 68.9,
    posterPath: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
    backdropPath: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
    certification: 'PG-13',
    director: { id: 137427, name: 'Denis Villeneuve' },
    cast: [
      { id: 9273, name: 'Amy Adams', character: 'Louise Banks' },
      { id: 17647, name: 'Jeremy Renner', character: 'Ian Donnelly' },
      { id: 5292, name: 'Forest Whitaker', character: 'Colonel Weber' },
      { id: 1067187, name: 'Michael Stuhlbarg', character: 'Agent Halpern' },
      { id: 11718, name: 'Tzi Ma', character: 'General Shang' },
    ],
    trailer: { key: 'tFMo3UJ4B4g', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 47_000_000,
    revenue: 203_388_186,
    keywords: ['first contact', 'linguistics', 'alien', 'time', 'memory'],
  },
  {
    id: 155,
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    tagline: 'Why so serious?',
    overview:
      'Batman’s war on crime is upended by an anarchist in face paint who wants to prove that anyone can be broken — including the city’s white knight.',
    releaseDate: '2008-07-16',
    runtime: 152,
    genres: [genre('Action'), genre('Crime'), genre('Drama'), genre('Thriller')],
    rating: { average: 8.5, count: 34_661 },
    popularity: 99.5,
    posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: '/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
    certification: 'PG-13',
    director: { id: 525, name: 'Christopher Nolan' },
    cast: [
      { id: 3894, name: 'Christian Bale', character: 'Bruce Wayne' },
      { id: 1810, name: 'Heath Ledger', character: 'Joker' },
      { id: 6968, name: 'Aaron Eckhart', character: 'Harvey Dent' },
      { id: 3893, name: 'Michael Caine', character: 'Alfred Pennyworth' },
      { id: 192, name: 'Gary Oldman', character: 'James Gordon' },
    ],
    trailer: { key: 'EXeTwQWrcwY', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 185_000_000,
    revenue: 1_006_234_235,
    keywords: ['superhero', 'vigilante', 'crime', 'anarchy', 'moral dilemma'],
  },
  {
    id: 76341,
    title: 'Mad Max: Fury Road',
    originalTitle: 'Mad Max: Fury Road',
    tagline: 'What a lovely day.',
    overview:
      'In a scorched wasteland, a drifter and a runaway commander flee a tyrant’s army across the desert in a convoy built for war.',
    releaseDate: '2015-05-13',
    runtime: 120,
    genres: [genre('Action'), genre('Adventure'), genre('Science Fiction')],
    rating: { average: 7.6, count: 22_183 },
    popularity: 81.6,
    posterPath: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
    backdropPath: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
    certification: 'R',
    director: { id: 20629, name: 'George Miller' },
    cast: [
      { id: 2524, name: 'Tom Hardy', character: 'Max Rockatansky' },
      { id: 6885, name: 'Charlize Theron', character: 'Imperator Furiosa' },
      { id: 1117313, name: 'Nicholas Hoult', character: 'Nux' },
      { id: 4826, name: 'Hugh Keays-Byrne', character: 'Immortan Joe' },
      { id: 23532, name: 'Zoë Kravitz', character: 'Toast the Knowing' },
    ],
    trailer: { key: 'hEJnMQG9ev8', name: 'Official Main Trailer', site: 'YouTube' },
    homepage: null,
    budget: 150_000_000,
    revenue: 378_858_340,
    keywords: ['post-apocalyptic', 'desert', 'chase', 'survival', 'practical effects'],
  },
  {
    id: 245891,
    title: 'John Wick',
    originalTitle: 'John Wick',
    tagline: 'Don’t set him off.',
    overview:
      'A retired hitman is pulled back into the underworld after thugs take the last thing he loved, and he does not stop until the ledger is settled.',
    releaseDate: '2014-10-22',
    runtime: 101,
    genres: [genre('Action'), genre('Thriller')],
    rating: { average: 7.4, count: 20_195 },
    popularity: 85.2,
    posterPath: '/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg',
    backdropPath: '/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg',
    certification: 'R',
    director: { id: 9339, name: 'Chad Stahelski' },
    cast: [
      { id: 6384, name: 'Keanu Reeves', character: 'John Wick' },
      { id: 5219, name: 'Mikael Nyqvist', character: 'Viggo Tarasov' },
      { id: 131, name: 'Alfie Allen', character: 'Iosef Tarasov' },
      { id: 3895, name: 'Willem Dafoe', character: 'Marcus' },
      { id: 4175, name: 'Ian McShane', character: 'Winston' },
    ],
    trailer: { key: 'C0BMx-qxsP4', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 20_000_000,
    revenue: 86_007_484,
    keywords: ['hitman', 'revenge', 'dog', 'assassin', 'underworld'],
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    originalTitle: 'Pulp Fiction',
    tagline: 'Just because you are a character doesn’t mean you have character.',
    overview:
      'Two hitmen, a boxer, a gangster’s wife and a pair of diner robbers collide across a handful of interlocking Los Angeles stories.',
    releaseDate: '1994-09-10',
    runtime: 154,
    genres: [genre('Crime'), genre('Drama'), genre('Thriller')],
    rating: { average: 8.5, count: 27_010 },
    popularity: 90.8,
    posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdropPath: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    certification: 'R',
    director: { id: 138, name: 'Quentin Tarantino' },
    cast: [
      { id: 8891, name: 'John Travolta', character: 'Vincent Vega' },
      { id: 2231, name: 'Samuel L. Jackson', character: 'Jules Winnfield' },
      { id: 589, name: 'Uma Thurman', character: 'Mia Wallace' },
      { id: 62, name: 'Bruce Willis', character: 'Butch Coolidge' },
      { id: 3934, name: 'Ving Rhames', character: 'Marsellus Wallace' },
    ],
    trailer: { key: 's7EdQ4FqbhY', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 8_000_000,
    revenue: 213_928_762,
    keywords: ['nonlinear', 'hitman', 'crime', 'dark comedy', 'los angeles'],
  },
  {
    id: 496243,
    title: 'Parasite',
    originalTitle: '기생충',
    tagline: 'Act like you own the place.',
    overview:
      'A cash-strapped family talks its way into the household of a wealthy Seoul couple, until a hidden secret in the basement turns the con into a tragedy.',
    releaseDate: '2019-05-30',
    runtime: 133,
    genres: [genre('Comedy'), genre('Drama'), genre('Thriller')],
    rating: { average: 8.5, count: 18_402 },
    popularity: 79.4,
    posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropPath: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    certification: 'R',
    director: { id: 21684, name: 'Bong Joon-ho' },
    cast: [
      { id: 21593, name: 'Song Kang-ho', character: 'Ki-taek' },
      { id: 1253986, name: 'Lee Sun-kyun', character: 'Mr. Park' },
      { id: 1253987, name: 'Cho Yeo-jeong', character: 'Yeon-gyo' },
      { id: 1253988, name: 'Choi Woo-shik', character: 'Ki-woo' },
      { id: 1253989, name: 'Park So-dam', character: 'Ki-jung' },
    ],
    trailer: { key: '5xH0HfJHsaY', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 11_000_000,
    revenue: 263_136_741,
    keywords: ['class', 'social satire', 'family', 'con artists', 'twist'],
  },
  {
    id: 419430,
    title: 'Get Out',
    originalTitle: 'Get Out',
    tagline: 'Just because you’re invited, doesn’t mean you’re welcome.',
    overview:
      'A young Black photographer visits his white girlfriend’s family estate for the weekend and slowly realises their hospitality is a trap.',
    releaseDate: '2017-02-24',
    runtime: 104,
    genres: [genre('Horror'), genre('Mystery'), genre('Thriller')],
    rating: { average: 7.6, count: 15_702 },
    popularity: 71.2,
    posterPath: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    backdropPath: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    certification: 'R',
    director: { id: 1705606, name: 'Jordan Peele' },
    cast: [
      { id: 205921, name: 'Daniel Kaluuya', character: 'Chris Washington' },
      { id: 113782, name: 'Allison Williams', character: 'Rose Armitage' },
      { id: 7904, name: 'Bradley Whitford', character: 'Dean Armitage' },
      { id: 5367, name: 'Catherine Keener', character: 'Missy Armitage' },
      { id: 135651, name: 'LilRel Howery', character: 'Rod Williams' },
    ],
    trailer: { key: 'DzfpyUB60YY', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 4_500_000,
    revenue: 255_407_969,
    keywords: ['social thriller', 'racism', 'hypnosis', 'twist', 'isolation'],
  },
  {
    id: 244786,
    title: 'Whiplash',
    originalTitle: 'Whiplash',
    tagline: 'The road to greatness can take you to the edge.',
    overview:
      'A jazz drummer at an elite conservatory pushes himself to the breaking point under a conductor who believes cruelty is the only teacher.',
    releaseDate: '2014-10-10',
    runtime: 107,
    genres: [genre('Drama'), genre('Music')],
    rating: { average: 8.4, count: 14_789 },
    popularity: 66.1,
    posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    backdropPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    certification: 'R',
    director: { id: 136495, name: 'Damien Chazelle' },
    cast: [
      { id: 1102237, name: 'Miles Teller', character: 'Andrew Neiman' },
      { id: 17419, name: 'J.K. Simmons', character: 'Terence Fletcher' },
      { id: 13524, name: 'Paul Reiser', character: 'Jim Neiman' },
      { id: 968962, name: 'Melissa Benoist', character: 'Nicole' },
      { id: 1034681, name: 'Austin Stowell', character: 'Ryan Connolly' },
    ],
    trailer: { key: '7d_jQycdQGo', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 3_300_000,
    revenue: 49_022_113,
    keywords: ['jazz', 'obsession', 'mentor', 'ambition', 'drummer'],
  },
  {
    id: 120467,
    title: 'The Grand Budapest Hotel',
    originalTitle: 'The Grand Budapest Hotel',
    tagline: 'A perfect holiday without leaving home.',
    overview:
      'A legendary concierge and his loyal lobby boy are swept into a caper involving a stolen painting, a family fortune and the twilight of a European hotel.',
    releaseDate: '2014-02-26',
    runtime: 99,
    genres: [genre('Comedy'), genre('Drama')],
    rating: { average: 8.0, count: 13_276 },
    popularity: 69.8,
    posterPath: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',
    backdropPath: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',
    certification: 'R',
    director: { id: 1032, name: 'Wes Anderson' },
    cast: [
      { id: 11288, name: 'Ralph Fiennes', character: 'M. Gustave' },
      { id: 1254614, name: 'Tony Revolori', character: 'Zero Moustafa' },
      { id: 3490, name: 'Adrien Brody', character: 'Dmitri Desgoffe-und-Taxis' },
      { id: 3895, name: 'Willem Dafoe', character: 'Jopling' },
      { id: 1023158, name: 'Saoirse Ronan', character: 'Agatha' },
    ],
    trailer: { key: '1Fg5iWmQjwk', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 25_000_000,
    revenue: 172_185_539,
    keywords: ['caper', 'symmetry', 'hotel', 'comedy', 'whimsical'],
  },
  {
    id: 313369,
    title: 'La La Land',
    originalTitle: 'La La Land',
    tagline: 'Here’s to the fools who dream.',
    overview:
      'A jazz pianist and an aspiring actress fall in love in Los Angeles while chasing careers that keep pulling them in different directions.',
    releaseDate: '2016-11-29',
    runtime: 129,
    genres: [genre('Comedy'), genre('Drama'), genre('Music'), genre('Romance')],
    rating: { average: 7.9, count: 19_338 },
    popularity: 77.5,
    posterPath: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    backdropPath: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    certification: 'PG-13',
    director: { id: 136495, name: 'Damien Chazelle' },
    cast: [
      { id: 30614, name: 'Ryan Gosling', character: 'Sebastian' },
      { id: 54693, name: 'Emma Stone', character: 'Mia' },
      { id: 59222, name: 'John Legend', character: 'Keith' },
      { id: 16431, name: 'Rosemarie DeWitt', character: 'Laura' },
      { id: 17419, name: 'J.K. Simmons', character: 'Bill' },
    ],
    trailer: { key: '0pdqf4P9MB8', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 30_000_000,
    revenue: 447_407_166,
    keywords: ['musical', 'jazz', 'los angeles', 'romance', 'dreams'],
  },
  {
    id: 862,
    title: 'Toy Story',
    originalTitle: 'Toy Story',
    tagline: 'Hang on to your hats!',
    overview:
      'A pull-string cowboy loses his place as a boy’s favourite toy when a flashy space ranger arrives, and the two rivals have to survive being lost together.',
    releaseDate: '1995-10-30',
    runtime: 81,
    genres: [genre('Animation'), genre('Comedy'), genre('Family')],
    rating: { average: 8.0, count: 18_936 },
    popularity: 75.4,
    posterPath: '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg',
    backdropPath: '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg',
    certification: 'G',
    director: { id: 7879, name: 'John Lasseter' },
    cast: [
      { id: 31, name: 'Tom Hanks', character: 'Woody' },
      { id: 8873, name: 'Tim Allen', character: 'Buzz Lightyear' },
      { id: 7907, name: 'Don Rickles', character: 'Mr. Potato Head' },
      { id: 2139, name: 'Jim Varney', character: 'Slinky Dog' },
      { id: 7908, name: 'Annie Potts', character: 'Bo Peep' },
    ],
    trailer: { key: 'v-PjgYDrg70', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 30_000_000,
    revenue: 394_436_586,
    keywords: ['toys', 'friendship', 'computer animation', 'jealousy', 'family'],
  },
  {
    id: 129,
    title: 'Spirited Away',
    originalTitle: '千と千尋の神隠し',
    tagline: 'The tunnel led Chihiro to a mysterious town.',
    overview:
      'A sulky ten-year-old wanders into a world of spirits where her parents are turned into pigs, and must work in a bathhouse to find a way home.',
    releaseDate: '2001-07-20',
    runtime: 125,
    genres: [genre('Animation'), genre('Fantasy'), genre('Family')],
    rating: { average: 8.6, count: 16_012 },
    popularity: 83.9,
    posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdropPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    certification: 'PG',
    director: { id: 608, name: 'Hayao Miyazaki' },
    cast: [
      { id: 1253852, name: 'Rumi Hiiragi', character: 'Chihiro Ogino' },
      { id: 1253853, name: 'Miyu Irino', character: 'Haku' },
      { id: 1253854, name: 'Mari Natsuki', character: 'Yubaba' },
      { id: 1253855, name: 'Takashi Naitō', character: 'Akio Ogino' },
      { id: 1253856, name: 'Yasuko Sawaguchi', character: 'Yūko Ogino' },
    ],
    trailer: { key: 'ByXuk9QqQkk', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 19_000_000,
    revenue: 395_580_000,
    keywords: ['spirits', 'fantasy', 'coming of age', 'bathhouse', 'hand-drawn animation'],
  },
  {
    id: 324857,
    title: 'Spider-Man: Into the Spider-Verse',
    originalTitle: 'Spider-Man: Into the Spider-Verse',
    tagline: 'More than one wears the mask.',
    overview:
      'A Brooklyn teenager gains spider powers just as several other Spider-People are pulled into his universe, and all of them have to learn what a hero costs.',
    releaseDate: '2018-12-06',
    runtime: 117,
    genres: [genre('Animation'), genre('Action'), genre('Adventure')],
    rating: { average: 8.4, count: 15_248 },
    popularity: 87.3,
    posterPath: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    backdropPath: '/uUiId6cG32JSRI6RyBQSvQtLjz2.jpg',
    certification: 'PG',
    director: { id: 1244564, name: 'Bob Persichetti' },
    cast: [
      { id: 1329156, name: 'Shameik Moore', character: 'Miles Morales' },
      { id: 1365322, name: 'Jake Johnson', character: 'Peter B. Parker' },
      { id: 1329186, name: 'Hailee Steinfeld', character: 'Gwen Stacy' },
      { id: 17606, name: 'Mahershala Ali', character: 'Aaron Davis' },
      { id: 1329200, name: 'Brian Tyree Henry', character: 'Jefferson Davis' },
    ],
    trailer: { key: 'g4Hbz2jLxvQ', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 90_000_000,
    revenue: 384_298_736,
    keywords: ['multiverse', 'superhero', 'coming of age', 'animation', 'mentor'],
  },
  {
    id: 545611,
    title: 'Everything Everywhere All at Once',
    originalTitle: 'Everything Everywhere All at Once',
    tagline: 'The universe is so much bigger than you realise.',
    overview:
      'A laundromat owner in the middle of an audit learns she is the only version of herself who can stop a threat ripping through the multiverse.',
    releaseDate: '2022-03-24',
    runtime: 139,
    genres: [genre('Action'), genre('Adventure'), genre('Comedy'), genre('Science Fiction')],
    rating: { average: 7.9, count: 9_874 },
    popularity: 82.6,
    posterPath: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg',
    backdropPath: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg',
    certification: 'R',
    director: { id: 1380102, name: 'Daniel Kwan' },
    cast: [
      { id: 1620, name: 'Michelle Yeoh', character: 'Evelyn Wang' },
      { id: 1360007, name: 'Ke Huy Quan', character: 'Waymond Wang' },
      { id: 1360008, name: 'Stephanie Hsu', character: 'Joy Wang' },
      { id: 8945, name: 'Jamie Lee Curtis', character: 'Deirdre Beaubeirdre' },
      { id: 1360009, name: 'James Hong', character: 'Gong Gong' },
    ],
    trailer: { key: 'wxN1T1uxQ2g', name: 'Official Trailer', site: 'YouTube' },
    homepage: null,
    budget: 25_000_000,
    revenue: 143_367_000,
    keywords: ['multiverse', 'family', 'absurdist', 'mother daughter', 'martial arts'],
  },
];

export const FALLBACK_CATALOG: readonly CatalogMovie[] = movies;

/**
 * Offline series catalog. Same rules as the film list: real TMDB series ids,
 * poster paths served from the public image CDN, and YouTube trailer keys that
 * were checked against YouTube's oEmbed endpoint.
 */
interface CatalogSeries {
  id: number;
  title: string;
  originalTitle: string;
  tagline: string;
  overview: string;
  firstAirDate: string;
  lastAirDate: string | null;
  episodeRunTime: number;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status: string;
  inProduction: boolean;
  networks: string[];
  genres: Genre[];
  rating: { average: number; count: number };
  popularity: number;
  posterPath: string;
  certification: string;
  creators: Array<{ id: number; name: string }>;
  cast: Array<{ id: number; name: string; character: string }>;
  trailer: { key: string; name: string; site: string } | null;
  homepage: string | null;
  keywords: string[];
}

const TV_GENRE_IDS: Record<string, number> = {
  'Action & Adventure': 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Mystery: 9648,
  'Sci-Fi & Fantasy': 10765,
  'War & Politics': 10768,
};

function tvGenre(name: keyof typeof TV_GENRE_IDS): Genre {
  return { id: TV_GENRE_IDS[name] ?? 0, name };
}

const series: CatalogSeries[] = [
  {
    id: 1396,
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    tagline: 'All bad things must come to an end.',
    overview:
      'A high-school chemistry teacher facing a terminal diagnosis starts cooking meth to leave his family secure, and slowly becomes the most dangerous man in the desert.',
    firstAirDate: '2008-01-20',
    lastAirDate: '2013-09-29',
    episodeRunTime: 47,
    numberOfSeasons: 5,
    numberOfEpisodes: 62,
    status: 'Ended',
    inProduction: false,
    networks: ['AMC'],
    genres: [tvGenre('Crime'), tvGenre('Drama'), tvGenre('Mystery')],
    rating: { average: 8.9, count: 15_842 },
    popularity: 88.6,
    posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    certification: 'TV-MA',
    creators: [{ id: 66633, name: 'Vince Gilligan' }],
    cast: [
      { id: 17419, name: 'Bryan Cranston', character: 'Walter White' },
      { id: 84497, name: 'Aaron Paul', character: 'Jesse Pinkman' },
      { id: 84498, name: 'Anna Gunn', character: 'Skyler White' },
      { id: 84499, name: 'Dean Norris', character: 'Hank Schrader' },
      { id: 84500, name: 'Betsy Brandt', character: 'Marie Schrader' },
    ],
    trailer: { key: 'HhesaQXLuRY', name: 'First season trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['drug trade', 'antihero', 'chemistry', 'crime', 'new mexico', 'empire'],
  },
  {
    id: 66732,
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    tagline: 'Every ending has a beginning.',
    overview:
      'In a small Indiana town a boy vanishes, and his friends uncover a lab, a girl with powers and a dimension pressing against the edge of their world.',
    firstAirDate: '2016-07-15',
    lastAirDate: '2025-12-31',
    episodeRunTime: 51,
    numberOfSeasons: 5,
    numberOfEpisodes: 42,
    status: 'Ended',
    inProduction: false,
    networks: ['Netflix'],
    genres: [tvGenre('Sci-Fi & Fantasy'), tvGenre('Mystery'), tvGenre('Drama')],
    rating: { average: 8.6, count: 18_204 },
    popularity: 94.1,
    posterPath: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    certification: 'TV-14',
    creators: [{ id: 1400001, name: 'Matt Duffer' }, { id: 1400002, name: 'Ross Duffer' }],
    cast: [
      { id: 1400003, name: 'Millie Bobby Brown', character: 'Eleven' },
      { id: 1400004, name: 'Finn Wolfhard', character: 'Mike Wheeler' },
      { id: 1400005, name: 'Winona Ryder', character: 'Joyce Byers' },
      { id: 1400006, name: 'David Harbour', character: 'Jim Hopper' },
      { id: 1400007, name: 'Gaten Matarazzo', character: 'Dustin Henderson' },
    ],
    trailer: { key: 'b9EkMc79ZSU', name: 'Final season trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['small town', 'parallel dimension', 'monster', 'eighties', 'telekinesis'],
  },
  {
    id: 1399,
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    tagline: 'Winter is coming.',
    overview:
      'Noble houses scheme for a throne while an ancient enemy stirs beyond a wall of ice, and the war for the living becomes the only war that matters.',
    firstAirDate: '2011-04-17',
    lastAirDate: '2019-05-19',
    episodeRunTime: 57,
    numberOfSeasons: 8,
    numberOfEpisodes: 73,
    status: 'Ended',
    inProduction: false,
    networks: ['HBO'],
    genres: [tvGenre('Sci-Fi & Fantasy'), tvGenre('Drama'), tvGenre('Action & Adventure')],
    rating: { average: 8.4, count: 24_611 },
    popularity: 90.3,
    posterPath: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    certification: 'TV-MA',
    creators: [{ id: 9813, name: 'David Benioff' }, { id: 9812, name: 'D. B. Weiss' }],
    cast: [
      { id: 1400010, name: 'Peter Dinklage', character: 'Tyrion Lannister' },
      { id: 1400011, name: 'Emilia Clarke', character: 'Daenerys Targaryen' },
      { id: 1400012, name: 'Kit Harington', character: 'Jon Snow' },
      { id: 1400013, name: 'Lena Headey', character: 'Cersei Lannister' },
      { id: 1400014, name: 'Sophie Turner', character: 'Sansa Stark' },
    ],
    trailer: { key: 'KPLWWIOCOOQ', name: 'Official series trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['fantasy', 'throne', 'dragons', 'noble houses', 'winter', 'war'],
  },
  {
    id: 100088,
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    tagline: 'Find the light.',
    overview:
      'Twenty years after a fungal outbreak ends civilisation, a smuggler escorts a teenage girl across a ruined America because she may be the only hope for a cure.',
    firstAirDate: '2023-01-15',
    lastAirDate: '2025-05-25',
    episodeRunTime: 55,
    numberOfSeasons: 2,
    numberOfEpisodes: 16,
    status: 'Returning Series',
    inProduction: true,
    networks: ['HBO'],
    genres: [tvGenre('Drama'), tvGenre('Sci-Fi & Fantasy'), tvGenre('Action & Adventure')],
    rating: { average: 8.6, count: 8_320 },
    popularity: 86.4,
    posterPath: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1390001, name: 'Craig Mazin' }, { id: 1390002, name: 'Neil Druckmann' }],
    cast: [
      { id: 1390003, name: 'Pedro Pascal', character: 'Joel Miller' },
      { id: 1390004, name: 'Bella Ramsey', character: 'Ellie Williams' },
      { id: 1390005, name: 'Gabriel Luna', character: 'Tommy Miller' },
      { id: 1390006, name: 'Isabela Merced', character: 'Dina' },
      { id: 1390007, name: 'Kaitlyn Dever', character: 'Abby' },
    ],
    trailer: { key: 'uLtkt8BonwM', name: 'Official trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['post-apocalyptic', 'outbreak', 'survival', 'father daughter', 'road trip'],
  },
  {
    id: 94605,
    title: 'Arcane',
    originalTitle: 'Arcane',
    tagline: 'Fight for your family.',
    overview:
      'Two sisters are split by a city’s divide between glittering progress and poisoned undercity, and the magic they discover will decide which side burns.',
    firstAirDate: '2021-11-06',
    lastAirDate: '2024-11-23',
    episodeRunTime: 42,
    numberOfSeasons: 2,
    numberOfEpisodes: 18,
    status: 'Ended',
    inProduction: false,
    networks: ['Netflix'],
    genres: [tvGenre('Animation'), tvGenre('Sci-Fi & Fantasy'), tvGenre('Action & Adventure')],
    rating: { average: 8.7, count: 5_902 },
    popularity: 84.9,
    posterPath: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
    certification: 'TV-14',
    creators: [{ id: 1380001, name: 'Christian Linke' }, { id: 1380002, name: 'Alex Yee' }],
    cast: [
      { id: 1380003, name: 'Hailee Steinfeld', character: 'Vi' },
      { id: 1380004, name: 'Ella Purnell', character: 'Jinx' },
      { id: 1380005, name: 'Kevin Alejandro', character: 'Jayce' },
      { id: 1380006, name: 'Katie Leung', character: 'Caitlyn' },
      { id: 1380007, name: 'Jason Spisak', character: 'Silco' },
    ],
    trailer: { key: 'fXmAurh012s', name: 'Official trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['steampunk', 'sisters', 'class divide', 'magic', 'animated drama'],
  },
  {
    id: 95396,
    title: 'Severance',
    originalTitle: 'Severance',
    tagline: 'Enjoy your new life.',
    overview:
      'Office workers at a secretive company have their memories surgically divided between work and home, until a colleague’s disappearance makes both halves ask questions.',
    firstAirDate: '2022-02-18',
    lastAirDate: '2025-03-21',
    episodeRunTime: 50,
    numberOfSeasons: 2,
    numberOfEpisodes: 19,
    status: 'Returning Series',
    inProduction: true,
    networks: ['Apple TV+'],
    genres: [tvGenre('Drama'), tvGenre('Mystery'), tvGenre('Sci-Fi & Fantasy')],
    rating: { average: 8.7, count: 3_874 },
    popularity: 79.2,
    posterPath: '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1370001, name: 'Dan Erickson' }],
    cast: [
      { id: 1370002, name: 'Adam Scott', character: 'Mark Scout' },
      { id: 1370003, name: 'Britt Lower', character: 'Helly R.' },
      { id: 1370004, name: 'Zach Cherry', character: 'Dylan George' },
      { id: 1370005, name: 'John Turturro', character: 'Irving Bailiff' },
      { id: 1370006, name: 'Patricia Arquette', character: 'Harmony Cobel' },
    ],
    trailer: { key: 'xEQP4VVuyrY', name: 'Official trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['memory', 'office', 'corporate', 'conspiracy', 'identity'],
  },
  {
    id: 136315,
    title: 'The Bear',
    originalTitle: 'The Bear',
    tagline: 'Every second counts.',
    overview:
      'A young chef comes home to run his family’s chaotic sandwich shop and drags a found family of line cooks toward something like excellence.',
    firstAirDate: '2022-06-23',
    lastAirDate: '2025-06-25',
    episodeRunTime: 31,
    numberOfSeasons: 4,
    numberOfEpisodes: 38,
    status: 'Returning Series',
    inProduction: true,
    networks: ['Hulu'],
    genres: [tvGenre('Drama'), tvGenre('Comedy')],
    rating: { average: 8.6, count: 2_914 },
    popularity: 76.8,
    posterPath: '/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1360001, name: 'Christopher Storer' }],
    cast: [
      { id: 1360002, name: 'Jeremy Allen White', character: 'Carmy Berzatto' },
      { id: 1360003, name: 'Ayo Edebiri', character: 'Sydney Adamu' },
      { id: 1360004, name: 'Ebon Moss-Bachrach', character: 'Richie Jerimovich' },
      { id: 1360005, name: 'Liza Colón-Zayas', character: 'Tina Marrero' },
      { id: 1360006, name: 'Abby Elliott', character: 'Natalie Berzatto' },
    ],
    trailer: { key: 'y-cqqAJIXhs', name: 'Official trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['restaurant', 'kitchen', 'grief', 'family', 'craft'],
  },
  {
    id: 70523,
    title: 'Dark',
    originalTitle: 'Dark',
    tagline: 'The end is the beginning.',
    overview:
      'A child disappears from a German town and four families discover a cave that connects three generations, where every attempt to fix the past creates the future.',
    firstAirDate: '2017-12-01',
    lastAirDate: '2020-06-27',
    episodeRunTime: 57,
    numberOfSeasons: 3,
    numberOfEpisodes: 26,
    status: 'Ended',
    inProduction: false,
    networks: ['Netflix'],
    genres: [tvGenre('Sci-Fi & Fantasy'), tvGenre('Mystery'), tvGenre('Drama')],
    rating: { average: 8.4, count: 6_451 },
    popularity: 71.5,
    posterPath: '/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1350001, name: 'Baran bo Odar' }, { id: 1350002, name: 'Jantje Friese' }],
    cast: [
      { id: 1350003, name: 'Louis Hofmann', character: 'Jonas Kahnwald' },
      { id: 1350004, name: 'Lisa Vicari', character: 'Martha Nielsen' },
      { id: 1350005, name: 'Oliver Masucci', character: 'Ulrich Nielsen' },
      { id: 1350006, name: 'Karoline Eichhorn', character: 'Charlotte Doppler' },
      { id: 1350007, name: 'Andreas Pietschmann', character: 'The Stranger' },
    ],
    trailer: { key: 'rrwycJ08PSA', name: 'Season 1 trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['time travel', 'missing child', 'small town', 'family tree', 'determinism'],
  },
  {
    id: 87108,
    title: 'Chernobyl',
    originalTitle: 'Chernobyl',
    tagline: 'What is the cost of lies?',
    overview:
      'The 1986 reactor disaster and the people who contained it, told through scientists and officials discovering how far the state will go to protect a story.',
    firstAirDate: '2019-05-06',
    lastAirDate: '2019-06-03',
    episodeRunTime: 65,
    numberOfSeasons: 1,
    numberOfEpisodes: 5,
    status: 'Ended',
    inProduction: false,
    networks: ['HBO'],
    genres: [tvGenre('Drama'), tvGenre('Documentary')],
    rating: { average: 8.7, count: 5_188 },
    popularity: 68.2,
    posterPath: '/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1340001, name: 'Craig Mazin' }],
    cast: [
      { id: 1340002, name: 'Jared Harris', character: 'Valery Legasov' },
      { id: 1340003, name: 'Stellan Skarsgård', character: 'Boris Shcherbina' },
      { id: 1340004, name: 'Emily Watson', character: 'Ulana Khomyuk' },
      { id: 1340005, name: 'Paul Ritter', character: 'Anatoly Dyatlov' },
      { id: 1340006, name: 'Jessie Buckley', character: 'Lyudmilla Ignatenko' },
    ],
    trailer: { key: 's9APLXM9Ei8', name: 'Official trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['nuclear disaster', 'cover up', 'science', 'history', 'sacrifice'],
  },
  {
    id: 76331,
    title: 'Succession',
    originalTitle: 'Succession',
    tagline: 'You’re not serious people.',
    overview:
      'The ageing founder of a media empire refuses to name an heir, and his four children spend their lives competing for a crown none of them can hold.',
    firstAirDate: '2018-06-03',
    lastAirDate: '2023-05-28',
    episodeRunTime: 60,
    numberOfSeasons: 4,
    numberOfEpisodes: 39,
    status: 'Ended',
    inProduction: false,
    networks: ['HBO'],
    genres: [tvGenre('Drama'), tvGenre('Comedy')],
    rating: { average: 8.4, count: 4_377 },
    popularity: 66.4,
    posterPath: '/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1330001, name: 'Jesse Armstrong' }],
    cast: [
      { id: 1330002, name: 'Brian Cox', character: 'Logan Roy' },
      { id: 1330003, name: 'Jeremy Strong', character: 'Kendall Roy' },
      { id: 1330004, name: 'Sarah Snook', character: 'Shiv Roy' },
      { id: 1330005, name: 'Kieran Culkin', character: 'Roman Roy' },
      { id: 1330006, name: 'Matthew Macfadyen', character: 'Tom Wambsgans' },
    ],
    trailer: { key: 'OzYxJV_rmE8', name: 'Season 1 trailer', site: 'YouTube' },
    homepage: null,
    keywords: ['media empire', 'family business', 'succession', 'satire', 'power'],
  },
  {
    id: 87739,
    title: "The Queen's Gambit",
    originalTitle: "The Queen's Gambit",
    tagline: 'Every move counts.',
    overview:
      'An orphaned prodigy learns chess in a basement and grows into a grandmaster chasing the world title while fighting her own appetites.',
    firstAirDate: '2020-10-23',
    lastAirDate: '2020-10-23',
    episodeRunTime: 60,
    numberOfSeasons: 1,
    numberOfEpisodes: 7,
    status: 'Ended',
    inProduction: false,
    networks: ['Netflix'],
    genres: [tvGenre('Drama')],
    rating: { average: 8.6, count: 4_806 },
    popularity: 63.9,
    posterPath: '/zU0htwkhNvBQdVSIKB9s6hgVeFK.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1320001, name: 'Scott Frank' }, { id: 1320002, name: 'Allan Scott' }],
    cast: [
      { id: 1320003, name: 'Anya Taylor-Joy', character: 'Beth Harmon' },
      { id: 1320004, name: 'Bill Camp', character: 'Mr. Shaibel' },
      { id: 1320005, name: 'Marielle Heller', character: 'Alma Wheatley' },
      { id: 1320006, name: 'Moses Ingram', character: 'Jolene' },
      { id: 1320007, name: 'Thomas Brodie-Sangster', character: 'Benny Watts' },
    ],
    trailer: null,
    homepage: null,
    keywords: ['chess', 'prodigy', 'addiction', 'tournament', 'cold war'],
  },
  {
    id: 126308,
    title: 'Shōgun',
    originalTitle: '将軍',
    tagline: 'A new age is born.',
    overview:
      'A shipwrecked English pilot, a doomed lord and a noblewoman with a dangerous mind navigate the last years of a warring Japan.',
    firstAirDate: '2024-02-27',
    lastAirDate: '2024-04-23',
    episodeRunTime: 60,
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    status: 'Returning Series',
    inProduction: true,
    networks: ['FX'],
    genres: [tvGenre('Drama'), tvGenre('War & Politics'), tvGenre('Action & Adventure')],
    rating: { average: 8.6, count: 2_133 },
    popularity: 61.7,
    posterPath: '/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
    certification: 'TV-MA',
    creators: [{ id: 1310001, name: 'Rachel Kondo' }, { id: 1310002, name: 'Justin Marks' }],
    cast: [
      { id: 1310003, name: 'Hiroyuki Sanada', character: 'Yoshii Toranaga' },
      { id: 1310004, name: 'Cosmo Jarvis', character: 'John Blackthorne' },
      { id: 1310005, name: 'Anna Sawai', character: 'Toda Mariko' },
      { id: 1310006, name: 'Tadanobu Asano', character: 'Kashigi Yabushige' },
      { id: 1310007, name: 'Takehiro Hira', character: 'Ishido Kazunari' },
    ],
    trailer: null,
    homepage: null,
    keywords: ['samurai', 'war', 'politics', 'japan', 'historical'],
  },
];

export const FALLBACK_SERIES: readonly CatalogSeries[] = series;

export const CATALOG_TV_GENRES: readonly Genre[] = Array.from(
  new Map(series.flatMap((show) => show.genres.map((entry) => [entry.name, entry] as const))).values(),
).sort((a, b) => a.id - b.id);

export const CATALOG_GENRES: readonly Genre[] = Array.from(
  new Map(
    [...movies.flatMap((movie) => movie.genres), ...series.flatMap((show) => show.genres)].map(
      (entry) => [entry.name, entry] as const,
    ),
  ).values(),
).sort((a, b) => a.id - b.id);

function toSummary(movie: CatalogMovie): MovieSummary {
  return {
    id: movie.id,
    mediaType: 'movie',
    title: movie.title,
    overview: movie.overview,
    releaseDate: movie.releaseDate,
    posterUrl: imageUrl(movie.posterPath),
    backdropUrl: imageUrl(movie.backdropPath, 'w1280'),
    rating: movie.rating,
    popularity: movie.popularity,
  };
}

function toDetails(movie: CatalogMovie): MovieDetails {
  const cast: CastMember[] = movie.cast.map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character,
    profileUrl: null,
  }));

  return {
    ...toSummary(movie),
    originalTitle: movie.originalTitle,
    tagline: movie.tagline,
    status: 'Released',
    runtime: movie.runtime,
    genres: movie.genres,
    certification: movie.certification,
    homepage: movie.homepage,
    director: movie.director,
    cast,
    trailer: movie.trailer,
    budget: movie.budget,
    revenue: movie.revenue,
  };
}

function paginate(list: readonly CatalogMovie[], page: number): PaginatedMovies {
  const start = (page - 1) * CATALOG_PAGE_SIZE;
  return {
    page,
    totalPages: Math.ceil(list.length / CATALOG_PAGE_SIZE),
    totalResults: list.length,
    results: list.slice(start, start + CATALOG_PAGE_SIZE).map(toSummary),
  };
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'with', 'from', 'for', 'about', 'that', 'this',
  'movie', 'movies', 'film', 'films', 'something', 'anything', 'want', 'watch', 'watching',
  'looking', 'like', 'please', 'show', 'find', 'give', 'some', 'any', 'but', 'make', 'into',
  'me', 'my', 'i', 'is', 'are', 'was', 'were', 'be', 'to', 'in', 'on', 'at', 'it', 'its',
  'great', 'good', 'best', 'rated', 'highly', 'really', 'very', 'much', 'more', 'most',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function releaseYear(movie: CatalogMovie): number {
  return Number(movie.releaseDate.slice(0, 4));
}

function relevance(movie: CatalogMovie, tokens: readonly string[]): number {
  if (tokens.length === 0) return 0;
  const title = movie.title.toLowerCase();
  const keywords = movie.keywords.join(' ').toLowerCase();
  const genres = movie.genres.map((entry) => entry.name).join(' ').toLowerCase();
  const overview = movie.overview.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 4;
    if (keywords.includes(token)) score += 3;
    if (genres.includes(token)) score += 2;
    if (overview.includes(token)) score += 1;
  }
  return score;
}

/** Newest releases first, exactly like the live TMDB feed. */
export function catalogLatest(page: number): PaginatedMovies {
  const sorted = [...movies].sort((a, b) => {
    const byDate = b.releaseDate.localeCompare(a.releaseDate);
    return byDate !== 0 ? byDate : a.id - b.id;
  });
  return paginate(sorted, page);
}

export function catalogDetails(id: number): MovieDetails | null {
  const movie = movies.find((entry) => entry.id === id);
  return movie ? toDetails(movie) : null;
}

export function catalogSnapshot(id: number): MovieSnapshot | null {
  const movie = movies.find((entry) => entry.id === id);
  if (!movie) return null;
  return {
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    releaseDate: movie.releaseDate,
    voteAverage: movie.rating.average,
  };
}

export function catalogTextSearch(query: string, page: number): PaginatedMovies {
  const tokens = tokenize(query);
  if (tokens.length === 0) return paginate([...movies].sort(byPopularity), page);

  const matches = movies
    .map((movie) => ({ movie, score: relevance(movie, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.movie.popularity - a.movie.popularity || a.movie.id - b.movie.id)
    .map((entry) => entry.movie);

  return paginate(matches, page);
}

function byPopularity(a: CatalogMovie, b: CatalogMovie): number {
  return b.popularity - a.popularity || a.id - b.id;
}

/**
 * Deterministic filter used for AI search in offline mode. The interpretation
 * drives genre, year, rating and keyword filters; the raw query only breaks ties.
 */
export function catalogFilterMovies(
  query: string,
  interpretation: QueryInterpretation,
  page: number,
): PaginatedMovies {
  const wantedGenres = interpretation.genres.map((name) => name.trim().toLowerCase());
  const keywords = interpretation.keywords.map((value) => value.trim().toLowerCase()).filter(Boolean);
  const tokens = tokenize(query);

  const hasFilters =
    wantedGenres.length > 0 ||
    keywords.length > 0 ||
    interpretation.yearFrom !== null ||
    interpretation.yearTo !== null ||
    interpretation.minRating !== null;

  const matches = movies
    .filter((movie) => {
      if (wantedGenres.length > 0) {
        const movieGenres = movie.genres.map((entry) => entry.name.toLowerCase());
        if (!movieGenres.some((name) => wantedGenres.includes(name))) return false;
      }

      const year = releaseYear(movie);
      if (interpretation.yearFrom !== null && year < interpretation.yearFrom) return false;
      if (interpretation.yearTo !== null && year > interpretation.yearTo) return false;

      if (interpretation.minRating !== null && movie.rating.average < interpretation.minRating) {
        return false;
      }

      if (keywords.length > 0) {
        const haystack = [
          movie.title,
          movie.overview,
          ...movie.keywords,
          ...movie.genres.map((entry) => entry.name),
        ]
          .join(' ')
          .toLowerCase();
        if (!keywords.some((keyword) => haystack.includes(keyword))) return false;
      }

      return true;
    });

  const pool = hasFilters ? matches : [...movies];

  const sorted = pool.map((movie) => ({ movie, score: relevance(movie, tokens) }));
  sorted.sort((a, b) => {
    if (interpretation.sortBy === 'vote_average.desc') {
      return b.movie.rating.average - a.movie.rating.average || byPopularity(a.movie, b.movie);
    }
    if (interpretation.sortBy === 'primary_release_date.desc') {
      const byDate = b.movie.releaseDate.localeCompare(a.movie.releaseDate);
      return byDate !== 0 ? byDate : byPopularity(a.movie, b.movie);
    }
    return b.score - a.score || byPopularity(a.movie, b.movie);
  });

  return paginate(
    sorted.map((entry) => entry.movie),
    page,
  );
}

/* ------------------------------------------------------------------ *
 * Series
 * ------------------------------------------------------------------ */

function toTvSummary(show: CatalogSeries): TvSummary {
  return {
    id: show.id,
    mediaType: 'tv',
    title: show.title,
    overview: show.overview,
    releaseDate: show.firstAirDate,
    posterUrl: imageUrl(show.posterPath),
    backdropUrl: imageUrl(show.posterPath, 'w1280'),
    rating: show.rating,
    popularity: show.popularity,
  };
}

function toTvDetails(show: CatalogSeries): TvDetails {
  return {
    ...toTvSummary(show),
    originalTitle: show.originalTitle,
    tagline: show.tagline,
    status: show.status,
    genres: show.genres,
    certification: show.certification,
    homepage: show.homepage,
    creators: show.creators,
    cast: show.cast.map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profileUrl: null,
    })),
    trailer: show.trailer,
    episodeRunTime: show.episodeRunTime,
    numberOfSeasons: show.numberOfSeasons,
    numberOfEpisodes: show.numberOfEpisodes,
    lastAirDate: show.lastAirDate,
    inProduction: show.inProduction,
    networks: show.networks,
    seasons: [],
  };
}

function paginateTv(list: readonly CatalogSeries[], page: number): PaginatedTv {
  const start = (page - 1) * CATALOG_PAGE_SIZE;
  return {
    page,
    totalPages: Math.ceil(list.length / CATALOG_PAGE_SIZE),
    totalResults: list.length,
    results: list.slice(start, start + CATALOG_PAGE_SIZE).map(toTvSummary),
  };
}

function bySeriesPopularity(a: CatalogSeries, b: CatalogSeries): number {
  return b.popularity - a.popularity || a.id - b.id;
}

function seriesYear(show: CatalogSeries): number {
  return Number(show.firstAirDate.slice(0, 4));
}

/** Popular series first, mirroring the live TMDB discover feed. */
export function catalogTvFeed(page: number): PaginatedTv {
  return paginateTv([...series].sort(bySeriesPopularity), page);
}

export function catalogTvDetails(id: number): TvDetails | null {
  const show = series.find((entry) => entry.id === id);
  return show ? toTvDetails(show) : null;
}

function tvRelevance(show: CatalogSeries, tokens: readonly string[]): number {
  if (tokens.length === 0) return 0;
  const title = show.title.toLowerCase();
  const keywords = show.keywords.join(' ').toLowerCase();
  const genres = show.genres.map((entry) => entry.name).join(' ').toLowerCase();
  const overview = show.overview.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 4;
    if (keywords.includes(token)) score += 3;
    if (genres.includes(token)) score += 2;
    if (overview.includes(token)) score += 1;
  }
  return score;
}

export function catalogTvSearch(query: string, page: number): PaginatedTv {
  const tokens = tokenize(query);
  if (tokens.length === 0) return catalogTvFeed(page);

  const matches = series
    .map((show) => ({ show, score: tvRelevance(show, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || bySeriesPopularity(a.show, b.show))
    .map((entry) => entry.show);

  return paginateTv(matches, page);
}

/** Deterministic series filter used by `/api/tv/discover` when TMDB is offline. */
export function catalogFilterTv(
  query: string,
  interpretation: QueryInterpretation,
  page: number,
): PaginatedTv {
  const wantedGenres = interpretation.genres.map((name) => name.trim().toLowerCase());
  const tokens = tokenize(query);

  const matches = series.filter((show) => {
    if (wantedGenres.length > 0) {
      const showGenres = show.genres.map((entry) => entry.name.toLowerCase());
      if (!showGenres.some((name) => wantedGenres.includes(name))) return false;
    }

    const year = seriesYear(show);
    if (interpretation.yearFrom !== null && year < interpretation.yearFrom) return false;
    if (interpretation.yearTo !== null && year > interpretation.yearTo) return false;

    if (interpretation.minRating !== null && show.rating.average < interpretation.minRating) {
      return false;
    }

    return true;
  });

  const sorted = [...matches].sort((a, b) => {
    if (interpretation.sortBy === 'vote_average.desc') {
      return b.rating.average - a.rating.average || bySeriesPopularity(a, b);
    }
    if (interpretation.sortBy === 'first_air_date.desc') {
      const byDate = b.firstAirDate.localeCompare(a.firstAirDate);
      return byDate !== 0 ? byDate : bySeriesPopularity(a, b);
    }
    return (
      tvRelevance(b, tokens) - tvRelevance(a, tokens) || bySeriesPopularity(a, b)
    );
  });

  return paginateTv(sorted, page);
}

/**
 * Mixed film + series search used by `GET /api/search` in offline mode.
 * Films and series are scored with the same token rules, then interleaved by
 * score and popularity so a title search never silently drops one medium.
 */
export function catalogMixedSearch(query: string, page: number): PaginatedMedia {
  const tokens = tokenize(query);

  const scored: Array<{ item: MediaSummary; score: number; popularity: number }> = [
    ...movies.map((movie) => ({
      item: toSummary(movie),
      score: relevance(movie, tokens),
      popularity: movie.popularity,
    })),
    ...series.map((show) => ({
      item: toTvSummary(show),
      score: tvRelevance(show, tokens),
      popularity: show.popularity,
    })),
  ];

  const filtered = tokens.length === 0 ? scored : scored.filter((entry) => entry.score > 0);
  filtered.sort((a, b) => b.score - a.score || b.popularity - a.popularity || a.item.id - b.item.id);

  const start = (page - 1) * CATALOG_PAGE_SIZE;
  return {
    page,
    totalPages: Math.ceil(filtered.length / CATALOG_PAGE_SIZE),
    totalResults: filtered.length,
    results: filtered.slice(start, start + CATALOG_PAGE_SIZE).map((entry) => entry.item),
  };
}
