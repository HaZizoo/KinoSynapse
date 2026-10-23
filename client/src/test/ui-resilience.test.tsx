import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { getLatestMovies } from '../api/client';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SafeImage } from '../components/SafeImage';

function ExplodingScreen(): ReactNode {
  throw new Error('render exploded');
}

afterEach(() => {
  vi.useRealTimers();
});

describe('UI resilience', () => {
  it('shows a recoverable screen when a render throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ExplodingScreen />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/projector jammed/i);
    expect(screen.getByRole('button', { name: /reload kinosynapse/i })).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('swaps a failed poster request for the fallback UI', () => {
    render(
      <SafeImage
        src="https://image.tmdb.org/t/p/w500/missing.jpg"
        alt="Missing poster"
        fallback={<span>No artwork</span>}
      />,
    );

    fireEvent.error(screen.getByAltText('Missing poster'));

    expect(screen.getByText('No artwork')).toBeInTheDocument();
    expect(screen.queryByAltText('Missing poster')).not.toBeInTheDocument();
  });

  it('renders the fallback immediately when TMDB returns no image path', () => {
    render(<SafeImage src={null} alt="No poster" fallback={<span>No artwork</span>} />);

    expect(screen.getByText('No artwork')).toBeInTheDocument();
    expect(screen.queryByAltText('No poster')).not.toBeInTheDocument();
  });

  it('abandons a hung API request instead of loading forever', async () => {
    vi.useFakeTimers();
    let aborted = false;

    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              aborted = true;
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const request = getLatestMovies(1);
    const rejection = expect(request).rejects.toThrow(/took too long/i);

    await vi.advanceTimersByTimeAsync(20_000);
    await rejection;
    expect(aborted).toBe(true);
  });
});
