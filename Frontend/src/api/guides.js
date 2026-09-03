import apiClient from "./client";

export const fetchGuides = async () => (await apiClient.get("/guides")).data;
export const fetchGuide = async (id) => (await apiClient.get(`/guides/${id}`)).data;
export const fetchAdminGuides = async () => (await apiClient.get("/guides/admin")).data;
export const createGuide = async (payload) => (await apiClient.post("/guides", payload)).data;
export const updateGuide = async (id, payload) => (await apiClient.put(`/guides/${id}`, payload)).data;
export const deleteGuide = async (id) => (await apiClient.delete(`/guides/${id}`)).data;
