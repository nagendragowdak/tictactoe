import { Link, Route, Routes, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import NewGamePage from "./pages/NewGamePage";
import GamePage from "./pages/GamePage";
import { useEffect, useState } from "react";

interface TttUser {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [user, setUser] = useState<TttUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("ttt_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Listen for storage changes (for login updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("ttt_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      const stored = localStorage.getItem("ttt_user");
      const currentUser = stored ? JSON.parse(stored) : null;
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        setUser(currentUser);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("ttt_user");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex gap-6">
          <Link to="/" className="text-white/90 hover:text-white font-medium transition-colors">
            Home
          </Link>
          {!user && (
            <>
              <Link
                to="/register"
                className="text-white/90 hover:text-white font-medium transition-colors"
              >
                Register
              </Link>
              <Link to="/login" className="text-white/90 hover:text-white font-medium transition-colors">
                Login
              </Link>
            </>
          )}
          {user && (
            <Link
              to="/game/new"
              className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
            >
              New Game
            </Link>
          )}
        </div>

        <div className="text-sm text-white/80 flex items-center gap-3">
          {user ? (
            <>
              <span className="text-pink-300">Welcome, {user.name}!</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <span className="text-white/60">Not logged in</span>
          )}
        </div>
      </nav>

      {/* Pages */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-white mb-6">
                  Tic-Tac-Toe
                </h1>
                <p className="text-xl text-white/70 mb-8 max-w-md">
                  Challenge your friends to the classic game of X's and O's
                </p>
                {!user ? (
                  <div className="flex gap-4 justify-center">
                    <Link
                      to="/register"
                      className="px-6 py-3 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      className="px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20"
                    >
                      Login
                    </Link>
                  </div>
                ) : (
                  <Link
                    to="/game/new"
                    className="px-8 py-4 rounded-lg bg-pink-500 text-white font-semibold text-lg hover:bg-pink-600 transition-colors inline-block"
                  >
                    Start New Game
                  </Link>
                )}
              </div>
            </div>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/game/new" element={<NewGamePage />} />
        <Route path="/game/:id" element={<GamePage />} />
      </Routes>
    </div>
  );
}

export default App;
