import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { UserInfo } from "../api/types";
import { getStorageValue } from "./utils";

interface AuthContextType {
	user: UserInfo | null;
	setUser: (user: UserInfo) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<UserInfo | null>(() =>
		getStorageValue<UserInfo>("user"),
	);

	return (
		<AuthContext.Provider value={{ user, setUser }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuthContext = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
	return ctx;
};
