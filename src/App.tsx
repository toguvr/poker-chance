import { useEffect, useMemo, useRef, useState } from 'react'
import { createDeck, simulateOdds } from './poker'
import './App.css'

function App() {
  const deck = useMemo(() => createDeck(), [])
  const [target, setTarget] = useState<'hero' | 'board'>('hero')
  const [hero, setHero] = useState<string[]>([])
  const [board, setBoard] = useState<string[]>([])
  const [opponents, setOpponents] = useState(1)
  const [iterations, setIterations] = useState(4000)
  const [result, setResult] = useState<{ win: number; tie: number; lose: number } | null>(null)
  const [status, setStatus] = useState('Escolha suas 2 cartas e as da mesa.')
  const [autoCalc, setAutoCalc] = useState(true)
  const calcTimer = useRef<number | null>(null)

  const selected = useMemo(() => new Set([...hero, ...board]), [hero, board])
  const heroSet = useMemo(() => new Set(hero), [hero])
  const boardSet = useMemo(() => new Set(board), [board])

  const handleCardClick = (code: string) => {
    if (selected.has(code)) {
      setHero((prev) => prev.filter((card) => card !== code))
      setBoard((prev) => prev.filter((card) => card !== code))
      return
    }
    if (target === 'hero') {
      if (hero.length >= 2) return
      setHero((prev) => [...prev, code])
    } else {
      if (board.length >= 5) return
      setBoard((prev) => [...prev, code])
    }
  }

  const handleCalculate = () => {
    if (hero.length < 2) {
      setStatus('Complete sua mão com 2 cartas.')
      return
    }
    setStatus('Calculando...')
    const odds = simulateOdds({ hero, board, opponents, iterations })
    setResult(odds)
    setStatus('Pronto! Ajuste cartas ou parâmetros e recalcule.')
  }

  const handleClear = () => {
    setHero([])
    setBoard([])
    setResult(null)
    setStatus('Mesa limpa. Recomece sua seleção.')
  }

  useEffect(() => {
    if (!autoCalc) return
    if (calcTimer.current) window.clearTimeout(calcTimer.current)
    if (hero.length < 2) {
      setResult(null)
      setStatus('Complete sua mão com 2 cartas.')
      return
    }
    setStatus('Calculando...')
    calcTimer.current = window.setTimeout(() => {
      const odds = simulateOdds({ hero, board, opponents, iterations })
      setResult(odds)
      setStatus('Atualizado automaticamente.')
    }, 200)
    return () => {
      if (calcTimer.current) window.clearTimeout(calcTimer.current)
    }
  }, [autoCalc, hero, board, opponents, iterations])

  const renderSlot = (code?: string) => (
    <button className={`slot ${code ? 'filled' : ''}`} onClick={() => code && handleCardClick(code)}>
      {code ? (
        <span className={`card-badge suit-${code[1].toLowerCase()}`}>
          {code[0]}
          <span className="suit">{suitSymbol(code[1])}</span>
        </span>
      ) : (
        <span className="slot-empty">+</span>
      )}
    </button>
  )

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Arena do Poker</p>
          <h1>Monte sua mesa e descubra suas chances</h1>
          <p className="subtitle">
            Selecione sua mão, adicione as cartas comunitárias e calcule sua % de vitória.
          </p>
        </div>
        <div className="scorecard">
          <div className="score">
            <span>Vitória</span>
            <strong>{result ? result.win.toFixed(1) : '--'}%</strong>
          </div>
          <div className="score">
            <span>Empate</span>
            <strong>{result ? result.tie.toFixed(1) : '--'}%</strong>
          </div>
          <div className="score">
            <span>Derrota</span>
            <strong>{result ? result.lose.toFixed(1) : '--'}%</strong>
          </div>
          <div className="status">{status}</div>
        </div>
      </header>

      <main className="arena">
        <section className="panel">
          <h2>Suas cartas</h2>
          <div className="slots">{[0, 1].map((i) => renderSlot(hero[i]))}</div>

          <h2>Mesa</h2>
          <div className="slots">{[0, 1, 2, 3, 4].map((i) => renderSlot(board[i]))}</div>

          <div className="toggle">
            <button
              className={target === 'hero' ? 'active' : ''}
              onClick={() => setTarget('hero')}
            >
              Adicionar na mão
            </button>
            <button
              className={target === 'board' ? 'active' : ''}
              onClick={() => setTarget('board')}
            >
              Adicionar na mesa
            </button>
          </div>

          <div className="controls">
            <label>
              Oponentes: <strong>{opponents}</strong>
              <input
                type="range"
                min={1}
                max={8}
                value={opponents}
                onChange={(event) => setOpponents(Number(event.target.value))}
              />
            </label>
            <label>
              Simulações: <strong>{iterations.toLocaleString('pt-BR')}</strong>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={iterations}
                onChange={(event) => setIterations(Number(event.target.value))}
              />
            </label>
            <label className="auto-toggle">
              <span>Auto atualizar chances</span>
              <input
                type="checkbox"
                checked={autoCalc}
                onChange={(event) => setAutoCalc(event.target.checked)}
              />
            </label>
          </div>

          <div className="actions">
            <button className="primary" onClick={handleCalculate} disabled={autoCalc}>
              Calcular chances
            </button>
            <button className="ghost" onClick={handleClear}>
              Limpar mesa
            </button>
          </div>
        </section>

        <section className="deck">
          <h2>Baralho interativo</h2>
          <p>Toque/click para adicionar. Clique novamente para remover.</p>
          <div className="deck-grid">
            {deck.map((code) => (
              <button
                key={code}
                className={`deck-card suit-${code[1].toLowerCase()} ${
                  selected.has(code) ? 'selected' : ''
                } ${heroSet.has(code) ? 'selected-hero' : ''} ${
                  boardSet.has(code) ? 'selected-board' : ''
                }`}
                onClick={() => handleCardClick(code)}
                disabled={
                  (!selected.has(code) && target === 'hero' && hero.length >= 2) ||
                  (!selected.has(code) && target === 'board' && board.length >= 5)
                }
              >
                <span className="rank">{code[0]}</span>
                <span className="suit">{suitSymbol(code[1])}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="mobile-scorecard">
        <div className="score">
          <span>Vitória</span>
          <strong>{result ? result.win.toFixed(1) : '--'}%</strong>
        </div>
        <div className="score">
          <span>Empate</span>
          <strong>{result ? result.tie.toFixed(1) : '--'}%</strong>
        </div>
        <div className="score">
          <span>Derrota</span>
          <strong>{result ? result.lose.toFixed(1) : '--'}%</strong>
        </div>
        <div className="status">{status}</div>
      </div>
    </div>
  )
}

const suitSymbol = (suit: string) => {
  if (suit === 'S') return '♠'
  if (suit === 'H') return '♥'
  if (suit === 'D') return '♦'
  return '♣'
}

export default App
