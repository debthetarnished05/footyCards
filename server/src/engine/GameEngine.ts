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

    const initialDealerIndex = Math.floor(Math.random() * turnOrder.length);
    const initialCallerId = turnOrder[initialDealerIndex] ?? turnOrder[0] ?? '';

    this.state = {
      roomId,
      phase: 'CALLER_SELECTION',
      currentRound: 1,
      maxPlayers: initialPlayers.length,
      callerId: initialCallerId,
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

    // Sanitize submissions:
    // - Showdown: reveal all submissions with full stats
    // - Pre-showdown:
    //   * The requesting player gets their own full submission
    //   * If the caller has submitted, other players get the caller's card but with stats STRIPPED (zero privacy leak)
    //   * For other opponents who submitted, return { submitted: true } (no card details)
    const sanitizedSubmissions = isShowdown
      ? this.state.submissions
      : Object.keys(this.state.submissions).reduce((acc, pid) => {
          if (pid === forPlayerId) {
            acc[pid] = this.state.submissions[pid];
          } else if (pid === this.state.callerId) {
            const callerSub = this.state.submissions[pid];
            if (callerSub) {
              acc[pid] = {
                card: {
                  cardId: callerSub.card.cardId,
                  name: callerSub.card.name,
                  club: callerSub.card.club,
                  nationality: callerSub.card.nationality,
                  position: callerSub.card.position,
                  image: callerSub.card.image,
                  clubLogo: callerSub.card.clubLogo,
                  countryFlag: callerSub.card.countryFlag,
                  stats: {}, // STRIPPED: No stat numbers exposed over network!
                },
                statUsed: callerSub.statUsed,
              };
            } else {
              acc[pid] = { submitted: true };
            }
          } else {
            acc[pid] = { submitted: true };
          }
          return acc;
        }, {} as Record<string, any>);

    return {
      ...this.state,
      players: sanitizedPlayers,
      submissions: sanitizedSubmissions,
    };
  }

  // Caller plays card and sets the category (outfield stat, GK stat, or rating)
  public callerSelect(callerId: string, cardId: string, category: AnyBattleStat): boolean {
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

    // Option 1 Rule: When dealer leads with a GK, battle is strictly on Overall Rating ('rating')
    const finalCategory: AnyBattleStat = card.position === 'GK' ? 'rating' : category;
    const effectiveValue = card.stats[finalCategory] ?? 0;

    this.state.submissions[callerId] = { card, statUsed: finalCategory, effectiveValue };
    player.hasSubmitted = true;
    this.state.selectedCategory = finalCategory;
    this.state.phase = 'OPPONENT_RESPONSES';

    return true;
  }

  // Opponents respond: If GK, they can specify `chosenGkStat` as trump. Otherwise uses called category.
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

  // Convert disconnected player into a CPU bot to prevent mid-game freezes
  public handlePlayerDisconnect(playerId: string): void {
    const player = this.state.players[playerId];
    if (!player) return;

    player.connected = false;
    player.isCpu = true;
    if (!player.name.includes('(BOT)')) {
      player.name = `${player.name} (BOT)`;
    }
  }

  // CPU bot logic supporting GK trump card decisions
  public executeCpuTurns(): void {
    const category = this.state.selectedCategory;

    for (const player of Object.values(this.state.players)) {
      if (!player.isCpu || player.hasSubmitted) continue;

      if (this.state.phase === 'CALLER_SELECTION' && this.state.callerId === player.id) {
        // CPU as Caller
        const card = player.hand[0];
        if (!card) continue;

        let bestStat: AnyBattleStat = 'rating';
        if (card.position === 'GK') {
          // Option 1 Rule: When dealer plays a GK, category is locked to 'rating' (OVR)
          bestStat = 'rating';
        } else {
          let max = -1;
          for (const [sKey, sVal] of Object.entries(card.stats)) {
            if (typeof sVal === 'number' && sVal > max) {
              max = sVal;
              bestStat = sKey as AnyBattleStat;
            }
          }
        }
        this.callerSelect(player.id, card.cardId, bestStat);
      } else if (this.state.phase === 'OPPONENT_RESPONSES' && category) {
        // CPU as Responder: checks if it has a GK to trump with
        const firstCard = player.hand[0];
        if (!firstCard) continue;

        let bestCard = firstCard;
        let bestStatUsed: AnyBattleStat = category;
        let highestFound = -1;

        for (const card of player.hand) {
          if (!card) continue;
          if (card.position === 'GK') {
            // Find GK's highest stat
            for (const [sKey, sVal] of Object.entries(card.stats)) {
              if (typeof sVal === 'number' && sVal > highestFound) {
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

  // Round resolution according to rules: caller loss penalty (-1 pt), winners (+1 pt)
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
    const callerPlayer = this.state.players[callerId];

    if (callerWonOrTied) {
      // Caller gets +1; any other tied 1st place players also get +1; losers get 0
      winners.forEach((winnerId) => {
        const p = this.state.players[winnerId];
        if (p) p.score += 1;
      });
    } else {
      // Caller lost: Caller gets -1; Winner(s) get +1; Others get 0
      if (callerPlayer) callerPlayer.score -= 1;
      winners.forEach((winnerId) => {
        const p = this.state.players[winnerId];
        if (p) p.score += 1;
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
    this.state.callerId = this.state.turnOrder[nextIndex] ?? '';

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