import { proxyApiRequest } from '../apiProxy.ts';

interface PagesContext {
  request: Request;
  env: { STAGING_API_ORIGIN?: string };
}

export const onRequest = (context: PagesContext) => proxyApiRequest(context.request, context.env.STAGING_API_ORIGIN);
