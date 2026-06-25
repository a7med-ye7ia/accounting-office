import apiClient from "./client";

export const fetchActivityLogs = async (companyId) => {
  const url = companyId
    ? `/activity-logs/company/${companyId}`
    : "/activity-logs";
  const response = await apiClient.get(url);
  return response.data;
};
