export type FilesResponse = {
  cwd: string;
  metadatas: {
    name: string;
    size: number;
    modTime: Date;
    isDir: boolean;
    sha1: string;
  }[];
};

export type File = {
  name: string;
  size: number;
  modTime: Date;
  isDir: boolean;
  sha1: string;
};
