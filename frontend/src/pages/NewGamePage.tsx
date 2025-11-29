import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const NewGamePage: React.FC = () => {
  const [playerXId, setPlayerXId] = useState("");
  const [playerOId, setPlayerOId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pre-fill current user's ID
  useEffect(() => {
    const stored = localStorage.getItem("ttt_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setPlayerXId(String(user.id));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post("/api/games", {
        playerXId: Number(playerXId),
        playerOId: Number(playerOId),
      });

      // Navigate to the game page
      navigate(`/game/${res.data.id}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to create game. Check IDs.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Start New Game
        </h2>

        <form onSubmit={handleCreateGame} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Player X ID (plays first)
            </label>
            <input
              type="number"
              value={playerXId}
              onChange={(e) => setPlayerXId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="Enter Player X ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Player O ID
            </label>
            <input
              type="number"
              value={playerOId}
              onChange={(e) => setPlayerOId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="Enter Player O ID"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 rounded-lg text-center bg-red-500/20 text-red-300">
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-white/60 text-sm">
          Use the numeric IDs of registered users. Your ID is pre-filled as Player X.
        </p>
      </div>
    </div>
  );
};

export default NewGamePage;
