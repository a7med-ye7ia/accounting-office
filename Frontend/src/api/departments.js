import apiClient from "./client";

/** @typedef {{ id?: number, name: string, branch: { id: number, name?: string, address?: string, phone?: string } }} DepartmentPayload */

export const fetchDepartments = async (branchId) => {
  const url = branchId ? `/departments?branchId=${branchId}` : "/departments";
  const response = await apiClient.get(url);
  return response.data;
};

export const getDepartmentById = async (id) => {
  const response = await apiClient.get(`/departments/${id}`);
  return response.data;
};

/**
 * Backend expects `Department` with nested `branch` (see `DepartmentController`).
 * @param {{ name: string, branchId: number }} body
 */
export const createDepartment = async ({ name, branchId }) => {
  const response = await apiClient.post("/departments", {
    name,
    branch: { id: branchId },
  });
  return response.data;
};

/**
 * @param {number|string} id
 * @param {{ name: string, branchId: number }} body
 */
export const updateDepartment = async (id, { name, branchId }) => {
  const response = await apiClient.put(`/departments/${id}`, {
    name,
    branch: { id: branchId },
  });
  return response.data;
};

export const deleteDepartment = async (id) => {
  await apiClient.delete(`/departments/${id}`);
};

export const getDepartmentNames = async () => {
  const response = await apiClient.get("/departments");
  return response.data.map((department) => department.name);
};