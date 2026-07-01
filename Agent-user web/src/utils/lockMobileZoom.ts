let hasLockedMobileZoom = false;

export function lockMobileZoom() {
  if (hasLockedMobileZoom || typeof window === 'undefined' || typeof document === 'undefined') return;
  hasLockedMobileZoom = true;

  const isCoarsePointer = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false;
  const isSmallScreen = window.matchMedia?.('(max-width: 900px)').matches ?? false;
  if (!isCoarsePointer && !isSmallScreen) return;

  const preventDefault = (event: Event) => {
    event.preventDefault();
  };

  document.addEventListener('gesturestart', preventDefault, { passive: false });
  document.addEventListener('gesturechange', preventDefault, { passive: false });
  document.addEventListener('gestureend', preventDefault, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 320) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false },
  );

  document.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    },
    { passive: false },
  );
}
