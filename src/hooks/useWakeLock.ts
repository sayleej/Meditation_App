import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  released: boolean;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    let active = true;

    const requestLock = async () => {
      const nav = navigator as WakeLockNavigator;
      if (!enabled || !nav.wakeLock || document.visibilityState !== 'visible') {
        return;
      }

      try {
        sentinelRef.current = await nav.wakeLock.request('screen');
      } catch {
        // Fail silently to gracefully fallback on unsupported devices.
      }
    };

    const releaseLock = async () => {
      if (sentinelRef.current && !sentinelRef.current.released) {
        try {
          await sentinelRef.current.release();
        } catch {
          // Ignore release failures.
        }
      }
      sentinelRef.current = null;
    };

    const onVisibilityChange = () => {
      if (!active) return;
      if (document.visibilityState === 'visible' && enabled) {
        requestLock();
      } else {
        void releaseLock();
      }
    };

    void requestLock();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void releaseLock();
    };
  }, [enabled]);
}
