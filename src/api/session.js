const STORAGE_KEY = "db-backup-local.session";

export const SESSION_EXPIRED_EVENT = "db-backup-local:session-expired";
export const ACCESS_CHANGED_EVENT = "db-backup-local:access-changed";

export const readSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!session?.token || !session?.expires_at) return null;
    if (Date.parse(session.expires_at) <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveSession = (session) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};
