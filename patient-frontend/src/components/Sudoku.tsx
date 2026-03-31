import { useState } from "react";

const starterGrid: (number | null)[][] = [
  [1, null, null, 8, 7, null, 6, null, 2],
  [null, 8, null, 5, null, 2, 3, 4, 7],
  [2, 3, 6, null, 4, 9, null, 5, 1],
  [null, null, null, 8, null, null, 7, null, 2],
  [9, null, 2, null, null, null, null, 6, null],
  [4, 6, null, 9, null, 5, null, null, null],
  [null, 9, null, null, null, null, null, 1, null],
  [8, null, 5, 6, null, null, 4, 1, 3],
  [null, null, 2, 5, null, 8, null, null, null],
];

export default function SudokuGame() {
  const [grid, setGrid] = useState(starterGrid);

  const handleChange = (row: number, col: number, value: string) => {
    const val = parseInt(value);
    if (isNaN(val) || val < 1 || val > 9) return;
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = val;
    setGrid(newGrid);
  };

  const resetGrid = () => setGrid(starterGrid);

  const getCellClass = (row: number, col: number) => {
    let classes = "w-12 h-12 text-center text-lg font-medium focus:outline-none ";
    classes += "bg-white shadow-sm rounded-md ";
    classes += "border border-gray-300 ";
    if (col % 3 === 0) classes += "border-l-2 ";
    if (row % 3 === 0) classes += "border-t-2 ";
    if (col === 8) classes += "border-r-2 ";
    if (row === 8) classes += "border-b-2 ";
    return classes;
  };

  return (
    <div className="p-4 max-w-[400px] mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl text-center text-gray-800 mb-4">Sudoku</h1>
      <div className="grid grid-cols-9 gap-1 bg-gray-100 p-2 rounded-lg">
        {grid.map((row, rIdx) =>
          row.map((val, cIdx) => (
            <input
              key={`${rIdx}-${cIdx}`}
              type="text"
              value={val ?? ""}
              onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
              className={getCellClass(rIdx, cIdx)}
              maxLength={1}
            />
          ))
        )}
      </div>
      <div className="mt-4 flex justify-between">
        <button
          onClick={resetGrid}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Reset
        </button>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-400">
            Undo
          </button>
          <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-400">
            Erase
          </button>
          <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-400">
            Hint
          </button>
        </div>
      </div>
    </div>
  );
}
