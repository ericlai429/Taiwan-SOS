import { useState, useEffect } from 'react';

export function useViewport() {
  const [viewport, setViewport] = useState(() => getViewportInfo());

  function getViewportInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    return {
      width,
      height,
      isLandscape,
      isPortrait: !isLandscape,
      isMobile,
      isTablet,
      isDesktop,
      orientation: isLandscape ? 'landscape' : 'portrait'
    };
  }

  useEffect(() => {
    function handleResize() {
      // 修正行動裝置 100vh 扣除網址列高度
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewport(getViewportInfo());
    }

    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
}
