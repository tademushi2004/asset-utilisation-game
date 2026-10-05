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
import SoundTestPanel from './components/SoundTestPanel';

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

  
  // 回収フェーズの自動進行
  useEffect(() => {
    if (state.phase === 'COLLECTION') {
      const prevResult = state.turnResults[state.turnResults.length - 1];
      const diff = prevResult ? prevResult.playerAfter - prevResult.playerBefore : 0;
      sound.playCollection(diff);
      const timer = setTimeout(() => {
        collectionDone();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.turn]); // ターンとフェーズの変更時のみ実行
  
  // リタイア処理
  const handleRetire = useCallback(() => {
    setShowRetireModal(false);
    resetGame();
  }, [resetGame]);
  
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
    const diff = prevResult ? prevResult.playerAfter - prevResult.playerBefore : 0;
    
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
        
        <div className="collection-phase">
          <div className="collection-phase__coins-animation">
            💰💰💰
          </div>
          <div className="collection-phase__label">コインが戻ってきます...</div>
          <div className="collection-phase__amount">
            {Math.round(state.player.coins)} コイン
          </div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {diff >= 0 ? '📈 +' : '📉 '}{Math.round(diff)} コイン
          </div>
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
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', flex: 1 }}>
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
      
      <SoundTestPanel />
    </div>
  );
};

export default App;
