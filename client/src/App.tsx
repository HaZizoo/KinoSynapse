import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import Dashboard from './pages/Dashboard';
import MovieDetail from './pages/MovieDetail';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <WatchlistProvider>
            <div className="flex min-h-dvh flex-col">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-canvas"
              >
                Skip to content
              </a>
              <Header />
              <ScrollToTop />
              <main id="main-content" className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/movies/:movieId" element={<MovieDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <AuthModal />
              <WatchlistDrawer />
            </div>
          </WatchlistProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
