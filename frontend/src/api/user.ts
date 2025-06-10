import { API_URL } from "@/constants";
import { User } from "@/models/user";
import axios from "axios";

export const getMe = async (): Promise<User> => {
  return (
    await axios.get<User>(`${API_URL}/v2/my/self`, { withCredentials: true })
  ).data;
};
