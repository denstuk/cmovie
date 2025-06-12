import { useEffect, useState } from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import { Link } from 'react-router';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Add scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-black' : 'bg-black/50'}`}>
      <div className="px-4 py-3 lg:px-8 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-8">
          <h1 className="text-red-600 text-2xl font-bold">CMOVIE</h1>
          <nav className="hidden md:flex space-x-4">
            <Link to="/" className="text-white hover:text-gray-300">Home</Link>
            <Link to="/upload" className="text-white hover:text-gray-300">Upload</Link>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="text-white hover:text-gray-300"
            >
              <FaSearch size={20} />
            </button>
            {showSearch && (
              <div className="absolute right-0 top-10 bg-black bg-opacity-90 p-2 rounded">
                <input
                  type="text"
                  placeholder="Titles, people, genres"
                  className="bg-gray-800 text-white px-4 py-1 rounded outline-none"
                />
              </div>
            )}
          </div>
          <button className="text-white hover:text-gray-300">
            <FaBell size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <img
              src="https://picsum.photos/32/32"
              alt="Profile"
              className="rounded-full w-8 h-8"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
