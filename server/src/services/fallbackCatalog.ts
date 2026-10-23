import { imageUrl } from '../lib/images.js';
import type {
  CastMember,
  Genre,
  MovieDetails,
  MovieSnapshot,
  MovieSummary,
  PaginatedMovies,
  QueryInterpretation,
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

export const CATALOG_GENRES: readonly Genre[] = Array.from(
  new Map(movies.flatMap((movie) => movie.genres.map((entry) => [entry.name, entry] as const))).values(),
).sort((a, b) => a.id - b.id);

function toSummary(movie: CatalogMovie): MovieSummary {
  return {
    id: movie.id,
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
