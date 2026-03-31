import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Player = "X" | "O" | null;

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // Player is X, AI is O
  const [winner, setWinner] = useState<Player | "Draw">(null);

  // Check winner whenever board updates
  useEffect(() => {
    const win = calculateWinner(board);
    if (win) {
      setWinner(win);
    } else if (!isXNext) {
      // Computer's turn
      const bestMove = findBestMove(board);
      if (bestMove !== -1) {
        const newBoard = [...board];
        newBoard[bestMove] = "O";
        setBoard(newBoard);
        setIsXNext(true);
      }
    } else if (board.every((square) => square !== null)) {
      setWinner("Draw");
    }
  }, [board, isXNext]);

  const handleClick = (index: number) => {
    if (board[index] || winner || !isXNext) return; // block invalid moves
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsXNext(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const calculateWinner = (squares: Player[]): Player | null => {
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
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const minimax = (newBoard: Player[], depth: number, isMaximizing: boolean): number => {
    const win = calculateWinner(newBoard);
    if (win === "O") return 10 - depth;
    if (win === "X") return depth - 10;
    if (newBoard.every((sq) => sq !== null)) return 0; // Draw

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!newBoard[i]) {
          newBoard[i] = "O";
          let score = minimax(newBoard, depth + 1, false);
          newBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!newBoard[i]) {
          newBoard[i] = "X";
          let score = minimax(newBoard, depth + 1, true);
          newBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const findBestMove = (newBoard: Player[]): number => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) {
        newBoard[i] = "O";
        let score = minimax(newBoard, 0, false);
        newBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const renderSquare = (index: number) => (
    <button
      onClick={() => handleClick(index)}
      className="w-20 h-20 text-3xl font-bold border border-gray-500 flex items-center justify-center 
                 transition-colors duration-200 rounded-lg bg-white hover:bg-gray-100"
    >
      <span className={board[index] === "X" ? "text-red-500" : "text-blue-500"}>
        {board[index]}
      </span>
    </button>
  );

  return (
    <Card className="p-4 min-w-[300px]">
      <CardHeader>
        <CardTitle>Tic Tac Toe</CardTitle>
        <CardDescription>Play the classic Tic Tac Toe game against the computer.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="mb-4">
          {winner
            ? winner === "Draw"
              ? "It's a Draw!"
              : `Winner: ${winner}`
            : `Your Turn (X)`}
        </p>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl shadow-lg bg-gray-50 mb-4">
          {board.map((_, i) => renderSquare(i))}
        </div>

        <button
          onClick={resetGame}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900"
        >
          New Game
        </button>
      </CardContent>
    </Card>
  );
}
