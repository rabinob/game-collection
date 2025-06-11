// AI for 5 in a Row Game
class FiveInARowAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.aiPlayer = 'O';
        this.humanPlayer = 'X';
        this.evaluationCache = new Map();
        this.startTime = 0;
        this.timeLimit = 4000; // 4 second hard limit
    }

    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 1;     // Drastically reduced
            case 'medium': return 2;   // Drastically reduced  
            case 'hard': return 3;     // Drastically reduced
            default: return 2;
        }
    }

    // Main AI move function with timeout
    makeMove(board) {
        console.log(`🤖 AI thinking (${this.difficulty} mode)...`);
        this.startTime = Date.now();
        
        // Easy mode - make random moves more often
        if (this.difficulty === 'easy' && Math.random() < 0.5) {
            return this.makeRandomMove(board);
        }

        // Check for immediate win
        const winMove = this.findWinningMove(board, this.aiPlayer);
        if (winMove) return winMove;

        // Check for immediate block
        const blockMove = this.findWinningMove(board, this.humanPlayer);
        if (blockMove) return blockMove;

        // Clear cache and use simplified search
        this.evaluationCache.clear();

        // Use simplified minimax with timeout
        const bestMove = this.minimaxWithTimeout(board, this.maxDepth, -Infinity, Infinity, true);
        return bestMove.move || this.makeRandomMove(board);
    }

    // Simplified minimax with timeout mechanism
    minimaxWithTimeout(board, depth, alpha, beta, isMaximizing) {
        // Timeout check
        if (Date.now() - this.startTime > this.timeLimit) {
            return { score: 0 }; // Return neutral score on timeout
        }

        const score = this.simpleEvaluate(board);
        
        // Terminal conditions
        if (depth === 0 || Math.abs(score) >= 1000) {
            return { score };
        }

        const availableMoves = this.getAvailableMoves(board);
        if (availableMoves.length === 0) {
            return { score: 0 };
        }

        // Limit moves aggressively
        const limitedMoves = availableMoves.slice(0, Math.min(availableMoves.length, 8));
        
        let bestMove = null;

        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of limitedMoves) {
                // Timeout check
                if (Date.now() - this.startTime > this.timeLimit) break;
                
                board[move.row][move.col] = this.aiPlayer;
                const result = this.minimaxWithTimeout(board, depth - 1, alpha, beta, false);
                board[move.row][move.col] = '';
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break;
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            
            for (const move of limitedMoves) {
                // Timeout check
                if (Date.now() - this.startTime > this.timeLimit) break;
                
                board[move.row][move.col] = this.humanPlayer;
                const result = this.minimaxWithTimeout(board, depth - 1, alpha, beta, true);
                board[move.row][move.col] = '';
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break;
            }
            
            return { score: minScore, move: bestMove };
        }
    }

    // Much simpler and faster evaluation
    simpleEvaluate(board) {
        let score = 0;
        
        // Only check around existing pieces
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] !== '') {
                    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
                    
                    for (const [dRow, dCol] of directions) {
                        const lineScore = this.quickLineEval(board, row, col, dRow, dCol);
                        score += lineScore;
                    }
                }
            }
        }
        
        return score;
    }

    // Ultra-fast line evaluation
    quickLineEval(board, startRow, startCol, dRow, dCol) {
        let aiCount = 0;
        let humanCount = 0;
        
        // Check only 5 positions
        for (let i = 0; i < 5; i++) {
            const row = startRow + i * dRow;
            const col = startCol + i * dCol;
            
            if (row < 0 || row >= 15 || col < 0 || col >= 15) return 0;
            
            const cell = board[row][col];
            if (cell === this.aiPlayer) aiCount++;
            else if (cell === this.humanPlayer) humanCount++;
        }
        
        if (aiCount > 0 && humanCount > 0) return 0;
        
        // Simplified scoring
        if (aiCount === 5) return 10000;
        if (humanCount === 5) return -10000;
        if (aiCount === 4) return 500;
        if (humanCount === 4) return -500;
        if (aiCount === 3) return 50;
        if (humanCount === 3) return -50;
        if (aiCount === 2) return 5;
        if (humanCount === 2) return -5;
        
        return 0;
    }

    // Find immediate winning move (simplified)
    findWinningMove(board, player) {
        const moves = this.getAvailableMoves(board);
        
        // Limit search for performance
        const limitedMoves = moves.slice(0, Math.min(moves.length, 15));
        
        for (const move of limitedMoves) {
            board[move.row][move.col] = player;
            if (this.checkWinAt(board, move.row, move.col, player)) {
                board[move.row][move.col] = '';
                return move;
            }
            board[move.row][move.col] = '';
        }
        
        return null;
    }

    // Simplified win check
    checkWinAt(board, row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [dRow, dCol] of directions) {
            let count = 1;
            
            // Check positive direction
            for (let i = 1; i < 5; i++) {
                const r = row + dRow * i;
                const c = col + dCol * i;
                if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check negative direction  
            for (let i = 1; i < 5; i++) {
                const r = row - dRow * i;
                const c = col - dCol * i;
                if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }

    // Simplified move generation
    getAvailableMoves(board) {
        const moves = [];
        
        // Only check immediate vicinity of existing pieces
        const occupiedCells = [];
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] !== '') {
                    occupiedCells.push({ row, col });
                }
            }
        }
        
        if (occupiedCells.length === 0) {
            // Start in center
            return [{ row: 7, col: 7 }];
        }
        
        const moveSet = new Set();
        
        // Add moves adjacent to existing pieces
        occupiedCells.forEach(({ row, col }) => {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    
                    if (newRow >= 0 && newRow < 15 && 
                        newCol >= 0 && newCol < 15 && 
                        board[newRow][newCol] === '') {
                        moveSet.add(`${newRow},${newCol}`);
                    }
                }
            }
        });
        
        // Convert to array and limit
        const allMoves = Array.from(moveSet).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });
        
        return allMoves.slice(0, Math.min(allMoves.length, 12));
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