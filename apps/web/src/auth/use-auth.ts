import { useMutation } from "@tanstack/react-query";
import { useAuthContext } from "./auth.context";
import { signIn } from "../api/api";
import { setStorageValue } from "./utils";

export const useAuth = () => {
	const { setUser } = useAuthContext();

	const loginMutation = useMutation({
		mutationFn: signIn,
		onSuccess: (data) => {
			setUser(data);
			setStorageValue("user", data);
		},
	});

	return {
		login: loginMutation.mutate,
		isLoading: loginMutation.isPending,
		error: loginMutation.error,
	};
};
