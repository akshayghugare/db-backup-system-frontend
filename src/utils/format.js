export const RESTORE_HOSTS = ["localhost", "127.0.0.1"];
const HOST_PATTERN = /^[A-Za-z0-9._:-]+$/;
const NAME_PATTERN = /^[A-Za-z0-9_$-]+$/;

export const EMPTY_FORM = { DB_HOST: "", DB_PORT: "5432", DB_USER: "", DB_PASSWORD: "", DB_NAME: "", DB_SSL: false };

export const isRestoreHostAllowed = (host) => RESTORE_HOSTS.includes(host.trim().toLowerCase());

export const validateCredentials = (form, label) => {
  const host = form.DB_HOST.trim();
  const port = Number(form.DB_PORT);
  if (!host) return `${label}: enter the host`;
  if (!HOST_PATTERN.test(host)) return `${label}: host must be a host name or IP only — no postgres://, port or path`;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return `${label}: port must be a number from 1 to 65535`;
  if (!form.DB_NAME.trim()) return `${label}: enter the database name`;
  if (!NAME_PATTERN.test(form.DB_NAME.trim())) return `${label}: database name can only contain letters, digits, _, $ and -`;
  if (!form.DB_USER.trim()) return `${label}: enter the user name`;
  return null;
};

export const toPayload = (form) => ({
  DB_HOST: form.DB_HOST.trim(),
  DB_PORT: Number(form.DB_PORT),
  DB_USER: form.DB_USER.trim(),
  DB_PASSWORD: form.DB_PASSWORD,
  DB_NAME: form.DB_NAME.trim(),
  DB_SSL: form.DB_SSL,
});

export const parseConnectionUrl = (value) => {
  try {
    const url = new URL(value.trim());
    if (!/^postgres(ql)?:$/.test(url.protocol)) return null;
    const sslMode = (url.searchParams.get("sslmode") || "").toLowerCase();
    return {
      DB_HOST: url.hostname.replace(/^\[|\]$/g, ""),
      DB_PORT: url.port || "5432",
      DB_USER: decodeURIComponent(url.username),
      DB_PASSWORD: decodeURIComponent(url.password),
      DB_NAME: decodeURIComponent(url.pathname.replace(/^\//, "")),
      DB_SSL: sslMode !== "" && sslMode !== "disable",
    };
  } catch {
    return null;
  }
};

export const formatDuration = (ms) => {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
};

export const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unit]}`;
};

export const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

export const tableId = (table) => JSON.stringify([table.schema, table.name]);
