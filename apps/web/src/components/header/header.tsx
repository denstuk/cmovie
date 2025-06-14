import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

const Header = () => {
	const [isScrolled, setIsScrolled] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Add scroll listener
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 0) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Focus the search input when the search bar appears
	useEffect(() => {
		if (showSearch && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [showSearch]);

	// Handle click outside to close search
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				showSearch &&
				searchInputRef.current &&
				!searchInputRef.current.contains(event.target as Node) &&
				!(event.target as Element).closest("button")
			) {
				setShowSearch(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showSearch]);

	return (
		<header
			className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? "bg-black" : "bg-transparent"}`}
		>
			<div className="px-4 py-3 lg:px-8 flex items-center justify-between">
				{/* Left section */}
				<div className="flex items-center space-x-8">
					<h1 className="text-red-600 text-2xl font-bold">CMOVIE</h1>
					<nav className="md:flex space-x-4">
						<Link to="/" className="text-white hover:text-gray-300">
							Home
						</Link>
					</nav>
				</div>

				{/* Right section */}
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<img
							src="https://picsum.photos/32/32"
							alt="Profile"
							className="rounded-full w-8 h-8 ring-2 ring-gray-800 hover:ring-red-600 transition-all duration-200"
						/>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
