import puzzles from '@/data/puzzles-matein1.json';

export interface ChessPuzzle {
  id: string;
  fen: string;
  solution: string;
  rating: number;
}

// Cast imported JSON data to ChessPuzzle array
const puzzleList: ChessPuzzle[] = puzzles as ChessPuzzle[];

/**
 * Retrieves a random mate-in-1 puzzle from the loaded JSON dataset.
 * Returns null if the dataset is empty.
 * 
 * @returns {ChessPuzzle | null} A random puzzle or null if none available.
 */
export function getRandomPuzzle(): ChessPuzzle | null {
  if (puzzleList.length === 0) {
    console.warn('[PuzzleLoader] The puzzle dataset is empty.');
    return null;
  }
  const randomIndex = Math.floor(Math.random() * puzzleList.length);
  return puzzleList[randomIndex];
}

/**
 * Retrieves a random mate-in-1 puzzle from the loaded JSON dataset,
 * excluding the specified current ID to prevent immediate repeats.
 * Returns the puzzle itself if it is the only one in the dataset.
 * 
 * @param {string} currentId The ID of the currently loaded puzzle.
 * @returns {ChessPuzzle | null} A random different puzzle, or null if none available.
 */
export function getRandomPuzzleExcluding(currentId: string): ChessPuzzle | null {
  if (puzzleList.length === 0) {
    console.warn('[PuzzleLoader] The puzzle dataset is empty.');
    return null;
  }
  if (puzzleList.length === 1 && puzzleList[0].id === currentId) {
    return puzzleList[0];
  }

  const candidates = puzzleList.filter(p => p.id !== currentId);
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Retrieves a specific chess puzzle by its unique ID.
 * Returns undefined if no puzzle matches the given ID.
 * 
 * @param {string} id The unique identifier of the puzzle.
 * @returns {ChessPuzzle | undefined} The matching puzzle, or undefined if not found.
 */
export function getPuzzle(id: string): ChessPuzzle | undefined {
  return puzzleList.find(puzzle => puzzle.id === id);
}

/**
 * Retrieves the complete list of loaded puzzles.
 * Useful for debugging or displaying a list of available puzzles.
 * 
 * @returns {ChessPuzzle[]} Array containing all loaded puzzles.
 */
export function getAllPuzzles(): ChessPuzzle[] {
  return puzzleList;
}
