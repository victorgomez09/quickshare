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

export const createDir = async (dirPath: string) => {
  return (
    await axios.post<{ msg: string }>(
      `${API_URL}/v2/my/fs/dirs`,
      {
        path: dirPath,
      },
      {
        withCredentials: true,
      }
    )
  ).data;
};

export const uploadFile = async (
  filePath: string,
  content: string | ArrayBuffer,
  offset: number
) => {
  return (
    await axios.patch<{ msg: string }>(
      `${API_URL}/v2/my/fs/files/chunks`,
      {
        path: filePath,
        content,
        offset,
      },
      {
        withCredentials: true,
      }
    )
  ).data;
};
