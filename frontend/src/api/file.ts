import { API_URL } from "@/constants";
import { FilesResponse } from "@/models/file";
import axios from "axios";

export const listDirQuery = "dp";

export const getFiles = async (dirPath: string) => {
  return (
    await axios.get<FilesResponse>(`${API_URL}/v2/my/fs/dirs`, {
      params: { [listDirQuery]: dirPath },
      withCredentials: true,
    })
  ).data;
};
