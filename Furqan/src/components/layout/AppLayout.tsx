import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { Sidebar } from './nav';
import { BottomNav } from './BottomNav';
import { MiniPlayer } from './MiniPlayer';
import { TopBar } from './TopBar';
import { ModuleWorkspace } from '../../shared/ModuleWorkspace';
import { SectionSwitcherProvider } from '../../shared/SectionSwitcher';

export function AppLayout() {
  const readingMode = useAppSelector((s) => s.settings.readingMode);
  const location = useLocation();
  const isReaderRoute = /^\/surah(?:\/|$)/.test(location.pathname);
  const mainRef = useRef<HTMLElement>(null);
  const [isHidden, setIsHidden] = useState(false);

  // Track scroll direction on the main reading container
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = mainEl.scrollTop;
      // Hide when scrolling down past 50px
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <SectionSwitcherProvider>
      <div className={`min-h-dvh bg-canvas text-ink ${isReaderRoute ? 'reader-app-shell' : ''}`}>
        {!readingMode && <Sidebar />}
        <div className={readingMode ? '' : 'md.pl-60'}>
          <TopBar />
          <main
            ref={mainRef}
            className={isReaderRoute
              ? 'min-h-dvh w-full px-4 pt-0 pb-24'
              : `mx-auto w-full max-w-3xl px-4 ${readingMode ? 'safe-t pt-6' : 'pt-4'} ${readingMode ? 'layout-bottom-reading' : 'layout-bottom-default'}`}
          >
            <ModuleWorkspace />
            <Outlet />
          </main>
        </div>
        {!isReaderRoute && <MiniPlayer isHidden={isHidden} />}
        <BottomNav isHidden={isHidden} />
      </div>
    </SectionSwitcherProvider>
  );
}