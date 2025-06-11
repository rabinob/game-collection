// AI for 5 in a Row Game
class FiveInARowAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.aiPlayer = 'O';
        this.humanPlayer = 'X';
    }

    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 2;
            case 'medium': return 4;
            case 'hard': return 6;
            default: return 4;
        }
    }

    // Main AI move function
    makeMove(board) {
        console.log(`🤖 AI thinking (${this.difficulty} mode)...`);
        
        // Easy mode - make some random moves
        if (this.difficulty === 'easy' && Math.random() < 0.3) {
            return this.makeRandomMove(board);
        }

        // Check for immediate win
        const winMove = this.findWinningMove(board, this.aiPlayer);
        if (winMove) return winMove;

        // Check for immediate block
        const blockMove = this.findWinningMove(board, this.humanPlayer);
        if (blockMove) return blockMove;

        // Use minimax for strategic move
        const bestMove = this.minimax(board, this.maxDepth, -Infinity, Infinity, true);
        return bestMove.move || this.makeRandomMove(board);
    }

    // Minimax algorithm with alpha-beta pruning
    minimax(board, depth, alpha, beta, isMaximizing) {
        const score = this.evaluateBoard(board);
        
        // Terminal conditions
        if (depth === 0 || Math.abs(score) >= 1000) {
            return { score };
        }

        const availableMoves = this.getAvailableMoves(board);
        if (availableMoves.length === 0) {
            return { score: 0 };
        }

        let bestMove = null;

        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of availableMoves) {
                // Make move
                board[move.row][move.col] = this.aiPlayer;
                
                const result = this.minimax(board, depth - 1, alpha, beta, false);
                
                // Undo move
                board[move.row][move.col] = '';
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            
            for (const move of availableMoves) {
                // Make move
                board[move.row][move.col] = this.humanPlayer;
                
                const result = this.minimax(board, depth - 1, alpha, beta, true);
                
                // Undo move
                board[move.row][move.col] = '';
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            return { score: minScore, move: bestMove };
        }
    }

    // Evaluate board position
    evaluateBoard(board) {
        let score = 0;
        
        // Check all possible lines of 5
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                // Check all 4 directions from this position
                const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
                
                for (const [dRow, dCol] of directions) {
                    const lineScore = this.evaluateLine(board, row, col, dRow, dCol);
                    score += lineScore;
                }
            }
        }
        
        return score;
    }

    // Evaluate a line of 5 positions
    evaluateLine(board, startRow, startCol, dRow, dCol) {
        let aiCount = 0;
        let humanCount = 0;
        let emptyCount = 0;
        
        // Check 5 consecutive positions
        for (let i = 0; i < 5; i++) {
            const row = startRow + i * dRow;
            const col = startCol + i * dCol;
            
            // Check bounds
            if (row < 0 || row >= 15 || col < 0 || col >= 15) {
                return 0; // Out of bounds
            }
            
            const cell = board[row][col];
            if (cell === this.aiPlayer) aiCount++;
            else if (cell === this.humanPlayer) humanCount++;
            else emptyCount++;
        }
        
        // Can't win if both players have pieces in this line
        if (aiCount > 0 && humanCount > 0) return 0;
        
        // Score based on piece count
        if (aiCount === 5) return 10000; // AI wins
        if (humanCount === 5) return -10000; // Human wins
        if (aiCount === 4) return 1000; // AI about to win
        if (humanCount === 4) return -1000; // Block human win
        if (aiCount === 3) return 100;
        if (humanCount === 3) return -100;
        if (aiCount === 2) return 10;
        if (humanCount === 2) return -10;
        if (aiCount === 1) return 1;
        if (humanCount === 1) return -1;
        
        return 0;
    }

    // Find immediate winning move
    findWinningMove(board, player) {
        const moves = this.getAvailableMoves(board);
        
        for (const move of moves) {
            // Try the move
            board[move.row][move.col] = player;
            
            // Check if it creates a win
            if (this.checkWinAt(board, move.row, move.col, player)) {
                board[move.row][move.col] = ''; // Undo
                return move;
            }
            
            board[move.row][move.col] = ''; // Undo
        }
        
        return null;
    }

    // Check if placing a piece at position creates a win
    checkWinAt(board, row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [dRow, dCol] of directions) {
            let count = 1; // Count the piece we just placed
            
            // Check positive direction
            let r = row + dRow;
            let c = col + dCol;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                r += dRow;
                c += dCol;
            }
            
            // Check negative direction
            r = row - dRow;
            c = col - dCol;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                r -= dRow;
                c -= dCol;
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }

    // Get all available moves
    getAvailableMoves(board) {
        const moves = [];
        
        // Optimize: only consider moves near existing pieces
        const nearExisting = this.getMovesNearExisting(board);
        if (nearExisting.length > 0) {
            return nearExisting;
        }
        
        // If no pieces on board, start in center area
        for (let row = 6; row < 9; row++) {
            for (let col = 6; col < 9; col++) {
                if (board[row][col] === '') {
                    moves.push({ row, col });
                }
            }
        }
        
        return moves;
    }

    // Get moves near existing pieces (optimization)
    getMovesNearExisting(board) {
        const moves = new Set();
        
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] !== '') {
                    // Add adjacent empty cells
                    for (let dr = -2; dr <= 2; dr++) {
                        for (let dc = -2; dc <= 2; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            
                            if (newRow >= 0 && newRow < 15 && 
                                newCol >= 0 && newCol < 15 && 
                                board[newRow][newCol] === '') {
                                moves.add(`${newRow},${newCol}`);
                            }
                        }
                    }
                }
            }
        }
        
        return Array.from(moves).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });
    }

    // Fallback random move
    makeRandomMove(board) {
        const moves = this.getAvailableMoves(board);
        if (moves.length === 0) return null;
        
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiveInARowAI;
} else {
    window.FiveInARowAI = FiveInARowAI;
} 