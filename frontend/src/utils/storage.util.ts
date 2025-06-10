export const getCwd = () => {
  return localStorage.getItem("cwd") || "/";
};

export const setCwd = (cwd: string) => {
  return localStorage.setItem("cwd", cwd);
};
