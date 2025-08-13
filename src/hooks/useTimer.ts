import { useEffect } from 'react';

/** Runs callback every second while `running` is true. */
export const useTimer = (running: boolean, cb: () => void) => {
  useEffect(() => {
    if (!running) return;
    const id = setInterval(cb, 1000);
    return () => clearInterval(id);
  }, [running, cb]);
};