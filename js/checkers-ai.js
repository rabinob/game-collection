// AI for International Draughts Game
class CheckersAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.aiPlayer = 'white';
        this.humanPlayer = 'red';
    }

    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 3;
            case 'medium': return 5;
            case 'hard': return 7;
            default: return 5;
        }
    }

    // Main AI move function
    makeMove(board) {
        console.log(`🤖 AI thinking (${this.difficulty} mode)...`);
        
        // Easy mode - make some random moves
        if (this.difficulty === 'easy' && Math.random() < 0.3) {
            return this.makeRandomMove(board);
        }

        // Get all available moves for AI
        const availableMoves = this.getAllMovesForPlayer(board, this.aiPlayer);
        
        if (availableMoves.length === 0) {
            return null; // No moves available
        }

        // If only one move available, take it
        if (availableMoves.length === 1) {
            return availableMoves[0];
        }

        // Use minimax for strategic move
        const bestMove = this.minimax(board, this.maxDepth, -Infinity, Infinity, true);
        return bestMove.move || availableMoves[0];
    }

    // Minimax algorithm with alpha-beta pruning
    minimax(board, depth, alpha, beta, isMaximizing) {
        const score = this.evaluateBoard(board);
        
        // Terminal conditions
        if (depth === 0 || Math.abs(score) >= 10000) {
            return { score };
        }

        const player = isMaximizing ? this.aiPlayer : this.humanPlayer;
        const availableMoves = this.getAllMovesForPlayer(board, player);
        
        if (availableMoves.length === 0) {
            // No moves available - game over
            return { score: isMaximizing ? -10000 : 10000 };
        }

        let bestMove = null;

        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of availableMoves) {
                // Make move
                const newBoard = this.makeMove(board, move);
                
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false);
                
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
                const newBoard = this.makeMove(board, move);
                
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true);
                
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

    // Make a move and return new board state
    makeMove(board, move) {
        const newBoard = board.map(row => [...row]);
        
        // Move piece
        const piece = newBoard[move.fromRow][move.fromCol];
        newBoard[move.toRow][move.toCol] = piece;
        newBoard[move.fromRow][move.fromCol] = null;
        
        // Handle captures
        if (move.capturedPieces) {
            move.capturedPieces.forEach(captured => {
                newBoard[captured.row][captured.col] = null;
            });
        }
        
        // Handle king promotion
        if (piece && !piece.isKing) {
            if ((piece.color === 'red' && move.toRow === 7) || 
                (piece.color === 'white' && move.toRow === 0)) {
                newBoard[move.toRow][move.toCol] = { ...piece, isKing: true };
            }
        }
        
        return newBoard;
    }

    // Get all possible moves for a player
    getAllMovesForPlayer(board, player) {
        const moves = [];
        
        // First check for captures (mandatory)
        const captures = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === player) {
                    const pieceMoves = this.getPossibleMovesForPiece(board, row, col);
                    const pieceCaptures = pieceMoves.filter(move => move.isCapture);
                    captures.push(...pieceCaptures);
                }
            }
        }
        
        // If captures available, return only captures (mandatory)
        if (captures.length > 0) {
            return captures;
        }
        
        // No captures available, return normal moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === player) {
                    const pieceMoves = this.getPossibleMovesForPiece(board, row, col);
                    const normalMoves = pieceMoves.filter(move => !move.isCapture);
                    moves.push(...normalMoves);
                }
            }
        }
        
        return moves;
    }

    // Get possible moves for a specific piece
    getPossibleMovesForPiece(board, row, col) {
        const piece = board[row][col];
        if (!piece) return [];

        const moves = [];

        // Check for captures first
        const captures = this.getCaptureMoves(board, row, col, piece);
        moves.push(...captures);

        // If no captures, check normal moves
        if (captures.length === 0) {
            const normalMoves = this.getNormalMoves(board, row, col, piece);
            moves.push(...normalMoves);
        }

        return moves;
    }

    // Get capture moves for a piece
    getCaptureMoves(board, row, col, piece) {
        const captures = [];
        
        if (piece.isKing) {
            // Flying king captures
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            
            directions.forEach(([dRow, dCol]) => {
                for (let distance = 1; distance < 8; distance++) {
                    const targetRow = row + dRow * distance;
                    const targetCol = col + dCol * distance;
                    
                    if (targetRow < 0 || targetRow >= 8 || targetCol < 0 || targetCol >= 8) break;
                    
                    const targetPiece = board[targetRow][targetCol];
                    
                    if (targetPiece) {
                        if (targetPiece.color !== piece.color) {
                            // Found enemy piece, check for landing spots
                            for (let landDistance = distance + 1; landDistance < 8; landDistance++) {
                                const landRow = row + dRow * landDistance;
                                const landCol = col + dCol * landDistance;
                                
                                if (landRow < 0 || landRow >= 8 || landCol < 0 || landCol >= 8) break;
                                
                                if (!board[landRow][landCol]) {
                                    captures.push({
                                        fromRow: row,
                                        fromCol: col,
                                        toRow: landRow,
                                        toCol: landCol,
                                        isCapture: true,
                                        capturedPieces: [{ row: targetRow, col: targetCol }]
                                    });
                                } else {
                                    break;
                                }
                            }
                        }
                        break; // Hit a piece, stop in this direction
                    }
                }
            });
        } else {
            // Regular piece captures (all directions for International Draughts)
            const captureDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            
            captureDirections.forEach(([dRow, dCol]) => {
                const jumpRow = row + dRow * 2;
                const jumpCol = col + dCol * 2;
                const capturedRow = row + dRow;
                const capturedCol = col + dCol;

                if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 &&
                    !board[jumpRow][jumpCol] && 
                    board[capturedRow] && board[capturedRow][capturedCol] &&
                    board[capturedRow][capturedCol].color !== piece.color) {
                    
                    captures.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: jumpRow,
                        toCol: jumpCol,
                        isCapture: true,
                        capturedPieces: [{ row: capturedRow, col: capturedCol }]
                    });
                }
            });
        }
        
        return captures;
    }

    // Get normal moves for a piece
    getNormalMoves(board, row, col, piece) {
        const moves = [];
        
        if (piece.isKing) {
            // Flying king movement
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            
            directions.forEach(([dRow, dCol]) => {
                for (let distance = 1; distance < 8; distance++) {
                    const newRow = row + dRow * distance;
                    const newCol = col + dCol * distance;
                    
                    if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                    
                    if (!board[newRow][newCol]) {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: newRow,
                            toCol: newCol,
                            isCapture: false
                        });
                    } else {
                        break;
                    }
                }
            });
        } else {
            // Regular piece movement (forward only)
            const moveDirections = piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
            
            moveDirections.forEach(([dRow, dCol]) => {
                const newRow = row + dRow;
                const newCol = col + dCol;

                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
                    moves.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: newRow,
                        toCol: newCol,
                        isCapture: false
                    });
                }
            });
        }
        
        return moves;
    }

    // Evaluate board position
    evaluateBoard(board) {
        let score = 0;
        let aiPieces = 0;
        let humanPieces = 0;
        let aiKings = 0;
        let humanKings = 0;
        
        // Count pieces and evaluate positions
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceValue = piece.isKing ? 10 : 5;
                    const positionValue = this.getPositionValue(row, col, piece);
                    
                    if (piece.color === this.aiPlayer) {
                        aiPieces++;
                        if (piece.isKing) aiKings++;
                        score += pieceValue + positionValue;
                    } else {
                        humanPieces++;
                        if (piece.isKing) humanKings++;
                        score -= pieceValue + positionValue;
                    }
                }
            }
        }
        
        // Game over conditions
        if (aiPieces === 0) return -10000;
        if (humanPieces === 0) return 10000;
        
        // Bonus for more pieces
        score += (aiPieces - humanPieces) * 3;
        
        // Bonus for kings
        score += (aiKings - humanKings) * 5;
        
        // Mobility bonus
        const aiMobility = this.getAllMovesForPlayer(board, this.aiPlayer).length;
        const humanMobility = this.getAllMovesForPlayer(board, this.humanPlayer).length;
        score += (aiMobility - humanMobility) * 0.1;
        
        return score;
    }

    // Get position value for a piece
    getPositionValue(row, col, piece) {
        let value = 0;
        
        // Center control bonus
        const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
        value += (7 - centerDistance) * 0.1;
        
        // Advancement bonus for regular pieces
        if (!piece.isKing) {
            if (piece.color === 'white') {
                value += (7 - row) * 0.2; // White advances toward row 0
            } else {
                value += row * 0.2; // Red advances toward row 7
            }
        }
        
        // Edge penalty
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