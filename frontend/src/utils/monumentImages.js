export const DEFAULT_FALLBACK_IMAGE = '/images/taj-mahal.jpg';

export const MONUMENT_STOCK_IMAGES = {
  'taj': '/images/taj-mahal.jpg',
  'red fort': '/images/red-fort.jpg',
  'gateway': '/images/gateway-of-india.jpg',
  'qutub': '/images/qutub-minar.jpg',
  'qutb': '/images/qutub-minar.jpg',
  'meenakshi': '/images/meenakshi-temple.jpg',
};

export const PRESET_MONUMENT_IMAGES = [
  { label: 'Taj Mahal', path: '/images/taj-mahal.jpg' },
  { label: 'Red Fort', path: '/images/red-fort.jpg' },
  { label: 'Gateway of India', path: '/images/gateway-of-india.jpg' },
  { label: 'Qutub Minar', path: '/images/qutub-minar.jpg' },
  { label: 'Meenakshi Temple', path: '/images/meenakshi-temple.jpg' },
];

/**
 * Returns a monument-specific fallback image based on the monument name.
 * If no specific match is found, returns DEFAULT_FALLBACK_IMAGE (/images/taj-mahal.jpg).
 */
export function getMonumentFallback(name) {
  if (!name || typeof name !== 'string') {
    return DEFAULT_FALLBACK_IMAGE;
  }

  const clean = name.toLowerCase().trim();

  for (const [key, path] of Object.entries(MONUMENT_STOCK_IMAGES)) {
    if (clean.includes(key)) {
      return path;
    }
  }

  return DEFAULT_FALLBACK_IMAGE;
}
