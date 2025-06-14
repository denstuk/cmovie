import { Fragment, type FC } from "react";
import { RouterProvider } from "react-router";
import { router } from "../router";
import { useAuthContext } from "../auth/auth.context";
import { WhoIsWatching } from "../components/who-is-watching/who-is-watching";

export const App: FC = () => {
	const { user } = useAuthContext();

	if (!user) {
		return <WhoIsWatching />;
	}

	return (
		<Fragment>
			<RouterProvider router={router} />
		</Fragment>
	);
};
