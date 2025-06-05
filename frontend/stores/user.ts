import { create } from "zustand";
import { User } from "@/models/user";

interface UserState {
  user: User;
  setUser: (newUser: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {} as User,
  setUser: (newUser: User) => set(() => ({ user: newUser })),
}));
