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
    // return this.do({
    //   method: "get",
    //   url: `${this.url}/v2/my/fs/metadata`,
    //   params: {
    //     [filePathQuery]: filePath,
    //   },
    // });
    (
      await axios.get<FilesResponse>(`${API_URL}/v2/my/fs/file/metadata`, {
        params: { [filePathQuery]: filePath },
        withCredentials: true,
      })
    ).data
  );
};
