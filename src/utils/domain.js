export const getRootDomain = () => {
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'localhost';
  }
  
  return 'nexussaas.com';
};

export const getCookieDomain = () => {
  const root = getRootDomain();
  // Strip port if present (e.g., localhost:3000 -> localhost)
  const hostname = root.split(':')[0];
  
  return hostname === 'localhost' ? 'localhost' : `.${hostname}`;
};

export const getRootUrl = (path = '') => {
  const root = getRootDomain();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return `${protocol}://${root}${path}`;
};
