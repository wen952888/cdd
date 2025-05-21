<?php
// backend/includes/game_logic.php

// --- Card Definitions ---
const SUITS = ['D', 'C', 'H', 'S']; // Diamonds, Clubs, Hearts, Spades (Big Two order of suit for tie-breaking)
const RANKS_DISPLAY = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2']; // T for Ten
const RANKS_VALUE_ORDER = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2']; // For comparison

function getCardValue($rank) {
    return array_search($rank, RANKS_VALUE_ORDER);
}

function getSuitValue($suit) {
    return array_search($suit, SUITS);
}

// Card string format: RankSuit e.g., "2H" (Two of Hearts), "AS" (Ace of Spades)
function createDeck() {
    $deck = [];
    foreach (SUITS as $suit) {
        foreach (RANKS_DISPLAY as $rank) {
            $deck[] = ['id' => $rank . $suit, 'rank' => $rank, 'suit' => $suit];
        }
    }
    return $deck;
}

function shuffleDeck(&$deck) {
    shuffle($deck);
}

function dealCards($players, $deck) {
    $playerHands = [];
    foreach ($players as $playerId => $player) {
        $playerHands[$playerId] = [];
    }
    $playerIds = array_keys($players);
    $numPlayers = count($playerIds);

    for ($i = 0; $i < CARDS_PER_PLAYER * $numPlayers; $i++) {
        if (empty($deck)) break; // Should not happen with 52 cards and 4 players
        $card = array_pop($deck);
        $playerHands[$playerIds[$i % $numPlayers]][] = $card;
    }
    return $playerHands;
}

// Sorts a hand of cards by Big Two rules (Rank then Suit)
function sortHand(&$hand) {
    usort($hand, function ($a, $b) {
        $rankComparison = getCardValue($a['rank']) - getCardValue($b['rank']);
        if ($rankComparison == 0) {
            return getSuitValue($a['suit']) - getSuitValue($b['suit']);
        }
        return $rankComparison;
    });
}


// --- Simplified Game Play Validation ---
// THIS IS HIGHLY SIMPLIFIED. Real Big Two logic is much more complex.
function isValidPlay($playedCards, $playerHand, $lastPlayedHandInfo) {
    if (empty($playedCards)) return ['valid' => false, 'message' => 'No cards selected to play.'];

    // 1. Check if player actually has these cards
    $playerCardIds = array_map(function($card){ return $card['id']; }, $playerHand);
    foreach ($playedCards as $cardId) {
        if (!in_array($cardId, $playerCardIds)) {
            return ['valid' => false, 'message' => "Invalid card played: You don't own {$cardId}."];
        }
    }

    // Convert played card IDs to card objects from hand for easier processing
    $playedCardObjects = [];
    foreach($playedCards as $playedCardId){
        foreach($playerHand as $cardInHand){
            if($cardInHand['id'] === $playedCardId){
                $playedCardObjects[] = $cardInHand;
                break;
            }
        }
    }
    sortHand($playedCardObjects); // Sort the played cards for consistency

    // TODO: Implement actual Big Two card type detection (single, pair, straight, flush, etc.)
    // TODO: Implement actual comparison logic against $lastPlayedHandInfo
    // For this demo, we'll do a very naive check:
    // - If table is empty (lastPlayedHandInfo is null or empty), any valid set of cards is okay (e.g. 1, 2, 3, 5 cards)
    // - If table has cards, played hand must be "better" (not implemented here beyond count) and same number of cards
    
    $numPlayed = count($playedCardObjects);
    $allowedCounts = [1, 2, 3, 5]; // Singles, Pairs, Triples, Five-card hands
    if (!in_array($numPlayed, $allowedCounts)) {
         return ['valid' => false, 'message' => "Invalid number of cards. Play 1, 2, 3, or 5 cards."];
    }


    if ($lastPlayedHandInfo && !empty($lastPlayedHandInfo['cards'])) {
        $numLastPlayed = count($lastPlayedHandInfo['cards']);
        if ($numPlayed !== $numLastPlayed) {
            return ['valid' => false, 'message' => "You must play the same number of cards as the last hand ({$numLastPlayed})."];
        }
        // SUPER SIMPLIFIED "BETTER" CHECK: just check the highest card of the played set vs highest of last set
        $highestPlayedCard = end($playedCardObjects); // Assumes sorted
        $highestLastCard = end($lastPlayedHandInfo['cards']); // Assumes sorted

        $playedVal = getCardValue($highestPlayedCard['rank']) * 10 + getSuitValue($highestPlayedCard['suit']);
        $lastVal = getCardValue($highestLastCard['rank']) * 10 + getSuitValue($highestLastCard['suit']);

        if ($playedVal <= $lastVal) {
            return ['valid' => false, 'message' => "Your hand must be higher than the cards on table."];
        }
    } else {
        // First play of a round, or after everyone passed.
        // In real Big Two, the 3 of Diamonds must be played if it's the very first play of the game.
        // This simplified version doesn't enforce that.
    }

    // If all checks pass (highly simplified)
    return ['valid' => true, 'message' => 'Play seems valid.', 'playedCardObjects' => $playedCardObjects];
}

function determineWinner($gameState) {
    foreach ($gameState['players'] as $playerId => $player) {
        if (empty($player['hand'])) {
            return $playerId;
        }
    }
    return null;
}

function getNextPlayerIndex($currentIndex, $numPlayers) {
    return ($currentIndex + 1) % $numPlayers;
}

// Helper to get player details for the client (excluding sensitive info like other's hands)
function getClientVisibleGameState($gameId, $gameState, $requestingPlayerId) {
    $clientState = [
        'gameId' => $gameId,
        'status' => $gameState['status'],
        'currentPlayerId' => $gameState['turnOrder'][$gameState['currentPlayerIndex']] ?? null,
        'currentPlayerName' => null,
        'playerHand' => [],
        'otherPlayers' => [],
        'lastPlayedCardsInfo' => $gameState['lastPlayedCardsInfo'] ?? null, // Contains 'playerId' and 'cards'
        'playersCount' => count($gameState['players']),
        'winnerId' => $gameState['winnerId'] ?? null,
        'winnerName' => null,
        'message' => $gameState['lastActionMessage'] ?? null,
    ];

    if ($clientState['currentPlayerId'] && isset($gameState['players'][$clientState['currentPlayerId']])) {
        $clientState['currentPlayerName'] = $gameState['players'][$clientState['currentPlayerId']]['name'];
    }
    
    if ($clientState['winnerId'] && isset($gameState['players'][$clientState['winnerId']])) {
        $clientState['winnerName'] = $gameState['players'][$clientState['winnerId']]['name'];
    }

    foreach ($gameState['players'] as $pid => $player) {
        if ($pid === $requestingPlayerId) {
            $clientState['playerHand'] = $player['hand'];
        } else {
            $clientState['otherPlayers'][] = [
                'id' => $pid,
                'name' => $player['name'],
                'cardCount' => count($player['hand']),
                'isCurrent' => ($pid === $clientState['currentPlayerId'])
            ];
        }
    }
    return $clientState;
}
