// AI for 5 in a Row Game
class FiveInARowAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.aiPlayer = 'O';
        this.humanPlayer = 'X';
        this.evaluationCache = new Map(); // Cache for position evaluations
    }

    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 2;
            case 'medium': return 3;  // Reduced from 4 to 3
            case 'hard': return 4;    // Reduced from 6 to 4
            default: return 3;
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

        // Clear cache for new search
        this.evaluationCache.clear();

        // Use minimax for strategic move with move ordering
        const bestMove = this.minimaxWithOrdering(board, this.maxDepth, -Infinity, Infinity, true);
        return bestMove.move || this.makeRandomMove(board);
    }

    // Minimax with move ordering for better pruning
    minimaxWithOrdering(board, depth, alpha, beta, isMaximizing) {
        const boardKey = this.getBoardKey(board);
        if (this.evaluationCache.has(boardKey)) {
            const cached = this.evaluationCache.get(boardKey);
            if (cached.depth >= depth) {
                return cached.result;
            }
        }

        const score = this.evaluateBoard(board);
        
        // Terminal conditions
        if (depth === 0 || Math.abs(score) >= 1000) {
            return { score };
        }

        const availableMoves = this.getAvailableMoves(board);
        if (availableMoves.length === 0) {
            return { score: 0 };
        }

        // Order moves for better alpha-beta pruning
        const orderedMoves = this.orderMoves(board, availableMoves, isMaximizing);
        
        let bestMove = null;

        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of orderedMoves) {
                // Make move
                board[move.row][move.col] = this.aiPlayer;
                
                const result = this.minimaxWithOrdering(board, depth - 1, alpha, beta, false);
                
                // Undo move
                board[move.row][move.col] = '';
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            const finalResult = { score: maxScore, move: bestMove };
            this.evaluationCache.set(boardKey, { depth, result: finalResult });
            return finalResult;
        } else {
            let minScore = Infinity;
            
            for (const move of orderedMoves) {
                // Make move
                board[move.row][move.col] = this.humanPlayer;
                
                const result = this.minimaxWithOrdering(board, depth - 1, alpha, beta, true);
                
                // Undo move
                board[move.row][move.col] = '';
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            const finalResult = { score: minScore, move: bestMove };
            this.evaluationCache.set(boardKey, { depth, result: finalResult });
            return finalResult;
        }
    }

    // Order moves for better alpha-beta pruning
    orderMoves(board, moves, isMaximizing) {
        const player = isMaximizing ? this.aiPlayer : this.humanPlayer;
        
        // Score each move quickly
        const scoredMoves = moves.map(move => {
            board[move.row][move.col] = player;
            const score = this.quickEvaluate(board, move.row, move.col);
            board[move.row][move.col] = '';
            return { move, score };
        });

        // Sort moves by score (best first for better pruning)
        scoredMoves.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);
        
        return scoredMoves.map(item => item.move);
    }

    // Quick evaluation for move ordering (faster than full board evaluation)
    quickEvaluate(board, row, col) {
        const player = board[row][col];
        let score = 0;
        
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [dRow, dCol] of directions) {
            let count = 1;
            let blocked = 0;
            
            // Check positive direction
            for (let i = 1; i < 5; i++) {
                const r = row + dRow * i;
                const c = col + dCol * i;
                if (r < 0 || r >= 15 || c < 0 || c >= 15) { blocked++; break; }
                if (board[r][c] === player) count++;
                else if (board[r][c] !== '') { blocked++; break; }
                else break;
            }
            
            // Check negative direction
            for (let i = 1; i < 5; i++) {
                const r = row - dRow * i;
                const c = col - dCol * i;
                if (r < 0 || r >= 15 || c < 0 || c >= 15) { blocked++; break; }
                if (board[r][c] === player) count++;
                else if (board[r][c] !== '') { blocked++; break; }
                else break;
            }
            
            if (blocked < 2) { // Not blocked on both ends
                if (count >= 4) score += 1000;
                else if (count >= 3) score += 100;
                else if (count >= 2) score += 10;
                else score += 1;
            }
        }
        
        return player === this.aiPlayer ? score : -score;
    }

    // Generate board key for caching
    getBoardKey(board) {
        return board.map(row => row.join('')).join('|');
    }

    // Optimized board evaluation
    evaluateBoard(board) {
        let score = 0;
        
        // Only check lines that contain at least one piece
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] !== '') {
                    // Check all 4 directions from pieces only
                    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
                    
                    for (const [dRow, dCol] of directions) {
                        // Only evaluate if this is the starting position of a potential line
                        if (this.isLineStart(board, row, col, dRow, dCol)) {
                            const lineScore = this.evaluateLine(board, row, col, dRow, dCol);
                            score += lineScore;
                        }
                    }
                }
            }
        }
        
        return score;
    }

    // Check if this position is the start of a line in this direction
    isLineStart(board, row, col, dRow, dCol) {
        const prevRow = row - dRow;
        const prevCol = col - dCol;
        
        // If previous position is out of bounds or different player, this is a line start
        if (prevRow < 0 || prevRow >= 15 || prevCol < 0 || prevCol >= 15) {
            return true;
        }
        
        return board[prevRow][prevCol] !== board[row][col];
    }

    // Evaluate a line of 5 positions (optimized)
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

    // Optimized move generation
    getAvailableMoves(board) {
        // Optimize: only consider moves near existing pieces
        const nearExisting = this.getMovesNearExisting(board);
        if (nearExisting.length > 0) {
            // Limit moves to prevent explosion in late game
            return nearExisting.slice(0, Math.min(nearExisting.length, 20));
        }
        
        // If no pieces on board, start in center area
        const centerMoves = [];
        for (let row = 6; row < 9; row++) {
            for (let col = 6; col < 9; col++) {
                if (board[row][col] === '') {
                    centerMoves.push({ row, col });
                }
            }
        }
        
        return centerMoves;
    }

    // Get moves near existing pieces (optimized)
    getMovesNearExisting(board) {
        const moves = new Set();
        
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] !== '') {
                    // Add adjacent empty cells (reduced range for performance)
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
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