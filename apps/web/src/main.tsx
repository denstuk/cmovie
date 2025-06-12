import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./router.tsx";

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<Toaster />
		<RouterProvider router={router} />
	</StrictMode>,
);
