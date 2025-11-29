export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Game {
  id: number;
  playerXId: number;
  playerOId: number;
  board: string;      // "X   O    "
  nextTurn: string;   // "X" or "O"
  status: string;     // "IN_PROGRESS" | "X_WON" | "O_WON" | "DRAW"
  winnerId?: number | null;
  playerX?: User;
  playerO?: User;
}
