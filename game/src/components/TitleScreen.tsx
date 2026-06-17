import React from 'react';

interface Props {
  onStart: () => void;
}

const TitleScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="title-screen">
      <div className="title-screen__emoji">🍱</div>
      <h1 className="title-screen__heading">
        資産運用シミュレーション<br />
        〜お弁当マスターへの道〜
      </h1>
      <p className="title-screen__subtitle">
        手持ちのコインすべてを5つの投資先に配分し、<br />
        20年後の最終資産額と称号を目指そう！
      </p>
      
      <button className="btn-start" onClick={onStart} id="btn-start-game">
        🎮 ゲームスタート
      </button>
      
      <div className="title-screen__rules glass-panel">
        <h3>📖 ルール</h3>
        <ul>
          <li>手持ちのコインすべてを5つの資産に自由に配分します</li>
          <li>各ターンで市場が変動し、資産が増減します</li>
          <li>預金は安全ですがインフレに弱い、株式はハイリスク・ハイリターン</li>
          <li>王道の分散投資でバランスよく配分するのが勝利の鍵！</li>
          <li>3人のライバルCPUと順位を競おう</li>
        </ul>
      </div>
      
      <div className="title-screen__disclaimer" style={{
        marginTop: '20px',
        padding: '16px',
        border: '2px solid var(--accent-red)',
        borderRadius: '8px',
        background: 'rgba(255, 0, 0, 0.05)',
        fontSize: '0.85rem',
        color: '#eee',
        textAlign: 'left'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span> 免責事項
        </h4>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          本記事およびゲームのシミュレーションは、実践的な金融経済知識の普及啓発を目的として作成したものであり、特定の商品の売買の勧誘を目的としたものではありません。金融商品を購入する際は、商品の特性や取引の仕組み、リスクや手数料等の費用などを十分にご理解いただいた上、必ずご自身の判断と責任において実行してください。
        </p>
      </div>
    </div>
  );
};

export default TitleScreen;
