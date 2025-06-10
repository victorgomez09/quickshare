import { create } from "zustand";

type Path = {
  path: string;
  setPath: (path: string) => void;
};

export const usePath = create<Path>()((set) => ({
  path: localStorage.getItem("cwd") || "/qs/files",
  setPath: (newPath: string) => set(() => ({ path: newPath })),
}));
