export type Suit = 'S' | 'H' | 'D' | 'C'

export type Card = {
  code: string
  rank: number
  suit: Suit
}

export type HandRank = {
  category: number
  tiebreaker: number[]
}

const RANK_MAP: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

const RANKS = Object.keys(RANK_MAP)
const SUITS: Suit[] = ['S', 'H', 'D', 'C']

export const createDeck = () => {
  const deck: string[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`)
    }
  }
  return deck
}

export const toCard = (code: string): Card => {
  const rankChar = code[0]
  const suit = code[1] as Suit
  return { code, rank: RANK_MAP[rankChar], suit }
}

const compareRank = (a: HandRank, b: HandRank) => {
  if (a.category !== b.category) return a.category - b.category
  const maxLen = Math.max(a.tiebreaker.length, b.tiebreaker.length)
  for (let i = 0; i < maxLen; i += 1) {
    const diff = (a.tiebreaker[i] ?? 0) - (b.tiebreaker[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

const getStraightHigh = (ranksDesc: number[]) => {
  const unique = Array.from(new Set(ranksDesc))
  if (unique.length !== 5) return null
  const high = unique[0]
  const low = unique[4]
  if (high - low === 4) return high
  if (unique[0] === 14 && unique[1] === 5 && unique[4] === 2) return 5
  return null
}

const evaluateFive = (cards: Card[]): HandRank => {
  const ranksDesc = cards
    .map((card) => card.rank)
    .sort((a, b) => b - a)
  const suits = cards.map((card) => card.suit)
  const isFlush = suits.every((suit) => suit === suits[0])

  const counts = new Map<number, number>()
  for (const rank of ranksDesc) counts.set(rank, (counts.get(rank) ?? 0) + 1)
  const groups = Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => (b.count - a.count) || (b.rank - a.rank))

  const straightHigh = getStraightHigh(ranksDesc)
  if (straightHigh && isFlush) return { category: 8, tiebreaker: [straightHigh] }
  if (groups[0].count === 4) {
    const kicker = groups.find((group) => group.count === 1)?.rank ?? 0
    return { category: 7, tiebreaker: [groups[0].rank, kicker] }
  }
  if (groups[0].count === 3 && groups[1]?.count === 2) {
    return { category: 6, tiebreaker: [groups[0].rank, groups[1].rank] }
  }
  if (isFlush) return { category: 5, tiebreaker: ranksDesc }
  if (straightHigh) return { category: 4, tiebreaker: [straightHigh] }
  if (groups[0].count === 3) {
    const kickers = groups.filter((group) => group.count === 1).map((g) => g.rank)
    return { category: 3, tiebreaker: [groups[0].rank, ...kickers] }
  }
  if (groups[0].count === 2 && groups[1]?.count === 2) {
    const highPair = Math.max(groups[0].rank, groups[1].rank)
    const lowPair = Math.min(groups[0].rank, groups[1].rank)
    const kicker = groups.find((group) => group.count === 1)?.rank ?? 0
    return { category: 2, tiebreaker: [highPair, lowPair, kicker] }
  }
  if (groups[0].count === 2) {
    const kickers = groups.filter((group) => group.count === 1).map((g) => g.rank)
    return { category: 1, tiebreaker: [groups[0].rank, ...kickers] }
  }
  return { category: 0, tiebreaker: ranksDesc }
}

export const bestHand = (cards: Card[]): HandRank => {
  let best: HandRank | null = null
  for (let i = 0; i < cards.length - 4; i += 1) {
    for (let j = i + 1; j < cards.length - 3; j += 1) {
      for (let k = j + 1; k < cards.length - 2; k += 1) {
        for (let l = k + 1; l < cards.length - 1; l += 1) {
          for (let m = l + 1; m < cards.length; m += 1) {
            const rank = evaluateFive([cards[i], cards[j], cards[k], cards[l], cards[m]])
            if (!best || compareRank(rank, best) > 0) best = rank
          }
        }
      }
    }
  }
  return best ?? { category: 0, tiebreaker: [] }
}

export const simulateOdds = ({
  hero,
  board,
  opponents,
  iterations,
}: {
  hero: string[]
  board: string[]
  opponents: number
  iterations: number
}) => {
  const used = new Set([...hero, ...board])
  const baseDeck = createDeck().filter((card) => !used.has(card))
  let wins = 0
  let ties = 0
  let losses = 0

  for (let sim = 0; sim < iterations; sim += 1) {
    const deck = baseDeck.slice()
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    const opponentsHands: string[][] = []
    for (let i = 0; i < opponents; i += 1) {
      opponentsHands.push([deck.pop()!, deck.pop()!])
    }

    const missing = 5 - board.length
    const boardCards = [...board]
    for (let i = 0; i < missing; i += 1) {
      boardCards.push(deck.pop()!)
    }

    const heroRank = bestHand([...hero, ...boardCards].map(toCard))

    let isWin = true
    let isTie = false
    for (const opp of opponentsHands) {
      const oppRank = bestHand([...opp, ...boardCards].map(toCard))
      const diff = compareRank(heroRank, oppRank)
      if (diff < 0) {
        isWin = false
        isTie = false
        break
      }
      if (diff === 0) isTie = true
    }

    if (isWin && isTie) ties += 1
    else if (isWin) wins += 1
    else losses += 1
  }

  return {
    win: (wins / iterations) * 100,
    tie: (ties / iterations) * 100,
    lose: (losses / iterations) * 100,
  }
}
