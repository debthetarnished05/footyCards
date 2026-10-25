import type{
  GameCard,
  GameRoomState,
  PlayerState,
  RoundShowdown,
  RoundSubmission,
  OutfieldStat,
  AnyBattleStat,
} from '../types/index.js';

export class GameEngine {
  private state: GameRoomState;
  private readonly TOTAL_ROUNDS = 11;

  constructor(
    roomId: string,
    initialPlayers: { id: string; name: string; isHost: boolean; isCpu: boolean }[],
    deck: GameCard[]
  ) {
    if (deck.length < initialPlayers.length * this.TOTAL_ROUNDS) {
      throw new Error('Not enough cards in deck to deal 11 cards to all players.');
    }

    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
    const players: Record<string, PlayerState> = {};
    const turnOrder = initialPlayers.map((p) => p.id);

    initialPlayers.forEach((player, index) => {
      const startIndex = index * this.TOTAL_ROUNDS;
      const hand = shuffledDeck.slice(startIndex, startIndex + this.TOTAL_ROUNDS);

      players[player.id] = {
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        isCpu: player.isCpu,
        score: 0,
        hand,
        hasSubmitted: false,
        connected: true,
      };
    });

    this.state = {
      roomId,
      phase: 'CALLER_SELECTION',
      currentRound: 1,
      maxPlayers: initialPlayers.length,
      callerId: turnOrder[0],
      selectedCategory: null,
      players,
      turnOrder,
      submissions: {},
      history: [],
    };
  }

  public getState(): GameRoomState {
    return this.state;
  }

  public getClientView(forPlayerId: string) {
    const isShowdown = this.state.phase === 'SHOWDOWN' || this.state.phase === 'GAME_OVER';

    const sanitizedPlayers = Object.entries(this.state.players).reduce(
      (acc, [id, player]) => {
        acc[id] = {
          ...player,
          hand: id === forPlayerId ? player.hand : new Array(player.hand.length).fill(null),
        };
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      ...this.state,
      players: sanitizedPlayers,
      submissions: isShowdown
        ? this.state.submissions
        : Object.keys(this.state.submissions).reduce((acc, pid) => {
            acc[pid] = pid === forPlayerId ? this.state.submissions[pid] : true;
            return acc;
          }, {} as Record<string, any>),
    };
  }

  // Caller plays card and sets the outfield category (or rating)
  public callerSelect(callerId: string, cardId: string, category: OutfieldStat): boolean {
    if (this.state.phase !== 'CALLER_SELECTION' || this.state.callerId !== callerId) {
      return false;
    }

    const player = this.state.players[callerId];
    if (!player) return false;

    const cardIndex = player.hand.findIndex((c) => c.cardId === cardId);
    if (cardIndex === -1) return false;

    const removedCards = player.hand.splice(cardIndex, 1);
    const card = removedCards[0];
    if (!card) return false;

    const effectiveValue = card.stats[category] ?? 0;

    this.state.submissions[callerId] = { card, statUsed: category, effectiveValue };
    player.hasSubmitted = true;
    this.state.selectedCategory = category;
    this.state.phase = 'OPPONENT_RESPONSES';

    return true;
  }

  // Opponents respond: If GK, they can specify `chosenGkStat`. Otherwise uses the called category.
  public playerSubmit(playerId: string, cardId: string, chosenGkStat?: AnyBattleStat): boolean {
    if (this.state.phase !== 'OPPONENT_RESPONSES' || playerId === this.state.callerId) {
      return false;
    }

    const player = this.state.players[playerId];
    if (!player || player.hasSubmitted || !this.state.selectedCategory) return false;

    const cardIndex = player.hand.findIndex((c) => c.cardId === cardId);
    if (cardIndex === -1) return false;

    const removedCards = player.hand.splice(cardIndex, 1);
    const card = removedCards[0];
    if (!card) return false;

    let statUsed: AnyBattleStat;
    let effectiveValue = 0;

    if (card.position === 'GK') {
      statUsed = chosenGkStat || 'rating';
      effectiveValue = card.stats[statUsed] ?? 0;
    } else {
      statUsed = this.state.selectedCategory;
      effectiveValue = card.stats[this.state.selectedCategory] ?? 0;
    }

    this.state.submissions[playerId] = { card, statUsed, effectiveValue };
    player.hasSubmitted = true;

    return true;
  }

  public allPlayersSubmitted(): boolean {
    return Object.values(this.state.players).every((p) => p.hasSubmitted);
  }

  // CPU bot logic supporting GK trump card decisions
  public executeCpuTurns(): void {
    const category = this.state.selectedCategory;

    for (const player of Object.values(this.state.players)) {
      if (!player.isCpu || player.hasSubmitted) continue;

      if (this.state.phase === 'CALLER_SELECTION' && this.state.callerId === player.id) {
        // CPU as Caller
        const card = player.hand[0];
        const validOutfieldStats: OutfieldStat[] = ['rating', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
        let bestStat: OutfieldStat = 'rating';
        let max = -1;

        for (const stat of validOutfieldStats) {
          if ((card.stats[stat] ?? -1) > max) {
            max = card.stats[stat];
            bestStat = stat;
          }
        }
        this.callerSelect(player.id, card.cardId, bestStat);
      } else if (this.state.phase === 'OPPONENT_RESPONSES' && category) {
        // CPU as Responder: checks if it has a GK to trump with
        let bestCard = player.hand[0];
        let bestStatUsed: AnyBattleStat = category;
        let highestFound = -1;

        for (const card of player.hand) {
          if (card.position === 'GK') {
            // Find GK's highest stat
            for (const [sKey, sVal] of Object.entries(card.stats)) {
              if (sVal > highestFound) {
                highestFound = sVal;
                bestCard = card;
                bestStatUsed = sKey as AnyBattleStat;
              }
            }
          } else {
            const val = card.stats[category] ?? 0;
            if (val > highestFound) {
              highestFound = val;
              bestCard = card;
              bestStatUsed = category;
            }
          }
        }
        this.playerSubmit(player.id, bestCard.cardId, bestStatUsed);
      }
    }
  }

  // Round resolution according to your scoring rules
  public resolveRound(): RoundShowdown {
    const category = this.state.selectedCategory;
    if (!category) throw new Error('Cannot resolve round without an active category.');

    let highestVal = -1;
    let winners: string[] = [];

    const submissions: RoundSubmission[] = Object.entries(this.state.submissions).map(
      ([playerId, sub]) => {
        if (sub.effectiveValue > highestVal) {
          highestVal = sub.effectiveValue;
          winners = [playerId];
        } else if (sub.effectiveValue === highestVal) {
          winners.push(playerId);
        }
        return {
          playerId,
          card: sub.card,
          statUsed: sub.statUsed,
          effectiveValue: sub.effectiveValue,
        };
      }
    );

    const callerId = this.state.callerId;
    const callerWonOrTied = winners.includes(callerId);

    if (callerWonOrTied) {
      // Caller gets +1; any other tied 1st place players also get +1; losers get 0
      winners.forEach((winnerId) => {
        this.state.players[winnerId].score += 1;
      });
    } else {
      // Caller lost: Caller gets -1; Winner(s) get +1; Others get 0
      this.state.players[callerId].score -= 1;
      winners.forEach((winnerId) => {
        this.state.players[winnerId].score += 1;
      });
    }

    const result: RoundShowdown = {
      roundNumber: this.state.currentRound,
      calledCategory: category,
      callerId,
      submissions,
      winnerIds: winners,
      winningValue: highestVal,
      callerWon: callerWonOrTied,
    };

    this.state.history.push(result);
    this.state.phase = 'SHOWDOWN';
    return result;
  }

  public advanceToNextRound(): boolean {
    if (this.state.currentRound >= this.TOTAL_ROUNDS) {
      this.state.phase = 'GAME_OVER';
      return false;
    }

    this.state.currentRound += 1;
    this.state.selectedCategory = null;
    this.state.submissions = {};

    Object.values(this.state.players).forEach((p) => {
      p.hasSubmitted = false;
    });

    const currentIndex = this.state.turnOrder.indexOf(this.state.callerId);
    const nextIndex = (currentIndex + 1) % this.state.turnOrder.length;
    this.state.callerId = this.state.turnOrder[nextIndex];

    this.state.phase = 'CALLER_SELECTION';
    return true;
  }

  public getGameWinners(): { winners: PlayerState[]; highestScore: number } {
    const allPlayers = Object.values(this.state.players);
    let maxScore = -Infinity;
    let winners: PlayerState[] = [];

    for (const player of allPlayers) {
      if (player.score > maxScore) {
        maxScore = player.score;
        winners = [player];
      } else if (player.score === maxScore) {
        winners.push(player);
      }
    }

    return { winners, highestScore: maxScore };
  }
  
}