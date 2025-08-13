type Level = 'debug' | 'info' | 'warn' | 'error';
const lvlOrder: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const current = (import.meta.env.VITE_LOG_LEVEL ?? 'info') as Level;

export const log = (level: Level, msg: string, data?: unknown) => {
  if (lvlOrder[level] < lvlOrder[current]) return;
  const prefix = `[ColorPath][${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](
    prefix, msg, data ?? '',
  );
};