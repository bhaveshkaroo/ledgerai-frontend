/**
 * Sentry Error Monitoring Configuration for Meso LedgerAI
 * 
 * Captures unhandled exceptions, promise rejections, and manual error reports.
 * Sensitive fields (API keys, passwords, tokens) are scrubbed before transmission.
 * 
 * Setup: Set REACT_APP_SENTRY_DSN in .env to your Sentry project DSN.
 * Free tier: 5,000 events/month, 1 user, 30-day retention.
 */
import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';

// Fields to scrub from event data before sending to Sentry
const SENSITIVE_FIELDS = [
  'api_key', 'apiKey', 'api-key', 'password', 'token', 'secret',
  'authorization', 'cookie', 'session', 'SUPABASE_KEY', 'GEMINI_API_KEY',
  'anon_key', 'service_role_key', 'access_token', 'refresh_token'
];

/**
 * Recursively scrub sensitive fields from an object
 */
function scrubSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const scrubbed = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key of Object.keys(scrubbed)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof scrubbed[key] === 'object' && scrubbed[key] !== null) {
      scrubbed[key] = scrubSensitiveData(scrubbed[key]);
    } else if (typeof scrubbed[key] === 'string') {
      // Scrub inline API keys (AIza... pattern for Gemini keys)
      scrubbed[key] = scrubbed[key].replace(/AIza[A-Za-z0-9_-]{30,}/g, '[REDACTED_API_KEY]');
      // Scrub JWT tokens
      scrubbed[key] = scrubbed[key].replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
    }
  }
  
  return scrubbed;
}

export function initSentry() {
  if (!SENTRY_DSN) {
    console.info('[Sentry] No DSN configured (REACT_APP_SENTRY_DSN). Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `meso-ledgerai@${process.env.REACT_APP_VERSION || '0.1.0'}`,
    
    // Performance: sample 20% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    
    // Session replay disabled (privacy-sensitive financial data)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    
    // Before sending any event, scrub sensitive fields
    beforeSend(event) {
      // Scrub request headers
      if (event.request && event.request.headers) {
        event.request.headers = scrubSensitiveData(event.request.headers);
      }
      
      // Scrub breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(bc => {
          if (bc.data) {
            bc.data = scrubSensitiveData(bc.data);
          }
          if (bc.message && typeof bc.message === 'string') {
            bc.message = bc.message.replace(/AIza[A-Za-z0-9_-]{30,}/g, '[REDACTED_API_KEY]');
            bc.message = bc.message.replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
          }
          return bc;
        });
      }
      
      // Scrub extra context
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra);
      }
      
      // Scrub user data except id
      if (event.user) {
        const { id } = event.user;
        event.user = { id: id || 'anonymous' };
      }
      
      return event;
    },
    
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Network request failed',
      'Load failed',
      'Failed to fetch'
    ]
  });

  console.info('[Sentry] Error monitoring initialized (environment: ' + (process.env.NODE_ENV || 'development') + ')');
}

/**
 * Manually capture an error with optional context
 */
export function captureError(error, context = {}) {
  if (!SENTRY_DSN) return;
  
  Sentry.withScope(scope => {
    if (context.component) scope.setTag('component', context.component);
    if (context.action) scope.setTag('action', context.action);
    if (context.extra) scope.setExtras(scrubSensitiveData(context.extra));
    Sentry.captureException(error);
  });
}

/**
 * Set the current user for Sentry context (id only, no PII)
 */
export function setSentryUser(userId) {
  if (!SENTRY_DSN) return;
  Sentry.setUser({ id: userId || 'anonymous' });
}

// Re-export Sentry ErrorBoundary for use in App.js
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export scrubSensitiveData for testing
export { scrubSensitiveData };
