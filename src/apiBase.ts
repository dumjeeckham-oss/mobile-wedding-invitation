export const resolveApiBase = (options: { dev: boolean; configured?: string }) => {
  const configured = String(options.configured || '').trim().replace(/\/$/, '');
  return options.dev && configured ? configured : '';
};

const viteEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean; VITE_ADMIN_API_BASE_URL?: string } }).env;

export const apiBase = resolveApiBase({
  dev: Boolean(viteEnv?.DEV),
  configured: viteEnv?.VITE_ADMIN_API_BASE_URL,
});
