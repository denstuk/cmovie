import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/home-page";
import { ManagePage } from "./pages/manage-page";
import { UploadPage } from "./pages/upload-page";
import { VideoPage } from "./pages/video-page";

export const router = createBrowserRouter([
	{
		index: true,
		path: "/",
		Component: HomePage,
	},
	{
		path: "/video/:videoId",
		Component: VideoPage,
	},
	{
		path: "/upload",
		Component: UploadPage,
	},
	{
		path: "/manage",
		Component: ManagePage,
	},
]);
