import { API_URL } from "@/constants";
import axios from "axios";

export const listDirQuery = "dp";

export const getFiles = async (dirPath: string) => {
    return (await axios.get(`${API_URL}/v2/my/fs/dirs`, { params: { [listDirQuery]: dirPath }, withCredentials: true })).data
    // return this.do({
    //   method: "get",
    //   url: `${this.url}/v2/my/fs/dirs`,
    //   params: {
    //     [listDirQuery]: dirPath,
    //   },
    // });
};