import React, { useState, useCallback, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { useSound } from './hooks/useSound';
import { useHaptics } from './hooks/useHaptics';
import TitleScreen from './components/TitleScreen';
import InfoPanel from './components/InfoPanel';
import AllocationField from './components/AllocationField';
import PlayerWallet from './components/PlayerWallet';
import RivalLeaderboard from './components/RivalLeaderboard';
import MarketRace from './components/MarketRace';
import ResultScreen from './components/ResultScreen';
import ConfirmModal from './components/ConfirmModal';
import EventPopup from './components/EventPopup';
import LifeEventPopup from './components/LifeEventPopup';
import VictoryAnimation from './components/VictoryAnimation';
import AssetTrendChart from './components/AssetTrendChart';
import { getFinalRankings } from './logic/scoring';
import { ASSET_CLASSES } from './types/game';

const App: React.FC = () => {
  const { 
    state, 
    startGame, 
    allocate, 
    endTurn, 
    raceDone, 
    collectionDone, 
    repeatAllocation,
    resetGame 
  } = useGameState();
  const sound = useSound();
  const haptics = useHaptics();
  
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [showLifeEventPopup, setShowLifeEventPopup] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [showingVictory, setShowingVictory] = useState(false);
  const [victoryDone, setVictoryDone] = useState(false);
  
  // コイン移動時のサウンド + ハプティクス
  const handleCoinAdd = useCallback(() => {
    sound.playCoinAdd();
    haptics.vibrateCoin();
  }, [sound, haptics]);
  
  const handleCoinRemove = useCallback(() => {
    sound.playCoinRemove();
    haptics.vibrateCoin();
  }, [sound, haptics]);
  
  // ターン終了
  const handleEndTurn = useCallback(() => {
    sound.playConfirm();
    haptics.vibrateConfirm();
    endTurn();
  }, [sound, haptics, endTurn]);
  
  // 市場変動フェーズ開始時のイベント演出
  useEffect(() => {
    if (state.phase === 'MARKET_RACE') {
      if (state.currentEvent) {
        setShowEventPopup(true);
        
        if (state.currentEvent.type === 'CRASH') {
          sound.playCrash();
          haptics.vibrateCrash();
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 600);
        } else if (state.currentEvent.type === 'BOOM') {
          sound.playBoom();
          haptics.vibrateBoom();
        }
      }
      
      // ライフイベント発生時の処理
      if (state.currentLifeEvent) {
        setShowLifeEventPopup(true);
        sound.playLifeEvent();
        if (state.lifeEventPenalty > 0) {
          // ペナルティがある場合は少し揺らす
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);
        }
      }
    }
  }, [state.phase, state.turn]); // ターンとフェーズの変更時のみ実行

  // 回収フェーズの音声再生のみ
  useEffect(() => {
    if (state.phase === 'COLLECTION') {
      const prevResult = state.turnResults[state.turnResults.length - 1];
      const diff = prevResult ? prevResult.playerAfter - prevResult.playerBefore : 0;
      sound.playCollection(diff);
    }
  }, [state.phase]); // ターンとフェーズの変更時のみ実行
  
  // リタイア処理
  const handleRetire = useCallback(() => {
    setShowRetireModal(false);
    resetGame();
  }, [resetGame]);
  
  // 優勝判定
  const isWinner = React.useMemo(() => {
    if (state.phase !== 'RESULT') return false;
    const rankings = getFinalRankings(state.player.coins, state.rivals);
    return rankings[0].isPlayer;
  }, [state.phase, state.player.coins, state.rivals]);

  useEffect(() => {
    if (state.phase === 'RESULT') {
      if (isWinner && !victoryDone && !showingVictory) {
        setShowingVictory(true);
      }
    } else if (state.phase === 'TITLE') {
      setVictoryDone(false);
      setShowingVictory(false);
    }
  }, [state.phase, isWinner, victoryDone, showingVictory]);

  const handleVictoryComplete = useCallback(() => {
    setShowingVictory(false);
    setVictoryDone(true);
  }, []);
  
  // ===== Render =====
  
  // タイトル画面
  if (state.phase === 'TITLE') {
    return (
      <div className="app-container">
        <TitleScreen onStart={startGame} />
      </div>
    );
  }
  
  // リザルト画面
  if (state.phase === 'RESULT') {
    if (showingVictory) {
      return <VictoryAnimation player={state.player} rivals={state.rivals} onComplete={handleVictoryComplete} />;
    }
    return (
      <div className="app-container">
        <ResultScreen
          player={state.player}
          rivals={state.rivals}
          onRestart={resetGame}
          onPlayResultSound={sound.playResult}
        />
      </div>
    );
  }
  
  // 市場変動レース
  if (state.phase === 'MARKET_RACE' && state.currentRates) {
    return (
      <div className={`app-container ${screenShake ? 'screen-shake' : ''}`}>
        <header className="game-header">
          <div className="game-header__title">
            <span>🍱</span> お弁当マスターへの道
          </div>
          <div className="game-header__turn">
            ターン <span className="game-header__turn-number">{state.turn}</span> / {state.maxTurns}
          </div>
        </header>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MarketRace rates={state.currentRates} onRaceDone={raceDone} />
        </div>
        
        {showEventPopup && state.currentEvent && (
          <EventPopup
            event={state.currentEvent}
            onDismiss={() => setShowEventPopup(false)}
          />
        )}
        
        {showLifeEventPopup && state.currentLifeEvent && (
          <LifeEventPopup
            event={state.currentLifeEvent}
            penalty={state.lifeEventPenalty}
            onDismiss={() => setShowLifeEventPopup(false)}
          />
        )}
      </div>
    );
  }
  
  // 回収フェーズ
  if (state.phase === 'COLLECTION') {
    const prevResult = state.turnResults[state.turnResults.length - 1];
    const prevAllocation = state.player.allocationHistory[state.player.allocationHistory.length - 1];
    const diff = prevResult ? prevResult.playerAfter - prevResult.playerBefore : 0;
    
    // ASSET_CLASSESを利用してレシートを生成します。
    const receiptLines = ASSET_CLASSES.map(asset => {
      const allocated = prevAllocation ? prevAllocation[asset.id] : 0;
      const rate = prevResult ? prevResult.rates[asset.id] : 0;
      const profit = allocated * rate;
      return {
        id: asset.id,
        name: asset.name,
        emoji: asset.emoji,
        profit,
        rate
      };
    });

    return (
      <div className="app-container">
        <header className="game-header">
          <div className="game-header__title">
            <span>🍱</span> お弁当マスターへの道
          </div>
          <div className="game-header__turn">
            ターン <span className="game-header__turn-number">{state.turn}</span> / {state.maxTurns}
          </div>
        </header>
        
        <div className="collection-phase" style={{ padding: 'var(--sp-xl)' }}>
          <div className="receipt-panel glass-panel slide-up" style={{ width: '100%', maxWidth: '360px', padding: 'var(--sp-lg)', backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--sp-md)', borderBottom: '1px dashed var(--border-glass)', paddingBottom: 'var(--sp-sm)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>🧾 今回の運用結果</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {receiptLines.map(line => (
                <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{line.emoji}</span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{line.name}</span>
                  </div>
                  <div style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: line.profit > 0 ? 'var(--accent-green)' : line.profit < 0 ? 'var(--accent-red)' : 'var(--text-secondary)'
                  }}>
                    {line.profit > 0 ? '+' : ''}{line.profit.toFixed(1)}
                    {line.profit !== 0 && (
                      <span style={{ fontSize: '0.9rem', marginLeft: '6px' }}>
                        {line.profit > 0 ? '📈' : '📉'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {prevResult?.lifeEvent && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{prevResult.lifeEvent.emoji}</span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--accent-orange)', fontWeight: 700 }}>ライフイベント</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-red)' }}>
                    -{prevResult.lifeEventPenalty}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 'var(--sp-md)', paddingTop: 'var(--sp-md)', borderTop: '1px dashed var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>合計損益</div>
              <div style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.4rem', 
                fontWeight: 900,
                color: diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {diff >= 0 ? '+' : ''}{diff.toFixed(1)} コイン
              </div>
            </div>
          </div>
          
          <div className="collection-phase__amount slide-up" style={{ marginTop: 'var(--sp-xl)', animationDelay: '0.2s', fontSize: '2rem' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginRight: '12px' }}>総資産:</span>
            {Math.round(state.player.coins)} コイン
          </div>
          
          <button 
            className="btn-end-turn slide-up" 
            style={{ marginTop: 'var(--sp-xl)', animationDelay: '0.4s', padding: '16px 48px', fontSize: '1.2rem', minWidth: '200px' }}
            onClick={collectionDone}
          >
            次へ
          </button>
        </div>
      </div>
    );
  }
  
  // 配分フェーズ（メイン画面）
  const lastTurnResult = state.turnResults.length > 0 ? state.turnResults[state.turnResults.length - 1] : null;
  
  // ゲームオーバー判定（コイン0以下）
  if (state.player.coins <= 0) {
    return (
      <div className="app-container">
         <div className="result-screen">
          <div className="result-screen__dreamlife slide-up">
            <span className="result-screen__dreamlife-emoji">💸</span>
            <div className="result-screen__dreamlife-title">破産しました...</div>
            <div className="result-screen__dreamlife-desc">
              資金が底をつきました。ライフイベントの出費が重すぎたようです。
            </div>
          </div>
          <button className="btn-restart slide-up" style={{ animationDelay: '0.4s' }} onClick={resetGame}>
            🔄 最初からやり直す
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-container ${screenShake ? 'screen-shake' : ''}`}>
      <header className="game-header">
        <div className="game-header__title">
          <span>🍱</span> お弁当マスターへの道
        </div>
        <div className="game-header__turn">
          ターン <span className="game-header__turn-number">{state.turn}</span> / {state.maxTurns}
        </div>
        <button
          className="btn-retire"
          onClick={() => setShowRetireModal(true)}
          id="btn-retire"
        >
          🚪 リタイア
        </button>
      </header>
      
      <main className="game-main">
        <InfoPanel
          turn={state.turn}
          currentEvent={state.currentEvent}
          marketHistory={state.marketHistory}
          eventHistory={state.eventHistory}
        />
        
        <div className="game-center-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', gap: '16px', flex: 1, minWidth: 0 }}>
          <AssetTrendChart
            playerHistory={state.player.history}
            rivals={state.rivals.map(r => ({ name: r.name, emoji: r.emoji, history: r.history }))}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AllocationField
              allocation={state.player.allocation}
              totalCoins={state.player.coins}
              onAllocate={allocate}
              onCoinAdd={handleCoinAdd}
              onCoinRemove={handleCoinRemove}
              lastRates={lastTurnResult?.rates}
              disabled={state.phase !== 'ALLOCATION'}
            />
            
            <PlayerWallet
              wallet={state.player.wallet}
              totalCoins={state.player.coins}
              allocation={state.player.allocation}
              onEndTurn={handleEndTurn}
              onRepeatAllocation={repeatAllocation}
              turn={state.turn}
              disabled={state.phase !== 'ALLOCATION'}
            />
          </div>
        </div>
        
        <RivalLeaderboard
          playerCoins={state.player.coins}
          playerAllocation={state.player.allocation}
          playerHistory={state.player.history}
          rivals={state.rivals}
          lastEvent={state.eventSchedule[state.turn - 2] || null}
        />
      </main>
      
      {showRetireModal && (
        <ConfirmModal
          title="⚠️ リタイアしますか？"
          message="ゲームの進捗はすべて失われます。本当にタイトル画面に戻りますか？"
          confirmLabel="リタイアする"
          cancelLabel="続ける"
          onConfirm={handleRetire}
          onCancel={() => setShowRetireModal(false)}
        />
      )}
    </div>
  );
};

export default App;
