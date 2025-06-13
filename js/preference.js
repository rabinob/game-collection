// Preference Game JS

const SUIT_ORDER = ['♠', '♥', '♦', '♣'];
const RANK_ORDER = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];

function createDeck() {
    // 32-card deck: 7,8,9,10,J,Q,K,A in each suit
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function deal(deck) {
    // Preference: 3 hands of 10, 2 cards to talon (kitty)
    return {
        hands: [deck.slice(0, 10), deck.slice(10, 20), deck.slice(20, 30)],
        talon: deck.slice(30, 32)
    };
}

function sortCards(cards) {
    return cards.slice().sort((a, b) => {
        const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
        if (suitDiff !== 0) return suitDiff;
        return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
    });
}

function renderHand(hand) {
    const sorted = sortCards(hand);
    return sorted.map(card => `<span class="card" data-suit="${card.suit}">${card.rank}${card.suit}</span>`).join(' ');
}

function renderBidding(players, currentBidder, bids, isHuman) {
    let html = '<h3>Bidding Phase</h3>';
    html += '<ul>';
    players.forEach((p, i) => {
        html += `<li><strong>${p.name}:</strong> ${bids[i] !== undefined ? bids[i] : ''}</li>`;
    });
    html += '</ul>';
    html += `<p>Current bidder: <strong>${players[currentBidder].name}</strong></p>`;
    if (isHuman) {
        html += `
            <button id="bid-btn">Bid</button>
            <button id="pass-btn">Pass</button>
        `;
    } else {
        html += `<p>AI is thinking...</p>`;
    }
    return html;
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('player-form');
    const gameArea = document.getElementById('game-area');
    let players = [];
    // Try to load players from localStorage if available
    try {
        const stored = JSON.parse(localStorage.getItem('preferencePlayers'));
        if (Array.isArray(stored) && stored.length === 3) players = stored;
    } catch (e) {}
    let hands = [];
    let talon = [];
    let bids = [undefined, undefined, undefined];
    let currentBidder = 0;
    let passed = [false, false, false];
    let bidValue = 0;
    let bidOrder = [0, 1, 2];
    let contract = 0;

    // Persistent scores (moved inside to access players)
    function getScores() {
        let scores = JSON.parse(localStorage.getItem('preferenceScores') || '[0,0,0]');
        if (!Array.isArray(scores) || scores.length !== 3) scores = [0,0,0];
        return scores;
    }
    function setScores(scores) {
        localStorage.setItem('preferenceScores', JSON.stringify(scores));
    }
    function resetScores() {
        setScores([0,0,0]);
        renderScores();
    }
    function renderScores() {
        const scoresArea = document.getElementById('scores-area');
        if (!Array.isArray(players) || players.length !== 3 || !players.every(p => p && p.name)) {
            if (scoresArea) {
                scoresArea.style.display = 'none';
                scoresArea.innerHTML = '';
            }
            return;
        }
        const scores = getScores();
        let html = '<div class="cumulative-scores"><strong>Cumulative Scores:</strong> ' + players.map((p, i) => `${p.name}: ${scores[i]}`).join(' | ') + '</div>';
        html += '<button id="reset-scores-btn">Reset Scores</button>';
        if (scoresArea) {
            scoresArea.innerHTML = html;
            scoresArea.style.display = 'block';
        } else {
            const div = document.createElement('div');
            div.id = 'scores-area';
            div.innerHTML = html;
            div.style.display = 'block';
            gameArea.parentNode.insertBefore(div, gameArea);
        }
        document.getElementById('reset-scores-btn').onclick = resetScores;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Only one real player, two AI
        players = [
            {
                name: document.getElementById('player1-name').value,
                phone: document.getElementById('player1-phone').value,
                email: document.getElementById('player1-email').value,
                isAI: false
            },
            { name: 'Alex (AI)', isAI: true },
            { name: 'Sam (AI)', isAI: true }
        ];
        localStorage.setItem('preferencePlayers', JSON.stringify(players));
        form.style.display = 'none';
        startGame();
    });

    function startGame() {
        // Always reload players from localStorage if not valid
        if (!Array.isArray(players) || players.length !== 3 || !players.every(p => p && p.name)) {
            try {
                const stored = JSON.parse(localStorage.getItem('preferencePlayers'));
                if (Array.isArray(stored) && stored.length === 3) players = stored;
            } catch (e) {}
        }
        // Deck, shuffle, deal
        let deck = shuffle(createDeck());
        const dealResult = deal(deck);
        hands = dealResult.hands;
        talon = dealResult.talon;
        bids = [undefined, undefined, undefined];
        passed = [false, false, false];
        bidValue = 0;
        currentBidder = 0;
        bidOrder = [0, 1, 2];
        if (Array.isArray(players) && players.length === 3 && players.every(p => p && p.name)) {
            renderScores();
        }
        gameArea.style.display = 'block';
        renderGame();
    }

    function renderGame() {
        let html = '<div class="hands">';
        players.forEach((p, i) => {
            html += `<div><strong>${p.name}:</strong> ${renderHand(hands[i])}</div>`;
        });
        html += `</div><div class="talon"><strong>Talon:</strong> ${renderHand(talon)}</div>`;
        const isHuman = !players[currentBidder].isAI && !passed[currentBidder];
        html += `<div id="bidding-area">${renderBidding(players, currentBidder, bids, isHuman)}</div>`;
        gameArea.innerHTML = html;
        if (isHuman) {
            attachBiddingHandlers();
        } else {
            setTimeout(aiBid, 1000);
        }
    }

    function attachBiddingHandlers() {
        document.getElementById('bid-btn').onclick = function() {
            bidValue++;
            bids[currentBidder] = bidValue;
            nextBidder();
        };
        document.getElementById('pass-btn').onclick = function() {
            passed[currentBidder] = true;
            bids[currentBidder] = 'Pass';
            nextBidder();
        };
    }

    function aiBid() {
        // Simple AI: random pass or bid (if bidValue < 2, always bid)
        if (passed[currentBidder]) {
            nextBidder();
            return;
        }
        let aiDecision;
        if (bidValue < 2) {
            aiDecision = 'bid';
        } else {
            aiDecision = Math.random() < 0.5 ? 'bid' : 'pass';
        }
        if (aiDecision === 'bid') {
            bidValue++;
            bids[currentBidder] = bidValue;
        } else {
            passed[currentBidder] = true;
            bids[currentBidder] = 'Pass';
        }
        nextBidder();
    }

    function nextBidder() {
        // Find next player who hasn't passed
        let next = currentBidder;
        let found = false;
        for (let i = 1; i <= 3; i++) {
            let idx = (currentBidder + i) % 3;
            if (!passed[idx]) {
                next = idx;
                found = true;
                break;
            }
        }
        // If only one left, bidding ends
        if (passed.filter(p => !p).length === 1) {
            endBidding();
        } else {
            currentBidder = next;
            renderGame();
        }
    }

    function endBidding() {
        // Find winner
        let winner = bids.findIndex(b => b !== 'Pass');
        contract = bids[winner];
        let html = '<h3>Bidding Complete</h3>';
        html += `<p>Winner: <strong>${players[winner].name}</strong> with bid: <strong>${bids[winner]}</strong></p>`;
        html += `<p>${players[winner].name} takes the talon and becomes declarer.</p>`;
        if (!players[winner].isAI) {
            // Real player discards
            hands[winner] = hands[winner].concat(talon);
            html += '<div class="discard-section"><h4>Select 2 cards to discard:</h4>';
            html += renderDiscardHand(hands[winner]);
            html += '<div><button id="confirm-discard-btn" disabled>Confirm Discards</button></div></div>';
            gameArea.innerHTML = html;
            setupDiscardUI(winner);
        } else {
            // AI discards 2 random cards
            hands[winner] = hands[winner].concat(talon);
            for (let i = 0; i < 2; i++) {
                hands[winner].splice(Math.floor(Math.random() * hands[winner].length), 1);
            }
            html += '<button id="start-play-btn">Start Trick-Taking Phase</button>';
            gameArea.innerHTML = html;
            document.getElementById('start-play-btn').onclick = function() {
                startPlay(winner);
            };
        }
    }

    function renderDiscardHand(hand, selectedIdxs = []) {
        const sorted = sortCards(hand).map(card => ({
            card,
            origIdx: hand.indexOf(card)
        }));
        return '<div class="discard-hand">' + sorted.map(({card, origIdx}) => {
            const isSelected = selectedIdxs.includes(origIdx);
            return `<span class="card${isSelected ? ' selected' : ''}" data-idx="${origIdx}" data-suit="${card.suit}" style="cursor:pointer;">${card.rank}${card.suit}</span>`;
        }).join(' ') + '</div>';
    }

    function setupDiscardUI(winnerIdx) {
        let selected = [];
        function updateUI() {
            const sorted = sortCards(hands[winnerIdx]).map(card => ({
                card,
                origIdx: hands[winnerIdx].indexOf(card)
            }));
            document.querySelector('.discard-hand').innerHTML = sorted.map(({card, origIdx}) => {
                const isSelected = selected.includes(origIdx);
                return `<span class="card${isSelected ? ' selected' : ''}" data-idx="${origIdx}" data-suit="${card.suit}" style="cursor:pointer;">${card.rank}${card.suit}</span>`;
            }).join(' ');
            document.getElementById('confirm-discard-btn').disabled = (selected.length !== 2);
            document.querySelectorAll('.discard-hand .card').forEach(el => {
                el.onclick = function() {
                    const idx = parseInt(el.getAttribute('data-idx'));
                    if (selected.includes(idx)) {
                        selected = selected.filter(i => i !== idx);
                    } else if (selected.length < 2) {
                        selected.push(idx);
                    }
                    updateUI();
                };
            });
        }
        updateUI();
        document.getElementById('confirm-discard-btn').onclick = function() {
            // Remove selected cards by index, highest first
            selected.sort((a,b) => b-a).forEach(idx => hands[winnerIdx].splice(idx, 1));
            startPlay(winnerIdx);
        };
    }

    // --- Trick-taking phase ---
    let declarer = 0;
    let tricks = [0, 0, 0];
    let trick = [];
    let leader = 0;
    let currentPlayer = 0;
    let playedCards = [[], [], []];
    let handSize = 10;

    function startPlay(winner) {
        declarer = winner;
        // Declarer takes talon (for now, just adds to hand, then discards 2 at random)
        hands[declarer] = hands[declarer].concat(talon);
        // Discard 2 at random (for simplicity)
        for (let i = 0; i < 2; i++) {
            hands[declarer].splice(Math.floor(Math.random() * hands[declarer].length), 1);
        }
        tricks = [0, 0, 0];
        playedCards = [[], [], []];
        trick = [];
        leader = declarer;
        currentPlayer = leader;
        handSize = hands[0].length;
        renderTrick();
    }

    function renderTrick() {
        let html = '<div class="playing-surface">';
        html += '<div class="hands-area">';
        players.forEach((p, i) => {
            html += `<div class="player-hand"><strong>${p.name}:</strong> ${renderHand(hands[i])}</div>`;
        });
        html += '</div>';
        html += '<div class="trick-area">';
        html += `<div class="trick-status"><strong>Trick:</strong> ${trick.map(x => x ? `${players[x.player].name}: <span class='card' data-suit='${x.card.suit}'>${x.card.rank}${x.card.suit}</span>` : '').join(' | ')}</div>`;
        html += '</div>';
        if (trick.length === 3) {
            // Determine winner for display
            let suit = trick[0].card.suit;
            let best = trick[0];
            for (let i = 1; i < 3; i++) {
                if (trick[i].card.suit === suit) {
                    if (rankValue(trick[i].card.rank) > rankValue(best.card.rank)) {
                        best = trick[i];
                    }
                }
            }
            html += `<div class=\"trick-leader\"><strong>Trick winner:</strong> ${players[best.player].name}</div>`;
            html += '<button id="next-trick-btn" class="next-trick-btn">Next Trick</button>';
        } else {
            html += `<div class=\"trick-leader\">Current turn: <strong>${players[currentPlayer].name}</strong></div>`;
        }
        html += `<div class="tricks-won">Tricks won: ${players.map((p, i) => `${p.name}: ${tricks[i]}`).join(' | ')}</div>`;
        html += '</div>';
        gameArea.innerHTML = html;
        if (trick.length === 3) {
            document.getElementById('next-trick-btn').onclick = function() {
                dismissTrick();
            };
        } else if (!players[currentPlayer].isAI) {
            renderPlayableHand(currentPlayer);
        } else {
            setTimeout(() => aiPlay(currentPlayer), 1000);
        }
    }

    function renderPlayableHand(playerIdx) {
        let suitToFollow = trick.length > 0 ? trick[0].card.suit : null;
        let legalCards = hands[playerIdx].filter(card => {
            if (!suitToFollow) return true;
            if (card.suit === suitToFollow) return true;
            return !hands[playerIdx].some(c => c.suit === suitToFollow);
        });
        let sorted = sortCards(hands[playerIdx]);
        let html = '<div class="playable-hand">';
        sorted.forEach((card, idx) => {
            const origIdx = hands[playerIdx].indexOf(card);
            const isLegal = legalCards.includes(card);
            html += `<span class="card${isLegal ? ' playable' : ' disabled'}" data-suit="${card.suit}" data-idx="${origIdx}" style="cursor:${isLegal ? 'pointer' : 'not-allowed'};opacity:${isLegal ? 1 : 0.4}">${card.rank}${card.suit}</span> `;
        });
        html += '</div>';
        gameArea.innerHTML += html;
        document.querySelectorAll('.card.playable').forEach(el => {
            el.onclick = function() {
                playCard(playerIdx, parseInt(el.getAttribute('data-idx')));
            };
        });
    }

    function aiPlay(playerIdx) {
        // Follow suit if possible, else random
        let suitToFollow = trick.length > 0 ? trick[0].card.suit : null;
        let legalCards = hands[playerIdx].filter(card => {
            if (!suitToFollow) return true;
            if (card.suit === suitToFollow) return true;
            return !hands[playerIdx].some(c => c.suit === suitToFollow);
        });
        let cardIdx = hands[playerIdx].indexOf(legalCards[Math.floor(Math.random() * legalCards.length)]);
        playCard(playerIdx, cardIdx);
    }

    function playCard(playerIdx, cardIdx) {
        const card = hands[playerIdx][cardIdx];
        trick.push({ player: playerIdx, card });
        playedCards[playerIdx].push(card);
        hands[playerIdx].splice(cardIdx, 1);
        if (trick.length === 3) {
            renderTrick();
        } else {
            currentPlayer = (currentPlayer + 1) % 3;
            renderTrick();
        }
    }

    function dismissTrick() {
        // Determine winner of the trick
        let suit = trick[0].card.suit;
        let best = trick[0];
        for (let i = 1; i < 3; i++) {
            if (trick[i].card.suit === suit) {
                // Compare rank
                if (rankValue(trick[i].card.rank) > rankValue(best.card.rank)) {
                    best = trick[i];
                }
            }
        }
        tricks[best.player]++;
        leader = best.player;
        trick = [];
        if (hands[0].length === 0) {
            endPlay();
        } else {
            currentPlayer = leader;
            renderTrick();
        }
    }

    function rankValue(rank) {
        // 7=0, 8=1, 9=2, 10=3, J=4, Q=5, K=6, A=7
        return ['7','8','9','10','J','Q','K','A'].indexOf(rank);
    }

    function endPlay() {
        let html = '<h3>Hand Complete!</h3>';
        html += `<div class="tricks-won">Tricks won: ${players.map((p, i) => `${p.name}: ${tricks[i]}`).join(' | ')}</div>`;
        // Scoring: declarer must win at least contract tricks
        let declarerTricks = tricks[declarer];
        if (declarerTricks >= contract) {
            html += `<div class="result success"><strong>${players[declarer].name} (Declarer) succeeded!</strong> (${declarerTricks} tricks, contract was ${contract})</div>`;
        } else {
            html += `<div class="result fail"><strong>${players[declarer].name} (Declarer) failed.</strong> (${declarerTricks} tricks, contract was ${contract})</div>`;
        }
        html += '<button id="new-game-btn">Play Again</button>';
        gameArea.innerHTML = html;
        document.getElementById('new-game-btn').onclick = function() {
            startGame();
        };
    }
}); 