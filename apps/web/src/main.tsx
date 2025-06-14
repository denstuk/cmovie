import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/auth.context.tsx";
import { Toaster } from "sonner";
import { App } from "./pages/app.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<Toaster />
				<App />
			</AuthProvider>
		</QueryClientProvider>
	</StrictMode>,
);
