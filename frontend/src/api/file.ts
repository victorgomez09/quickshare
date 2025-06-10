import { API_URL } from "@/constants";
import { FilesResponse } from "@/models/file";
import axios from "axios";

export const listDirQuery = "dp";
export const filePathQuery = "fp";

export const getFiles = async (dirPath: string) => {
  return (
    await axios.get<FilesResponse>(`${API_URL}/v2/my/fs/dirs`, {
      params: { [listDirQuery]: dirPath },
      withCredentials: true,
    })
  ).data;
};

export const getFile = async (filePath: string) => {
  return (
    await axios.get<FilesResponse>(`${API_URL}/v2/my/fs/file/metadata`, {
      params: { [filePathQuery]: filePath },
      withCredentials: true,
    })
  ).data;
};

export const downloadFile = async (filePath: string) => {
  console.log(
    "test",
    await axios.get<FilesResponse>(`${API_URL}/v1/fs/files?fp=${filePath}`, {
      withCredentials: true,
    })
  );
  return (
    await axios.get<FilesResponse>(`${API_URL}/v1/fs/files?fp=${filePath}`, {
      withCredentials: true,
    })
  ).data;
};
