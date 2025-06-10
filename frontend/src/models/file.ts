export type FilesResponse = {
  cwd: string;
  metadatas: File[];
};

export type File = {
  name: string;
  size: number;
  modTime: Date;
  isDir: boolean;
  sha1: string;
};
