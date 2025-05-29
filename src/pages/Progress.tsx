import React, { useState, useEffect } from 'react';

// Tic-tac-toe game types
type Player = 'X' | 'O' | null;
type Board = Player[];

const Progress: React.FC = () => {
  // Progress bar state
  const [progress, setProgress] = useState(0);
  
  // Tic-tac-toe game state
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [gameOver, setGameOver] = useState(false);

  // Progress bar animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // Check for winner
  const checkWinner = (board: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  };

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (board[index] || winner || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setGameOver(true);
    } else if (newBoard.every(cell => cell !== null)) {
      setGameOver(true);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGameOver(false);
  };

  // Reset progress
  const resetProgress = () => {
    setProgress(0);
    setTimeout(() => {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Progress</h1>
          <p className="text-gray-600">Track your progress and enjoy a quick game!</p>
        </div>

        {/* Progress Bar Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Progress Tracker</h2>
          
          {/* Progress Bar Container */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Loading Progress</span>
              <span className="text-sm font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-300 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
              </div>
            </div>
            
            {/* Progress milestones */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className={progress >= 25 ? 'text-green-600 font-medium' : ''}>25%</span>
              <span className={progress >= 50 ? 'text-green-600 font-medium' : ''}>50%</span>
              <span className={progress >= 75 ? 'text-green-600 font-medium' : ''}>75%</span>
              <span className={progress >= 100 ? 'text-green-600 font-medium' : ''}>100%</span>
            </div>
          </div>

          {/* Progress Status */}
          <div className="text-center">
            {progress < 100 ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="font-medium">Complete!</span>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <div className="text-center mt-4">
            <button
              onClick={resetProgress}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300"
            >
              Reset Progress
            </button>
          </div>
        </div>

        {/* Tic-Tac-Toe Game Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Tic-Tac-Toe Game</h2>
          
          {/* Game Status */}
          <div className="text-center mb-6">
            {winner ? (
              <div className="text-2xl font-bold text-green-600">
                🎉 Player {winner} Wins! 🎉
              </div>
            ) : gameOver ? (
              <div className="text-2xl font-bold text-yellow-600">
                🤝 It's a Tie! 🤝
              </div>
            ) : (
              <div className="text-xl font-medium text-gray-700">
                Current Player: <span className={`font-bold ${currentPlayer === 'X' ? 'text-purple-600' : 'text-green-600'}`}>{currentPlayer}</span>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="max-w-sm mx-auto mb-6">
            <div className="grid grid-cols-3 gap-2 p-4 bg-gray-100 rounded-lg">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className="h-20 w-20 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center text-3xl font-bold disabled:cursor-not-allowed"
                  disabled={cell !== null || winner !== null || gameOver}
                >
                  <span className={cell === 'X' ? 'text-purple-600' : 'text-green-600'}>
                    {cell}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="text-center">
            <button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300"
            >
              New Game
            </button>
          </div>

          {/* Game Instructions */}
          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>Click on any empty cell to place your mark. First to get three in a row wins!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;