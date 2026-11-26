import { API_BASE_URL } from "../api/client.js";

/**
 * Desktop app download — served directly by this website's backend (GET /api/desktop/download),
 * so visitors download the installer from this site and never visit GitHub.
 * The backend streams the newest installer published from db-backup-system-desktop (`npm run release`).
 */
export const DESKTOP_DOWNLOAD_URL = `${API_BASE_URL}/api/desktop/download`;
export const DESKTOP_FILE_NAME = "DB-Backup-Restore-Setup.exe";
export const DESKTOP_PLATFORM = "Windows 10 / 11 · 64-bit";

/** Asks the backend whether an installer is published, and its size. */
export const checkDesktopDownload = async () => {
  try {
    const response = await fetch(DESKTOP_DOWNLOAD_URL, { method: "HEAD", cache: "no-store" });
    if (!response.ok) return { available: false };
    const bytes = Number(response.headers.get("content-length")) || null;
    return { available: true, bytes };
  } catch {
    return { available: false, unreachable: true };
  }
};

/** True inside the desktop app itself (Electron adds "Electron/x.y" to the user agent). */
export const isDesktopApp = () => typeof navigator !== "undefined" && /\bElectron\//.test(navigator.userAgent);

/** The installer is Windows-only for now. */
export const isWindows = () => typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);
