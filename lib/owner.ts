// "Owner mode": the site owner's own browsing is never counted in analytics and never requests ads
// (self-impressions are invalid traffic to AdSense). The flag lives in this browser's localStorage —
// set automatically when the owner opens /admin, switchable in Admin → Settings.

export const OWNER_KEY = "toolninja:owner";

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** "1" = owner browser (excluded), "0" = explicitly turned off, null = never set. */
export function readOwnerFlag(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function isExcludedVisit(pathname = typeof location !== "undefined" ? location.pathname : ""): boolean {
  return isAdminPath(pathname) || readOwnerFlag() === "1";
}

/**
 * Runs in <head> before the AdSense script, so ad requests are paused before AdSense even starts.
 * Kept as a plain string because it must execute before React loads.
 */
export const OWNER_HEAD_SCRIPT = `try{var p=location.pathname;if(p==="/admin"||p.indexOf("/admin/")===0||localStorage.getItem("${OWNER_KEY}")==="1"){(window.adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=1;window.__tnExcluded=1}}catch(e){}`;
