import { requestJson } from "./client.js";

export const fetchConfig = async () => (await requestJson("/api/config", { auth: false })).data;

export const testConnection = async (side, credentials) =>
  (await requestJson("/api/test-connection", { method: "POST", body: { side, credentials } })).data;

export const listTables = async (credentials) =>
  (await requestJson("/api/tables", { method: "POST", body: { credentials } })).data;

export const startJob = async (body) => (await requestJson("/api/jobs", { method: "POST", body })).data;

export const getJob = async (id) => (await requestJson(`/api/jobs/${encodeURIComponent(id)}`)).data;


export const getActiveJob = async () => (await requestJson("/api/jobs/active")).data;

export const listHistory = async ({ scope = "all", status = "", search = "", limit = 10, offset = 0 } = {}) => {
  const params = new URLSearchParams({ scope, limit: String(limit), offset: String(offset) });
  if (status) params.set("status", status);
  if (search.trim()) params.set("search", search.trim());
  return (await requestJson(`/api/history?${params}`)).data;
};
