// Game state variables
let board = [];
let currentPlayer = 'X';
let gameActive = true;
let gameStarted = false;
let scores = { X: 0, O: 0, draws: 0 };
let players = {
    X: { name: '', phone: '', email: '' },
    O: { name: '', phone: '', email: '' }
};
let winner = null;

// AI-related variables
let gameMode = 'human'; // 'human' or 'ai'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let ai = null;
let isAiThinking = false;

// Initialize the game
function initGame() {
    board = Array(15).fill().map(() => Array(15).fill(''));
    loadScores();
    loadPlayers();
}

// Set game mode
function setGameMode(mode) {
    gameMode = mode;
    const humanMode = document.getElementById('human-mode');
    const aiMode = document.getElementById('ai-mode');
    const aiSettings = document.getElementById('ai-settings');
    const playerOInputs = document.getElementById('player-o-inputs');
    
    if (mode === 'ai') {
        humanMode.classList.remove('selected');
        aiMode.classList.add('selected');
        aiSettings.style.display = 'block';
        playerOInputs.style.display = 'none';
        
        // Set AI player name
        players.O.name = `AI (${aiDifficulty})`;
        players.O.phone = '';
        players.O.email = '';
    } else {
        aiMode.classList.remove('selected');
        humanMode.classList.add('selected');
        aiSettings.style.display = 'none';
        playerOInputs.style.display = 'flex';
        
        // Reset to human player
        players.O.name = document.getElementById('player-o-name').value.trim();
        players.O.phone = document.getElementById('player-o-phone').value.trim();
        players.O.email = document.getElementById('player-o-email').value.trim();
    }
}

// Set AI difficulty
function setAiDifficulty(difficulty) {
    aiDifficulty = difficulty;
    players.O.name = `AI (${difficulty})`;
    
    // Update difficulty buttons
    document.querySelectorAll('.ai-difficulty').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById(`difficulty-${difficulty}`).classList.add('selected');
}

// Start game after player setup
function startGame() {
    const playerXName = document.getElementById('player-x-name').value.trim();
    
    if (!playerXName) {
        alert('Please enter a name for Player X!');
        return;
    }

    if (gameMode === 'human') {
        const playerOName = document.getElementById('player-o-name').value.trim();
        if (!playerOName) {
            alert('Please enter a name for Player O!');
            return;
        }
        
        players.X.name = playerXName;
        players.X.phone = document.getElementById('player-x-phone').value.trim();
        players.X.email = document.getElementById('player-x-email').value.trim();
        players.O.name = playerOName;
        players.O.phone = document.getElementById('player-o-phone').value.trim();
        players.O.email = document.getElementById('player-o-email').value.trim();
    } else {
        // AI mode
        players.X.name = playerXName;
        players.X.phone = document.getElementById('player-x-phone').value.trim();
        players.X.email = document.getElementById('player-x-email').value.trim();
        players.O.name = `AI (${aiDifficulty})`;
        players.O.phone = '';
        players.O.email = '';
        
        // Initialize AI
        ai = new FiveInARowAI(aiDifficulty);
    }

    savePlayers();
    updatePlayerDisplays();

    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('game-info').style.display = 'block';
    document.getElementById('game-area').style.display = 'block';

    gameStarted = true;
    createBoard();
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
    document.getElementById('player-x-display').textContent = players.X.name || 'X';
    document.getElementById('player-o-display').textContent = players.O.name || 'O';
    
    let currentPlayerName = players[currentPlayer].name || currentPlayer;
    
    if (isAiThinking && currentPlayer === 'O' && gameMode === 'ai') {
        currentPlayerName += ' (thinking...)';
    }
    
    document.getElementById('current-player').textContent = currentPlayerName;
}

// Create the visual board
function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => makeMove(row, col));
            gameBoard.appendChild(cell);
        }
    }
}

// Make a move
function makeMove(row, col) {
    if (!gameActive || !gameStarted || board[row][col] !== '' || isAiThinking) return;

    // Human move
    board[row][col] = currentPlayer;
    updateCell(row, col);

    if (checkWin(row, col)) {
        const playerName = players[currentPlayer].name || `Player ${currentPlayer}`;
        endGame(`🎉 ${playerName} wins!`);
        winner = currentPlayer;
        scores[currentPlayer]++;
        saveScores();
        updateScoreDisplay();
        showSMSButton();
        return;
    } 
    
    if (checkDraw()) {
        endGame("🤝 It's a draw!");
        winner = null;
        scores.draws++;
        saveScores();
        updateScoreDisplay();
        return;
    }

    switchPlayer();

    // If it's AI's turn, make AI move
    if (currentPlayer === 'O' && gameMode === 'ai' && gameActive) {
        makeAiMove();
    }
}

// Make AI move with thinking delay
function makeAiMove() {
    if (!ai || isAiThinking) return;
    
    isAiThinking = true;
    updatePlayerDisplays();
    
    // Disable board clicks during AI thinking
    document.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
    
    // Drastically reduced AI thinking delays - never more than 1 second
    const thinkingTime = aiDifficulty === 'easy' ? 100 : 
                        aiDifficulty === 'medium' ? 200 : 300;
    
    setTimeout(() => {
        const aiMove = ai.makeMove(board);
        
        if (aiMove && gameActive) {
            board[aiMove.row][aiMove.col] = currentPlayer;
            updateCell(aiMove.row, aiMove.col);
            
            if (checkWin(aiMove.row, aiMove.col)) {
                const playerName = players[currentPlayer].name || `Player ${currentPlayer}`;
                endGame(`🎉 ${playerName} wins!`);
                winner = currentPlayer;
                scores[currentPlayer]++;
                saveScores();
                updateScoreDisplay();
                showSMSButton();
            } else if (checkDraw()) {
                endGame("🤝 It's a draw!");
                winner = null;
                scores.draws++;
                saveScores();
                updateScoreDisplay();
            } else {
                switchPlayer();
            }
        }
        
        isAiThinking = false;
        updatePlayerDisplays();
        
        // Re-enable board clicks
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'auto';
        });
    }, thinkingTime);
}

// Update cell display
function updateCell(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.textContent = currentPlayer;
    cell.className = `cell ${currentPlayer.toLowerCase()} taken`;
}

// Check for win
function checkWin(row, col) {
    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal \
        [1, -1]   // diagonal /
    ];

    for (let [deltaRow, deltaCol] of directions) {
        let count = 1;
        let winningCells = [[row, col]];

        // Check positive direction
        let r = row + deltaRow;
        let c = col + deltaCol;
        while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === currentPlayer) {
            winningCells.push([r, c]);
            count++;
            r += deltaRow;
            c += deltaCol;
        }

        // Check negative direction
        r = row - deltaRow;
        c = col - deltaCol;
        while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === currentPlayer) {
            winningCells.unshift([r, c]);
            count++;
            r -= deltaRow;
            c -= deltaCol;
        }

        if (count >= 5) {
            highlightWinningCells(winningCells);
            return true;
        }
    }
    return false;
}

// Highlight winning cells
function highlightWinningCells(cells) {
    cells.forEach(([row, col]) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('winning');
    });
}

// Check for draw
function checkDraw() {
    return board.every(row => row.every(cell => cell !== ''));
}

// Switch player
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updatePlayerDisplays();
    const playerElement = document.getElementById('current-player');
    playerElement.className = `current-player ${currentPlayer.toLowerCase()}`;
}

// End game
function endGame(message) {
    gameActive = false;
    isAiThinking = false;
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.textContent = message;
    winnerMessage.classList.add('show');
}

// Reset game
function resetGame() {
    board = Array(15).fill().map(() => Array(15).fill(''));
    currentPlayer = 'X';
    gameActive = true;
    winner = null;
    isAiThinking = false;
    
    updatePlayerDisplays();
    const playerElement = document.getElementById('current-player');
    playerElement.className = 'current-player';
    
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.classList.remove('show');
    
    document.getElementById('sms-btn').style.display = 'none';
    document.getElementById('email-btn').style.display = 'none';
    
    createBoard();
    
    // Re-enable board clicks
    document.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'auto';
    });
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('fiveInARowScores', JSON.stringify(scores));
}

// Load scores from localStorage
function loadScores() {
    const saved = localStorage.getItem('fiveInARowScores');
    if (saved) {
        scores = JSON.parse(saved);
        updateScoreDisplay();
    }
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('x-wins').textContent = scores.X;
    document.getElementById('o-wins').textContent = scores.O;
    document.getElementById('draws').textContent = scores.draws;
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
    const message = `🎉 Congratulations ${winnerName}! You won the 5 in a Row game! Great job! 🏆`;
    
    // Create SMS URL (opens default SMS app)
    const smsUrl = `sms:${winnerPhone}?body=${encodeURIComponent(message)}`;
    
    // Show the message that would be sent
    alert(`📱 Opening SMS app to send:\n\nTo: ${winnerPhone}\nMessage: ${message}`);
    
    // Open SMS app (works on mobile devices)
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
    const subject = `🎉 Congratulations on Your 5 in a Row Victory!`;
    const body = `Dear ${winnerName},

🎉 Congratulations! You have won the 5 in a Row game! 🏆

Your strategic thinking and skill have paid off. Well played!

Best regards,
The 5 in a Row Game Team

P.S. Ready for another round? Challenge your opponent to a rematch!`;
    
    // Create mailto URL (opens default email client)
    const mailtoUrl = `mailto:${winnerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Show the message that would be sent
    alert(`📧 Opening email client to send:\n\nTo: ${winnerEmail}\nSubject: ${subject}\n\nEmail body will contain congratulations message.`);
    
    // Open email client
    window.open(mailtoUrl, '_blank');
}

// Save players to localStorage
function savePlayers() {
    localStorage.setItem('fiveInARowPlayers', JSON.stringify(players));
}

// Load players from localStorage
function loadPlayers() {
    const saved = localStorage.getItem('fiveInARowPlayers');
    if (saved) {
        players = JSON.parse(saved);
        document.getElementById('player-x-name').value = players.X.name || '';
        document.getElementById('player-x-phone').value = players.X.phone || '';
        document.getElementById('player-x-email').value = players.X.email || '';
        document.getElementById('player-o-name').value = players.O.name || '';
        document.getElementById('player-o-phone').value = players.O.phone || '';
        document.getElementById('player-o-email').value = players.O.email || '';
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    
    // Initialize game mode buttons
    setGameMode('human');
    setAiDifficulty('medium');
}); 