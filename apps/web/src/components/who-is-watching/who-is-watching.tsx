import { useState } from "react";
import { useAuth } from "../../auth/use-auth";

export const WhoIsWatching = () => {
	const [name, setName] = useState("");
	const { login, isLoading, error } = useAuth();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		login(name);
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-black text-white">
			<h1 className="text-3xl mb-4">Who's watching?</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-2">
				<input
					type="text"
					value={name}
					placeholder="Enter your name"
					onChange={(e) => setName(e.target.value)}
					className="p-2 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
				/>
				<button
					type="submit"
					disabled={isLoading}
					className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
				>
					{isLoading ? "Loading..." : "Enter"}
				</button>
			</form>
			{error && <p className="text-red-500 mt-2">Failed to login.</p>}
		</div>
	);
};
