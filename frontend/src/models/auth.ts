export type User = {
    id: string;
    name: string;
    role: string;
    quota: UserQuota;
    usedSpace: string;
    preferences: UserPreferences;
};

export type UserQuota = {
    spaceLimit: string;
    uploadSpeedLimit: number;
    downloadSpeedLimit: number;
};

export type UserPreferences = {
    bg: {
        url: string;
        repeat: string;
        position: string;
        align: string;
        bgColor: string;
    };
    cssURL: string;
    lanPackURL: string;
    lan: string;
    theme: string;
    avatar: string;
    email: string;
};

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    login: (credentials: { username: string; password: string }) => void;
    logout: () => void;
}

export interface AuthProviderProps {
    children: React.ReactNode;
}