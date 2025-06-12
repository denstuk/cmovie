import type { FC } from "react";

export const PageLoader: FC = () => {
	return (
		<div className="flex justify-center items-center h-64">
			<div className="animate-spin rounded-full h-30 w-30 border-b-5 text-red-600" />
		</div>
	);
};
