"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ---------- Helper: check winner ----------
function checkWinner(board) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
        if (board[a] !== " " && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // "X" or "O"
        }
    }
    const isDraw = board.every((cell) => cell !== " ");
    return isDraw ? "DRAW" : null;
}
// ---------- Health & test ----------
app.get("/", (_req, res) => {
    res.send("Tic-Tac-Toe backend is running");
});
app.get("/test-db", async (_req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ ok: true, count: users.length, users });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "DB error" });
    }
});
// ---------- AUTH ROUTES ----------
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: "Name, email and password are required" });
        }
        const existing = await prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
        return res.status(201).json(user);
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
// ---------- GAME ROUTES ----------
/**
 * Create a new game.
 * For now we expect the frontend to send playerXId and playerOId.
 */
app.post("/api/games", async (req, res) => {
    try {
        const { playerXId, playerOId } = req.body;
        if (!playerXId || !playerOId) {
            return res
                .status(400)
                .json({ message: "playerXId and playerOId are required" });
        }
        // Ensure both users exist
        const [playerX, playerO] = await Promise.all([
            prisma.user.findUnique({ where: { id: playerXId } }),
            prisma.user.findUnique({ where: { id: playerOId } }),
        ]);
        if (!playerX || !playerO) {
            return res.status(400).json({ message: "Invalid player IDs" });
        }
        const game = await prisma.game.create({
            data: {
                playerXId,
                playerOId,
                board: "         ", // 9 spaces
                nextTurn: "X",
                status: "IN_PROGRESS",
            },
        });
        res.status(201).json(game);
    }
    catch (err) {
        console.error("Create game error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * Get game state by id
 */
app.get("/api/games/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const game = await prisma.game.findUnique({
            where: { id },
            include: {
                playerX: { select: { id: true, name: true, email: true } },
                playerO: { select: { id: true, name: true, email: true } },
            },
        });
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }
        res.json(game);
    }
    catch (err) {
        console.error("Get game error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * Make a move
 * Body: { playerId: number, position: number(0-8) }
 */
app.post("/api/games/:id/move", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { playerId, position } = req.body;
        if (playerId == null || position == null) {
            return res
                .status(400)
                .json({ message: "playerId and position are required" });
        }
        if (position < 0 || position > 8) {
            return res.status(400).json({ message: "Position must be between 0 and 8" });
        }
        const game = await prisma.game.findUnique({ where: { id } });
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }
        if (game.status !== "IN_PROGRESS") {
            return res.status(400).json({ message: "Game already finished" });
        }
        // Determine which symbol this player should use
        let symbol;
        if (playerId === game.playerXId)
            symbol = "X";
        else if (playerId === game.playerOId)
            symbol = "O";
        else
            return res.status(403).json({ message: "Player is not part of this game" });
        if (symbol !== game.nextTurn) {
            return res
                .status(400)
                .json({ message: `It's not your turn. Next turn: ${game.nextTurn}` });
        }
        const boardArr = game.board.split(""); // 9 chars
        if (boardArr[position] !== " ") {
            return res.status(400).json({ message: "Cell already occupied" });
        }
        // Apply move
        boardArr[position] = symbol;
        const result = checkWinner(boardArr);
        let status = game.status;
        let nextTurn = game.nextTurn === "X" ? "O" : "X";
        let winnerId = null;
        if (result === "X") {
            status = "X_WON";
            winnerId = game.playerXId;
        }
        else if (result === "O") {
            status = "O_WON";
            winnerId = game.playerOId;
        }
        else if (result === "DRAW") {
            status = "DRAW";
            nextTurn = game.nextTurn; // no next turn in draw
        }
        const updated = await prisma.game.update({
            where: { id },
            data: {
                board: boardArr.join(""),
                status,
                nextTurn,
                winnerId: winnerId ?? undefined,
            },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("Move error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map