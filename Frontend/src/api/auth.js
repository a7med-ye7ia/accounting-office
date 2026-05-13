import apiClient from "./client"; 

export const login = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data; // Assuming the token is in response.data
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    console.error("Fetching current user failed:", error);
    throw error;
  }
};