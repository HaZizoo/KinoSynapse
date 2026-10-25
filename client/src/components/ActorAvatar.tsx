import { SafeImage } from './SafeImage';

interface ActorAvatarProps {
  name: string;
  profileUrl: string | null | undefined;
  className?: string;
}

/**
 * Up to two initials, using the first and last name parts: "Keanu Reeves" -> KR,
 * "Carrie-Anne Moss" -> CM, "Cher" -> CH.
 */
export function actorInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/**
 * TMDB cast portraits with a graceful monogram fallback. Covers a missing
 * `profile_path`, a broken image URL, and the offline catalog (which has no
 * portrait paths), so the cast grid never shows a broken image or empty box.
 */
export function ActorAvatar({ name, profileUrl, className }: ActorAvatarProps) {
  return (
    <SafeImage
      src={profileUrl}
      alt={`${name} portrait`}
      className={className}
      fallback={
        <div
          className="grid h-full w-full place-items-center bg-[linear-gradient(155deg,#1d1d22,#0e0e10)]"
          aria-hidden="true"
        >
          <span className="font-display text-3xl leading-none tracking-[0.08em] text-cream/70">
            {actorInitials(name)}
          </span>
        </div>
      }
    />
  );
}
