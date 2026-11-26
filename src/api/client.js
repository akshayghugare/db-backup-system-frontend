import { ACCESS_CHANGED_EVENT, SESSION_EXPIRED_EVENT, clearSession, readSession } from "./session.js";

export class ApiError extends Error {
  constructor(message, status = 0, code = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

const UNREACHABLE = `Could not reach the API${API_BASE_URL ? ` at ${API_BASE_URL}` : ""}. Check that the backend is running (npm start in db-backup-local/backend) and that VITE_API_BASE_URL in frontend/.env is correct.`;

export const request = async (path, { method = "GET", body, auth = true, accept = "application/json" } = {}) => {
  const headers = { Accept: accept };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const session = readSession();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(UNREACHABLE, 0);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401 && auth) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    if (response.status === 403 && data?.code === "NOT_APPROVED") {
      window.dispatchEvent(new Event(ACCESS_CHANGED_EVENT));
    }
    throw new ApiError(data?.message || `The API answered ${response.status}`, response.status, data?.code ?? null);
  }
  return response;
};

export const requestJson = async (path, options) => {
  const response = await request(path, options);
  return response.json();
};
