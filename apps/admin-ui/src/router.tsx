import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/home-page";
import { UploadPage } from "./pages/upload-page";

export const router = createBrowserRouter([
	{
		index: true,
		path: "/",
		Component: HomePage,
	},
	{
		path: "/upload",
		Component: UploadPage,
	},
]);
