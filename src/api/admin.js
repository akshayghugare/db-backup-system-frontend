import { requestJson } from "./client.js";

export const listUsers = async (status = "") =>
  (await requestJson(`/api/admin/users${status ? `?status=${encodeURIComponent(status)}` : ""}`)).data;

export const approveUser = async (id) =>
  (await requestJson(`/api/admin/users/${encodeURIComponent(id)}/approve`, { method: "POST" })).data;

export const rejectUser = async (id) =>
  (await requestJson(`/api/admin/users/${encodeURIComponent(id)}/reject`, { method: "POST" })).data;
