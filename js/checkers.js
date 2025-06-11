// Game state variables
let board = [];
let currentPlayer = 'white';
let selectedPiece = null;
let gameActive = true;
let gameStarted = false;
let scores = { red: 0, white: 0 };
let players = {
    red: { name: '', phone: '', email: '' },
    white: { name: '', phone: '', email: '' }
};
let winner = null;
let mustContinueWith = null; // Piece that must continue jumping
let possibleMoves = [];

// AI-related variables
let gameMode = 'human'; // 'human' or 'ai'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let ai = null;
let isAiThinking = false;

function initGame() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    setupInitialBoard();
    loadScores();
    loadPlayers();
}

// Set game mode
function setGameMode(mode) {
    gameMode = mode;
    const humanMode = document.getElementById('human-mode');
    const aiMode = document.getElementById('ai-mode');
    const aiSettings = document.getElementById('ai-settings');
    const playerWhiteInputs = document.getElementById('player-white-inputs');
    
    if (mode === 'ai') {
        humanMode.classList.remove('selected');
        aiMode.classList.add('selected');
        aiSettings.style.display = 'block';
        playerWhiteInputs.style.display = 'none';
        
        // Set AI player name
        players.white.name = `AI (${aiDifficulty})`;
        players.white.phone = '';
        players.white.email = '';
    } else {
        aiMode.classList.remove('selected');
        humanMode.classList.add('selected');
        aiSettings.style.display = 'none';
        playerWhiteInputs.style.display = 'flex';
        
        // Reset to human player
        players.white.name = document.getElementById('player-white-name').value.trim();
        players.white.phone = document.getElementById('player-white-phone').value.trim();
        players.white.email = document.getElementById('player-white-email').value.trim();
    }
}

// Set AI difficulty
function setAiDifficulty(difficulty) {
    aiDifficulty = difficulty;
    players.white.name = `AI (${difficulty})`;
    
    // Update difficulty buttons
    document.querySelectorAll('.ai-difficulty').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById(`difficulty-${difficulty}`).classList.add('selected');
}

function setupInitialBoard() {
    // Place red pieces (top 3 rows)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { color: 'red', isKing: false };
            }
        }
    }

    // Place white pieces (bottom 3 rows)
    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { color: 'white', isKing: false };
            }
        }
    }
}

// Start game after player setup
function startGame() {
    const playerRedName = document.getElementById('player-red-name').value.trim();
    
    if (!playerRedName) {
        alert('Please enter a name for the Red player!');
        return;
    }

    if (gameMode === 'human') {
        const playerWhiteName = document.getElementById('player-white-name').value.trim();
        if (!playerWhiteName) {
            alert('Please enter a name for the White player!');
            return;
        }
        
        players.red.name = playerRedName;
        players.red.phone = document.getElementById('player-red-phone').value.trim();
        players.red.email = document.getElementById('player-red-email').value.trim();
        players.white.name = playerWhiteName;
        players.white.phone = document.getElementById('player-white-phone').value.trim();
        players.white.email = document.getElementById('player-white-email').value.trim();
    } else {
        // AI mode
        players.red.name = playerRedName;
        players.red.phone = document.getElementById('player-red-phone').value.trim();
        players.red.email = document.getElementById('player-red-email').value.trim();
        players.white.name = `AI (${aiDifficulty})`;
        players.white.phone = '';
        players.white.email = '';
        
        // Initialize AI
        ai = new CheckersAI(aiDifficulty);
    }

    savePlayers();
    updatePlayerDisplays();

    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('game-info').style.display = 'block';
    document.getElementById('game-area').style.display = 'block';

    gameStarted = true;
    createBoard();
    
    // If AI goes first (white), make AI move
    if (currentPlayer === 'white' && gameMode === 'ai' && gameActive) {
        setTimeout(() => makeAiMove(), 1000);
    }
}

// Show setup screen
function showSetup() {
    document.getElementById('player-setup').style.display = 'block';
    document.getElementById('game-info').style.display = 'none';
    document.getElementById('game-area').style.display = 'none';
    gameStarted = false;
    gameActive = true;
    isAiThinking = false;
}

// Update player displays
function updatePlayerDisplays() {
    document.getElementById('player-red-display').textContent = players.red.name || 'Red';
    document.getElementById('player-white-display').textContent = players.white.name || 'White';
    
    let currentPlayerName = players[currentPlayer].name || currentPlayer;
    
    if (isAiThinking && currentPlayer === 'white' && gameMode === 'ai') {
        currentPlayerName += ' (thinking...)';
    }
    
    let displayText = currentPlayerName;
    
    if (!isAiThinking) {
        if (mustContinueWith) {
            displayText += ' (must continue jumping!)';
        } else if (gameActive && gameStarted) {
            const availableCaptures = getAllCaptures(currentPlayer);
            if (availableCaptures.length > 0) {
                // Count how many different pieces can capture
                const capturingPieces = new Set();
                availableCaptures.forEach(capture => {
                    capturingPieces.add(`${capture.fromRow}-${capture.fromCol}`);
                });
                
                if (capturingPieces.size > 1) {
                    displayText += ` (must capture! ${capturingPieces.size} pieces can capture - choose one)`;
                } else {
                    displayText += ' (must capture!)';
                }
            }
        }
    }
    
    document.getElementById('current-player').textContent = displayText;
}

function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(row, col));

            if (board[row][col]) {
                const piece = document.createElement('div');
                piece.className = `piece ${board[row][col].color} ${board[row][col].isKing ? 'king' : ''}`;
                piece.textContent = board[row][col].isKing ? '♔' : '';
                cell.appendChild(piece);
            }

            gameBoard.appendChild(cell);
        }
    }
}

function handleCellClick(row, col) {
    if (!gameActive || !gameStarted || isAiThinking) return;

    const piece = board[row][col];

    // If we must continue with a specific piece, only allow that piece
    if (mustContinueWith) {
        if (mustContinueWith.row === row && mustContinueWith.col === col) {
            selectPiece(row, col);
        } else if (selectedPiece && isPossibleMove(row, col)) {
            makeMove(selectedPiece.row, selectedPiece.col, row, col);
        }
        return;
    }

    // Check if any captures are available for current player
    const availableCaptures = getAllCaptures(currentPlayer);
    
    // Normal piece selection and movement
    if (piece && piece.color === currentPlayer) {
        // If captures are available, only allow pieces that can capture
        if (availableCaptures.length > 0) {
            const canThisPieceCapture = availableCaptures.some(capture => 
                capture.fromRow === row && capture.fromCol === col);
            if (canThisPieceCapture) {
                selectPiece(row, col);
            }
        } else {
            selectPiece(row, col);
        }
    } else if (selectedPiece && isPossibleMove(row, col)) {
        makeMove(selectedPiece.row, selectedPiece.col, row, col);
    }
}

function selectPiece(row, col) {
    clearHighlights();
    selectedPiece = { row, col };
    possibleMoves = getPossibleMoves(row, col);
    
    // Highlight selected piece and possible moves
    document.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
    possibleMoves.forEach(move => {
        const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
        if (move.isCapture) {
            cell.classList.add('capture-move');
        } else {
            cell.classList.add('possible-move');
        }
    });
    
    // Show status message if this piece has multiple capture options
    const captures = possibleMoves.filter(move => move.isCapture);
    if (captures.length > 1) {
        const winnerMessage = document.getElementById('winner-message');
        winnerMessage.textContent = `Choose your capture! ${captures.length} different capture moves available.`;
        winnerMessage.classList.add('show');
        setTimeout(() => {
            winnerMessage.classList.remove('show');
        }, 2000);
    }
    
    // If captures are available but not selected, highlight all pieces that can capture
    if (!mustContinueWith) {
        const availableCaptures = getAllCaptures(currentPlayer);
        if (availableCaptures.length > 0) {
            highlightCapturablePieces(availableCaptures);
        }
    }
}

function highlightCapturablePieces(captures) {
    const capturablePieces = new Set();
    captures.forEach(capture => {
        capturablePieces.add(`${capture.fromRow}-${capture.fromCol}`);
    });
    
    capturablePieces.forEach(pieceKey => {
        const [row, col] = pieceKey.split('-').map(Number);
        if (!(selectedPiece && selectedPiece.row === row && selectedPiece.col === col)) {
            document.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('can-capture');
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
    document.querySelectorAll('.possible-move').forEach(cell => cell.classList.remove('possible-move'));
    document.querySelectorAll('.capture-move').forEach(cell => cell.classList.remove('capture-move'));
    document.querySelectorAll('.can-capture').forEach(cell => cell.classList.remove('can-capture'));
}

function isPossibleMove(row, col) {
    return possibleMoves.some(move => move.row === row && move.col === col);
}

function getPossibleMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const moves = [];
    
    // Check for captures first (they are mandatory if available)
    const captures = getCaptureMoves(row, col, piece);

    // If captures are available, return only captures (mandatory)
    if (captures.length > 0) {
        return captures;
    }

    // If no captures available and not continuing a multi-jump, allow normal moves
    if (!mustContinueWith) {
        const normalMoves = getNormalMoves(row, col, piece);
        moves.push(...normalMoves);
    }

    return moves;
}

function getCaptureMoves(row, col, piece) {
    const captures = [];
    
    if (piece.isKing) {
        // Flying king captures - can capture pieces at any distance
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([dRow, dCol]) => {
            for (let distance = 1; distance < 8; distance++) {
                const targetRow = row + dRow * distance;
                const targetCol = col + dCol * distance;
                
                // Stop if we go off the board
                if (targetRow < 0 || targetRow >= 8 || targetCol < 0 || targetCol >= 8) break;
                
                const targetPiece = board[targetRow][targetCol];
                
                if (targetPiece) {
                    // Found a piece - check if it's an enemy we can capture
                    if (targetPiece.color !== piece.color) {
                        // In International Draughts, king can land on any empty square beyond captured piece
                        for (let landDistance = distance + 1; landDistance < 8; landDistance++) {
                            const landRow = row + dRow * landDistance;
                            const landCol = col + dCol * landDistance;
                            
                            // Stop if we go off the board
                            if (landRow < 0 || landRow >= 8 || landCol < 0 || landCol >= 8) break;
                            
                            if (!board[landRow][landCol]) {
                                // Empty square - valid landing spot
                                captures.push({
                                    row: landRow,
                                    col: landCol,
                                    isCapture: true,
                                    capturedRow: targetRow,
                                    capturedCol: targetCol
                                });
                            } else {
                                // Another piece blocks further movement
                                break;
                            }
                        }
                    }
                    // Stop searching in this direction (hit a piece)
                    break;
                }
            }
        });
    } else {
        // Regular piece captures - can capture in ALL directions (forward and backward)
        // This is a key rule in International Draughts: men can capture backwards but only move forward
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
                    row: jumpRow, 
                    col: jumpCol, 
                    isCapture: true, 
                    capturedRow, 
                    capturedCol 
                });
            }
        });
    }
    
    return captures;
}

function getNormalMoves(row, col, piece) {
    const moves = [];
    
    if (piece.isKing) {
        // Flying king movement - can move any distance diagonally
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([dRow, dCol]) => {
            for (let distance = 1; distance < 8; distance++) {
                const newRow = row + dRow * distance;
                const newCol = col + dCol * distance;
                
                // Stop if we go off the board
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                
                if (!board[newRow][newCol]) {
                    // Empty square - valid move
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    // Piece blocks further movement
                    break;
                }
            }
        });
    } else {
        // Regular piece movement - only one square forward
        const moveDirections = piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
        
        moveDirections.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, isCapture: false });
            }
        });
    }
    
    return moves;
}

function getAllCaptures(playerColor) {
    const allCaptures = [];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === playerColor) {
                const captures = getPossibleMoves(row, col).filter(move => move.isCapture);
                captures.forEach(capture => {
                    allCaptures.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: capture.row,
                        toCol: capture.col
                    });
                });
            }
        }
    }
    
    return allCaptures;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
    
    // Move the piece
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    let wasCapture = false;
    
    // Handle capture
    if (move && move.isCapture) {
        board[move.capturedRow][move.capturedCol] = null;
        wasCapture = true;
    }
    
    // Check for king promotion
    let justBecameKing = false;
    if ((piece.color === 'red' && toRow === 7) || (piece.color === 'white' && toRow === 0)) {
        if (!piece.isKing) {
            piece.isKing = true;
            justBecameKing = true;
        }
    }
    
    clearHighlights();
    selectedPiece = null;
    
    // Check if this piece can capture again (multi-jump)
    // In International Draughts, newly crowned kings CAN continue jumping in the same turn
    if (wasCapture) {
        const additionalCaptures = getPossibleMoves(toRow, toCol).filter(m => m.isCapture);
        if (additionalCaptures.length > 0) {
            // Must continue with this piece
            mustContinueWith = { row: toRow, col: toCol };
            createBoard();
            selectPiece(toRow, toCol);
            updatePlayerDisplays(); // Update display to show "must continue jumping!"
            
            // Show message about continued jumping options
            if (additionalCaptures.length > 1) {
                const winnerMessage = document.getElementById('winner-message');
                winnerMessage.textContent = `Multi-jump continues! ${additionalCaptures.length} more capture options available.`;
                winnerMessage.classList.add('show');
                setTimeout(() => {
                    winnerMessage.classList.remove('show');
                }, 2000);
            }
            return; // Don't switch players yet
        } else {
            // Capture sequence completed
            const playerName = players[currentPlayer].name || currentPlayer;
            const winnerMessage = document.getElementById('winner-message');
            winnerMessage.textContent = `${playerName} completed capture sequence!`;
            winnerMessage.classList.add('show');
            setTimeout(() => {
                winnerMessage.classList.remove('show');
            }, 1500);
        }
    }
    
    // No more captures possible, end turn
    mustContinueWith = null;
    createBoard();
    
    // Show king promotion message
    if (justBecameKing) {
        const playerName = players[currentPlayer].name || currentPlayer;
        const winnerMessage = document.getElementById('winner-message');
        winnerMessage.textContent = `👑 ${playerName} got a KING! Kings can move in all directions!`;
        winnerMessage.classList.add('show');
        setTimeout(() => {
            winnerMessage.classList.remove('show');
        }, 3000);
    }
    
    // Check for win
    if (checkWin()) {
        const playerName = players[currentPlayer].name || currentPlayer;
        endGame(`🎉 ${playerName} wins!`);
        winner = currentPlayer;
        scores[currentPlayer]++;
        saveScores();
        updateScoreDisplay();
        showSMSButton();
    } else {
        switchPlayer();
        
        // If it's AI's turn, make AI move
        if (currentPlayer === 'white' && gameMode === 'ai' && gameActive) {
            setTimeout(() => makeAiMove(), 1000);
        }
    }
}

function checkWin() {
    const opponent = currentPlayer === 'red' ? 'white' : 'red';
    let opponentPieces = 0;
    let opponentHasMoves = false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] && board[row][col].color === opponent) {
                opponentPieces++;
                // Check if this piece has any legal moves
                const moves = getPossibleMovesForPiece(row, col, board[row][col]);
                if (moves.length > 0) {
                    opponentHasMoves = true;
                }
            }
        }
    }
    
    // Win if opponent has no pieces OR no legal moves
    return opponentPieces === 0 || !opponentHasMoves;
}

function getPossibleMovesForPiece(row, col, piece) {
    const moves = [];
    
    // Check for captures first (they are mandatory if available)
    const captures = getCaptureMoves(row, col, piece);

    // If captures are available, return only captures (mandatory)
    if (captures.length > 0) {
        return captures;
    }

    // If no captures available, allow normal moves
    const normalMoves = getNormalMoves(row, col, piece);
    moves.push(...normalMoves);

    return moves;
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'red' ? 'white' : 'red';
    updatePlayerDisplays();
    document.getElementById('current-player').style.color = currentPlayer === 'red' ? '#e74c3c' : '#3498db';
}

function endGame(message) {
    gameActive = false;
    isAiThinking = false;
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.textContent = message;
    winnerMessage.classList.add('show');
}

function resetGame() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    setupInitialBoard();
    currentPlayer = 'white';
    gameActive = true;
    winner = null;
    selectedPiece = null;
    mustContinueWith = null;
    possibleMoves = [];
    isAiThinking = false;
    
    clearHighlights();
    updatePlayerDisplays();
    document.getElementById('current-player').style.color = '#3498db';
    
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.classList.remove('show');
    
    document.getElementById('sms-btn').style.display = 'none';
    document.getElementById('email-btn').style.display = 'none';
    
    createBoard();
    
    // Re-enable board clicks
    document.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'auto';
    });
    
    // If AI goes first (white), make AI move
    if (currentPlayer === 'white' && gameMode === 'ai' && gameActive) {
        setTimeout(() => makeAiMove(), 1000);
    }
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('internationalDraughtsScores', JSON.stringify(scores));
}

// Load scores from localStorage
function loadScores() {
    const saved = localStorage.getItem('internationalDraughtsScores');
    if (saved) {
        scores = JSON.parse(saved);
        updateScoreDisplay();
    }
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('red-wins').textContent = scores.red;
    document.getElementById('white-wins').textContent = scores.white;
}

// Show SMS and Email buttons
function showSMSButton() {
    if (winner && players[winner].phone) {
        document.getElementById('sms-btn').style.display = 'inline-block';
    }
    if (winner && players[winner].email) {
        document.getElementById('email-btn').style.display = 'inline-block';
    }
}

// Send congratulations SMS
function sendCongratulations() {
    if (!winner || !players[winner].phone) {
        alert('No phone number available for the winner!');
        return;
    }

    const winnerName = players[winner].name;
    const winnerPhone = players[winner].phone;
    const message = `🎉 Congratulations ${winnerName}! You won the International Draughts game! Excellent strategy! 🏆`;
    
    const smsUrl = `sms:${winnerPhone}?body=${encodeURIComponent(message)}`;
    alert(`📱 Opening SMS app to send:\n\nTo: ${winnerPhone}\nMessage: ${message}`);
    window.open(smsUrl, '_blank');
}

// Send congratulations Email
function sendCongratulationsEmail() {
    if (!winner || !players[winner].email) {
        alert('No email address available for the winner!');
        return;
    }

    const winnerName = players[winner].name;
    const winnerEmail = players[winner].email;
    const subject = `🎉 Congratulations on Your International Draughts Victory!`;
    const body = `Dear ${winnerName},

🎉 Congratulations! You have won the International Draughts game! 🏆

Your strategic thinking and tactical skills with flying kings have led you to victory. Well played!

Best regards,
The International Draughts Game Team

P.S. Ready for another challenge? Try the 5 in a Row game next!`;
    
    const mailtoUrl = `mailto:${winnerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    alert(`📧 Opening email client to send:\n\nTo: ${winnerEmail}\nSubject: ${subject}\n\nEmail body will contain congratulations message.`);
    window.open(mailtoUrl, '_blank');
}

// Save players to localStorage
function savePlayers() {
    localStorage.setItem('internationalDraughtsPlayers', JSON.stringify(players));
}

// Load players from localStorage
function loadPlayers() {
    const saved = localStorage.getItem('internationalDraughtsPlayers');
    if (saved) {
        players = JSON.parse(saved);
        document.getElementById('player-red-name').value = players.red.name || '';
        document.getElementById('player-red-phone').value = players.red.phone || '';
        document.getElementById('player-red-email').value = players.red.email || '';
        document.getElementById('player-white-name').value = players.white.name || '';
        document.getElementById('player-white-phone').value = players.white.phone || '';
        document.getElementById('player-white-email').value = players.white.email || '';
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    
    // Initialize game mode buttons
    setGameMode('human');
    setAiDifficulty('medium');
});

// Make AI move with thinking delay
function makeAiMove() {
    if (!ai || isAiThinking || currentPlayer !== 'white' || gameMode !== 'ai') return;
    
    isAiThinking = true;
    updatePlayerDisplays();
    
    // Disable board clicks during AI thinking
    document.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
    
    // AI thinking delay for better UX
    const thinkingTime = aiDifficulty === 'easy' ? 500 : 
                        aiDifficulty === 'medium' ? 1000 : 1500;
    
    setTimeout(() => {
        const aiMove = ai.makeMove(board);
        
        if (aiMove && gameActive) {
            // Execute the AI move
            executeAiMove(aiMove);
        }
        
        isAiThinking = false;
        updatePlayerDisplays();
        
        // Re-enable board clicks
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'auto';
        });
    }, thinkingTime);
}

// Execute AI move
function executeAiMove(aiMove) {
    const piece = board[aiMove.fromRow][aiMove.fromCol];
    
    // Move the piece
    board[aiMove.toRow][aiMove.toCol] = piece;
    board[aiMove.fromRow][aiMove.fromCol] = null;
    
    let wasCapture = false;
    
    // Handle captures
    if (aiMove.capturedPieces && aiMove.capturedPieces.length > 0) {
        aiMove.capturedPieces.forEach(captured => {
            board[captured.row][captured.col] = null;
        });
        wasCapture = true;
    }
    
    // Check for king promotion
    let justBecameKing = false;
    if ((piece.color === 'red' && aiMove.toRow === 7) || (piece.color === 'white' && aiMove.toRow === 0)) {
        if (!piece.isKing) {
            piece.isKing = true;
            justBecameKing = true;
        }
    }
    
    clearHighlights();
    selectedPiece = null;
    
    // Check if this piece can capture again (multi-jump)
    if (wasCapture) {
        const additionalCaptures = getPossibleMoves(aiMove.toRow, aiMove.toCol).filter(m => m.isCapture);
        if (additionalCaptures.length > 0) {
            // Must continue with this piece
            mustContinueWith = { row: aiMove.toRow, col: aiMove.toCol };
            createBoard();
            updatePlayerDisplays();
            
            // AI continues jumping
            setTimeout(() => makeAiMove(), 1000);
            return; // Don't switch players yet
        } else {
            // Capture sequence completed
            const playerName = players[currentPlayer].name || currentPlayer;
            const winnerMessage = document.getElementById('winner-message');
            winnerMessage.textContent = `${playerName} completed capture sequence!`;
            winnerMessage.classList.add('show');
            setTimeout(() => {
                winnerMessage.classList.remove('show');
            }, 1500);
        }
    }
    
    // No more captures possible, end turn
    mustContinueWith = null;
    createBoard();
    
    // Show king promotion message
    if (justBecameKing) {
        const playerName = players[currentPlayer].name || currentPlayer;
        const winnerMessage = document.getElementById('winner-message');
        winnerMessage.textContent = `👑 ${playerName} got a KING! Kings can move in all directions!`;
        winnerMessage.classList.add('show');
        setTimeout(() => {
            winnerMessage.classList.remove('show');
        }, 3000);
    }
    
    // Check for win
    if (checkWin()) {
        const playerName = players[currentPlayer].name || currentPlayer;
        endGame(`🎉 ${playerName} wins!`);
        winner = currentPlayer;
        scores[currentPlayer]++;
        saveScores();
        updateScoreDisplay();
        showSMSButton();
    } else {
        switchPlayer();
    }
} 