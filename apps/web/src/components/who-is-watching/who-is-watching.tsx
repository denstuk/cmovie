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
		<div className="flex flex-col items-center justify-center h-screen text-white">
			<h1 className="text-5xl mb-8">Who's watching?</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-2 items-center">
         <input
						type="text"
						placeholder="Enter your name"
						className="w-[350px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white"
						onChange={(e) => setName(e.target.value)}
            maxLength={50}
					/>
				<button
					type="submit"
					disabled={isLoading}
					className="bg-red-600 w-[200px] px-4 py-2 mt-2 rounded hover:bg-red-700 cursor-pointer"
				>
					{isLoading ? "Loading..." : "Enter"}
				</button>
			</form>
			{error && <p className="text-red-500 mt-2">Failed to login.</p>}
		</div>
	);
};
