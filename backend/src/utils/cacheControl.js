/**
 * Cache Control Headers for ISR/SSR/SSG behavior
 * Maps page types to appropriate cache headers
 */

const CACHE_PROFILES = {
  // ISR-like: cached at CDN, revalidated in background
  'isr-daily': {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    'CDN-Cache-Control': 'public, max-age=86400',
    'Surrogate-Control': 'max-age=86400'
  },
  'isr-hourly': {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
    'CDN-Cache-Control': 'public, max-age=3600',
    'Surrogate-Control': 'max-age=3600'
  },
  // SSR: short cache, always fresh
  'ssr': {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, max-age=60',
    'Surrogate-Control': 'max-age=60'
  },
  // SSG: long cache, rarely changes
  'ssg': {
    'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, max-age=604800',
    'Surrogate-Control': 'max-age=604800'
  },
  // No cache for action pages
  'no-cache': {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  }
};

/**
 * Returns the cache profile name for a given page type
 */
export function getCacheProfile(pageType) {
  const map = {
    'homepage': 'isr-daily',
    'report-listing': 'ssr',
    'report-detail': 'isr-hourly',
    'blog-listing': 'ssr',
    'blog-detail': 'isr-daily',
    'megatrend-listing': 'ssr',
    'megatrend-detail': 'isr-daily',
    'casestudy-listing': 'ssr',
    'casestudy-detail': 'isr-daily',
    'press-release': 'isr-daily',
    'service-page': 'ssg',
    'static-page': 'ssg',
    'legal-page': 'ssg',
    'action-page': 'no-cache',
    'universal-detail': 'isr-hourly'
  };
  return map[pageType] || 'ssr';
}

/**
 * Sets cache control headers on the response
 */
export function setCacheHeaders(res, pageType) {
  const profileName = getCacheProfile(pageType);
  const headers = CACHE_PROFILES[profileName];
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
}
