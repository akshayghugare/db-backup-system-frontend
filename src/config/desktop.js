/**
 * Desktop app download.
 *
 * The installer (~120 MB) is published as a GitHub Release asset — too big for the website repo / Render
 * (GitHub rejects files over 100 MB in git). "releases/latest/download/<file>" always points to the newest
 * release, so this link never needs to change when you ship a new version.
 *
 * Publish a release from db-backup-system-desktop with:  npm run release   (see its README).
 * The repository must be PUBLIC, otherwise visitors cannot download the file.
 */
export const DESKTOP_RELEASES_URL = "https://github.com/akshayghugare/db-backup-system-desktop/releases";
export const DESKTOP_DOWNLOAD_URL = `${DESKTOP_RELEASES_URL}/latest/download/DB-Backup-Restore-Setup.exe`;

export const DESKTOP_INFO = {
  platform: "Windows 10 / 11 · 64-bit",
  size: "about 120 MB",
};

/** True inside the desktop app itself (Electron adds "Electron/x.y" to the user agent). */
export const isDesktopApp = () => typeof navigator !== "undefined" && /\bElectron\//.test(navigator.userAgent);

/** The installer is Windows-only for now. */
export const isWindows = () => typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);
