import { API_URL } from "@/constants";
import axios from "axios";

export const login = async (username: string, password: string) => {
  return await axios.post(
    `${API_URL}/v2/public/login`,
    {
      user: username,
      pwd: password,
    },
    { withCredentials: true }
  );
};

export const logout = async () => {
  return await axios.post(`${API_URL}/v2/my/logout`, { withCredentials: true });
};

export const logoutAdmin = async () => {
  return await axios.post(`${API_URL}/v1/users/logout`, {
    withCredentials: true,
  });
};
