import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Candidex
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/start"
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Start Interview
            </Link>
            <Link
              to="/analytics"
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
