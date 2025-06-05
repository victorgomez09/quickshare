import { API_URL } from "@/constants";
import axios from "axios";

export const login = async (username: string, password: string) => {
  const result = await axios.post(
    `${API_URL}/v2/public/login`,
    {
      user: username,
      pwd: password,
    },
    { withCredentials: true }
  );

  return result.data;
};
