import { useEffect, useRef, useState } from 'react';

const HIDE_AFTER_SCROLL_PX = 100;
const IGNORE_DELTA_PX = 8;

export function useAutoHideDock() {
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  const lastScrollYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollYRef.current;
        lastScrollYRef.current = currentScrollY;

        if (delta > IGNORE_DELTA_PX && currentScrollY > HIDE_AFTER_SCROLL_PX) {
          setIsControlsVisible(false);
        } else if (delta < -IGNORE_DELTA_PX) {
          setIsControlsVisible(true);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return isControlsVisible;
}
