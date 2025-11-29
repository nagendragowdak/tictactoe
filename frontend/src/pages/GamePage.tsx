import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import type { Game } from "../types";

const GamePage: React.FC = () => {
  const { id } = useParams(); // game id from URL
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMove, setLoadingMove] = useState(false);
  const [loadingGame, setLoadingGame] = useState(true);

  // Helper to get the player ID for the current turn
  const getPlayerIdForTurn = (gameData: Game) => {
    return gameData.nextTurn === "X" ? gameData.playerXId : gameData.playerOId;
  };

  // Fetch game on mount / id change
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await api.get(`/api/games/${id}`);
        setGame(res.data);
        setMessage(null);

        // Auto-select the player whose turn it is
        setCurrentPlayerId(getPlayerIdForTurn(res.data));
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || "Failed to load game details.";
        setMessage(msg);
      } finally {
        setLoadingGame(false);
      }
    };

    if (id) {
      fetchGame();
    }
  }, [id]);

  const handleCellClick = async (index: number) => {
    if (!game || game.status !== "IN_PROGRESS") return;
    if (loadingMove) return;
    if (currentPlayerId == null) {
      setMessage("Select which player you are first.");
      return;
    }

    setLoadingMove(true);
    setMessage(null);

    try {
      const res = await api.post(`/api/games/${game.id}/move`, {
        playerId: currentPlayerId,
        position: index,
      });
      const updatedGame = res.data;
      setGame(updatedGame);

      // Auto-switch to the next player's turn
      if (updatedGame.status === "IN_PROGRESS") {
        setCurrentPlayerId(getPlayerIdForTurn(updatedGame));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Move failed. Try again.";
      setMessage(msg);
    } finally {
      setLoadingMove(false);
    }
  };

  const getStatusText = () => {
    if (!game) return "";
    if (game.status === "IN_PROGRESS") {
      return `Next turn: Player ${game.nextTurn}`;
    }
    if (game.status === "DRAW") {
      return "Game ended in a draw!";
    }
    if (game.status === "X_WON") {
      return "Player X wins!";
    }
    if (game.status === "O_WON") {
      return "Player O wins!";
    }
    return game.status;
  };

  const getStatusColor = () => {
    if (!game) return "text-white/70";
    if (game.status === "X_WON") return "text-pink-400";
    if (game.status === "O_WON") return "text-cyan-400";
    if (game.status === "DRAW") return "text-yellow-400";
    return "text-white/70";
  };

  if (loadingGame) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="text-white/70 text-xl">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="text-center">
          <div className="text-white/70 text-xl mb-4">Could not load game.</div>
          <Link to="/game/new" className="text-pink-400 hover:text-pink-300">
            Create a new game
          </Link>
        </div>
      </div>
    );
  }

  const cells = game.board.split(""); // 9 chars

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Game #{game.id}
        </h2>

        {/* Player info */}
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center">
            <div className="text-pink-400 text-2xl font-bold">X</div>
            <div className="text-white/60 text-sm">Player {game.playerXId}</div>
          </div>
          <div className="text-white/40 text-lg">VS</div>
          <div className="text-center">
            <div className="text-cyan-400 text-2xl font-bold">O</div>
            <div className="text-white/60 text-sm">Player {game.playerOId}</div>
          </div>
        </div>

        {/* Status */}
        <div className={`text-center text-lg font-semibold mb-6 ${getStatusColor()}`}>
          {getStatusText()}
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-3 w-72 mx-auto mb-6">
          {cells.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`aspect-square rounded-xl flex items-center justify-center text-5xl font-bold transition-all duration-200 ${
                cell === " " && game.status === "IN_PROGRESS"
                  ? "bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-pink-400/50 cursor-pointer"
                  : "bg-white/5 border-2 border-white/10 cursor-default"
              } ${cell === "X" ? "text-pink-400" : cell === "O" ? "text-cyan-400" : ""}`}
              disabled={cell !== " " || game.status !== "IN_PROGRESS"}
            >
              {cell !== " " ? cell : ""}
            </button>
          ))}
        </div>

        {/* Player selector */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-white/60 text-sm">Playing as:</span>
          <select
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={currentPlayerId ?? ""}
            onChange={(e) =>
              setCurrentPlayerId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="" className="bg-purple-900">Select player</option>
            <option value={game.playerXId} className="bg-purple-900">Player X ({game.playerXId})</option>
            <option value={game.playerOId} className="bg-purple-900">Player O ({game.playerOId})</option>
          </select>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-lg text-center bg-red-500/20 text-red-300 text-sm">
            {message}
          </div>
        )}

        {game.status !== "IN_PROGRESS" && (
          <div className="mt-6 text-center">
            <Link
              to="/game/new"
              className="inline-block px-6 py-3 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors"
            >
              Play Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
