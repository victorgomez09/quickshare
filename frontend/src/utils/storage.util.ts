export const getCwd = () => {
  return localStorage.getItem("cwd") || "/qs/files";
};

export const setCwd = (cwd: string) => {
  return localStorage.setItem("cwd", cwd);
};
