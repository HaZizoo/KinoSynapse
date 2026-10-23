import { imageUrl } from './images.js';
import type { PublicUser, UserRecord } from '../types.js';

/** Never expose the password hash or internal storage ids. */
export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    watchlist: user.watchlist.map((item) => ({
      movieId: item.movieId,
      title: item.title,
      posterUrl: imageUrl(item.posterPath, 'w342'),
      releaseDate: item.releaseDate,
      voteAverage: item.voteAverage,
      addedAt: item.addedAt,
    })),
    createdAt: user.createdAt,
  };
}
