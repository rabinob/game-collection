// AI for International Draughts Game
class CheckersAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.aiPlayer = 'white';
        this.humanPlayer = 'red';
        this.evaluationCache = new Map();
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
        
        // Get all available moves for AI
        const availableMoves = this.getAllMovesForPlayer(board, this.aiPlayer);
        
        if (availableMoves.length === 0) {
            return null;
        }
        if (availableMoves.length === 1) {
            return availableMoves[0];
        }

        // Clear cache and use minimax for strategic move
        this.evaluationCache.clear();
        const bestMove = this.minimax(board, this.maxDepth, -Infinity, Infinity, true);
        return bestMove.move || availableMoves[0];
    }

    // Minimax algorithm with alpha-beta pruning and caching
    minimax(board, depth, alpha, beta, isMaximizing) {
        const boardKey = this.getBoardKey(board);
        if (this.evaluationCache.has(boardKey)) {
            const cached = this.evaluationCache.get(boardKey);
            if (cached.depth >= depth) {
                return cached.result;
            }
        }

        const score = this.evaluateBoard(board);
        
        if (depth === 0 || Math.abs(score) >= 10000) {
            return { score: score, move: null };
        }

        const player = isMaximizing ? this.aiPlayer : this.humanPlayer;
        const availableMoves = this.getAllMovesForPlayer(board, player);
        
        if (availableMoves.length === 0) {
            const terminalScore = isMaximizing ? -10000 : 10000;
            return { score: terminalScore, move: null };
        }

        let bestMove = availableMoves[0];

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of availableMoves) {
                const newBoard = this.simulateMove(board, move);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false);
                
                if (result && result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                if (result) {
                    alpha = Math.max(alpha, result.score);
                }
                if (beta <= alpha) break;
            }
            const finalResult = { score: maxScore, move: bestMove };
            this.evaluationCache.set(boardKey, { depth, result: finalResult });
            return finalResult;

        } else {
            let minScore = Infinity;
            for (const move of availableMoves) {
                const newBoard = this.simulateMove(board, move);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true);

                if (result && result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                if (result) {
                    beta = Math.min(beta, result.score);
                }
                if (beta <= alpha) break;
            }
            const finalResult = { score: minScore, move: bestMove };
            this.evaluationCache.set(boardKey, { depth, result: finalResult });
            return finalResult;
        }
    }
    
    // Perform a move on a deep copy of the board for simulation
    simulateMove(board, move) {
        // Fast deep copy, which is critical for performance
        const newBoard = board.map(row => row.map(cell => cell ? {...cell} : null));

        const piece = newBoard[move.fromRow][move.fromCol];
        newBoard[move.toRow][move.toCol] = piece;
        newBoard[move.fromRow][move.fromCol] = null;

        if (move.capturedPieces) {
            move.capturedPieces.forEach(captured => {
                newBoard[captured.row][captured.col] = null;
            });
        }

        if (piece && !piece.isKing) {
            if ((piece.color === 'red' && move.toRow === 7) || (piece.color === 'white' && move.toRow === 0)) {
                newBoard[move.toRow][move.toCol].isKing = true;
            }
        }
        return newBoard;
    }

    // Generate a unique key for the board state for caching
    getBoardKey(board) {
        return board.map(row => 
            row.map(cell => cell ? `${cell.color[0]}${cell.isKing ? 'K' : 'M'}` : 'E').join('')
        ).join('|');
    }

    // Get all possible moves for a player (captures are mandatory)
    getAllMovesForPlayer(board, player) {
        const captures = [];
        const normalMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === player) {
                    const pieceMoves = this.getPossibleMovesForPiece(board, row, col);
                    pieceMoves.forEach(move => {
                        if (move.isCapture) captures.push(move);
                        else normalMoves.push(move);
                    });
                }
            }
        }
        return captures.length > 0 ? captures : normalMoves;
    }

    // Get all possible moves for a single piece
    getPossibleMovesForPiece(board, row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        const moves = this.getCaptureMoves(board, row, col, piece);
        if (moves.length === 0) {
            moves.push(...this.getNormalMoves(board, row, col, piece));
        }
        return moves;
    }

    // Get all capture moves for a piece
    getCaptureMoves(board, row, col, piece) {
        const captures = [];
        if (piece.isKing) {
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            directions.forEach(([dRow, dCol]) => {
                for (let dist = 1; dist < 8; dist++) {
                    const targetRow = row + dRow * dist;
                    const targetCol = col + dCol * dist;
                    if (targetRow < 0 || targetRow >= 8 || targetCol < 0 || targetCol >= 8) break;
                    const targetPiece = board[targetRow][targetCol];
                    if (targetPiece) {
                        if (targetPiece.color !== piece.color) {
                            for (let landDist = dist + 1; landDist < 8; landDist++) {
                                const landRow = row + dRow * landDist;
                                const landCol = col + dCol * landDist;
                                if (landRow < 0 || landRow >= 8 || landCol < 0 || landCol >= 8) break;
                                if (!board[landRow][landCol]) {
                                    captures.push({ fromRow: row, fromCol: col, toRow: landRow, toCol: landCol, isCapture: true, capturedPieces: [{ row: targetRow, col: targetCol }] });
                                } else break;
                            }
                        }
                        break;
                    }
                }
            });
        } else {
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            directions.forEach(([dRow, dCol]) => {
                const capturedRow = row + dRow;
                const capturedCol = col + dCol;
                const landRow = row + dRow * 2;
                const landCol = col + dCol * 2;
                // Added bounds check for captured piece to prevent crashing error
                if (landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8 &&
                    capturedRow >= 0 && capturedRow < 8 && capturedCol >= 0 && capturedCol < 8 &&
                    !board[landRow][landCol] && board[capturedRow][capturedCol] && board[capturedRow][capturedCol].color !== piece.color) {
                    captures.push({ fromRow: row, fromCol: col, toRow: landRow, toCol: landCol, isCapture: true, capturedPieces: [{ row: capturedRow, col: capturedCol }] });
                }
            });
        }
        return captures;
    }

    // Get all normal moves for a piece
    getNormalMoves(board, row, col, piece) {
        const moves = [];
        if (piece.isKing) {
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            directions.forEach(([dRow, dCol]) => {
                for (let dist = 1; dist < 8; dist++) {
                    const newRow = row + dRow * dist;
                    const newCol = col + dCol * dist;
                    if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                    if (!board[newRow][newCol]) {
                        moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol, isCapture: false });
                    } else break;
                }
            });
        } else {
            const directions = piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
            directions.forEach(([dRow, dCol]) => {
                const newRow = row + dRow;
                const newCol = col + dCol;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
                    moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol, isCapture: false });
                }
            });
        }
        return moves;
    }

    // Evaluate the board state
    evaluateBoard(board) {
        let score = 0;
        let aiPieces = 0, humanPieces = 0, aiKings = 0, humanKings = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    if (piece.color === this.aiPlayer) {
                        aiPieces++;
                        if (piece.isKing) aiKings++;
                        score += (piece.isKing ? 10 : 5) + this.getPositionValue(r, c, piece);
                    } else {
                        humanPieces++;
                        if (piece.isKing) humanKings++;
                        score -= (piece.isKing ? 10 : 5) + this.getPositionValue(r, c, piece);
                    }
                }
            }
        }
        if (aiPieces === 0) return -10000;
        if (humanPieces === 0) return 10000;
        return score + (aiKings - humanKings) * 5;
    }

    // Get positional value for a piece
    getPositionValue(row, col, piece) {
        let value = 0;
        if (!piece.isKing) {
            value += piece.color === 'white' ? (7 - row) * 0.2 : row * 0.2;
        }
        if (row === 0 || row === 7 || col === 0 || col === 7) {
            value -= 0.5;
        }
        return value;
    }
    
    // Fallback random move
    makeRandomMove(board) {
        const moves = this.getAllMovesForPlayer(board, this.aiPlayer);
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckersAI;
} else {
    window.CheckersAI = CheckersAI;
} 