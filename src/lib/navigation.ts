export function isNavigationTabActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname === '/poi' || pathname.startsWith('/poi/');
  }

  if (href === '/sammlungen') {
    return pathname === '/sammlungen'
      || pathname.startsWith('/sammlungen/')
      || pathname === '/sammlung'
      || pathname.startsWith('/sammlung/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function shouldUseBrowserBack(
  referrer: string,
  currentOrigin: string,
  historyLength: number,
): boolean {
  if (!referrer || historyLength <= 1) return false;

  try {
    return new URL(referrer).origin === currentOrigin;
  } catch {
    return false;
  }
}
