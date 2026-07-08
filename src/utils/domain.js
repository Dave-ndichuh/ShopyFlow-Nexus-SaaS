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
  return root === 'localhost' ? 'localhost' : `.${root}`;
};
