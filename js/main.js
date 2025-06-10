// Load and display statistics
function loadStats() {
    const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
    
    // Calculate total games
    const totalGames = (stats.totalGames || 0);
    document.getElementById('total-games').textContent = totalGames;
    
    // Show favorite game
    const favoriteGame = stats.favoriteGame || '-';
    document.getElementById('favorite-game').textContent = favoriteGame;
    
    // Show last played
    const lastPlayed = stats.lastPlayed || 'Never';
    document.getElementById('last-played').textContent = lastPlayed;
}

// Track game clicks
function trackGameClick(gameName) {
    const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
    
    // Update total games
    stats.totalGames = (stats.totalGames || 0) + 1;
    
    // Update game counts
    stats.gameCounts = stats.gameCounts || {};
    stats.gameCounts[gameName] = (stats.gameCounts[gameName] || 0) + 1;
    
    // Find favorite game
    let favoriteGame = '';
    let maxCount = 0;
    for (const [game, count] of Object.entries(stats.gameCounts)) {
        if (count > maxCount) {
            maxCount = count;
            favoriteGame = game;
        }
    }
    stats.favoriteGame = favoriteGame;
    
    // Update last played
    stats.lastPlayed = new Date().toLocaleDateString();
    
    // Save stats
    localStorage.setItem('gameStats', JSON.stringify(stats));
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
}); 