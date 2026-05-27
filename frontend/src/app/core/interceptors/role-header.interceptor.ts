// Deprecated: replaced by auth.interceptor.ts which attaches a JWT Bearer token.
// Kept as a re-export so any straggling import won't break at build time.
export { authInterceptor as roleHeaderInterceptor } from './auth.interceptor';
