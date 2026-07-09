import { useState } from 'react';
import './App.css';
import BeginnerMode from './modes/BeginnerMode';
import IntermediateMode from './modes/IntermediateMode';
import AdvancedMode from './modes/AdvancedMode';
import PracticeMode from './modes/PracticeMode';

type Tab = 'beginner' | 'intermediate' | 'advanced' | 'practice';

const TABS: { key: Tab; label: string }[] = [
  { key: 'beginner', label: '初心者用' },
  { key: 'intermediate', label: '中級者用' },
  { key: 'advanced', label: '上級者用' },
  { key: 'practice', label: '点数計算練習' },
];

function App() {
  const [tab, setTab] = useState<Tab>('beginner');

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>麻雀点数計算アプリ</h1>
      </header>
      <nav className="app-nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'app-nav-btn active' : 'app-nav-btn'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {tab === 'beginner' && <BeginnerMode />}
        {tab === 'intermediate' && <IntermediateMode />}
        {tab === 'advanced' && <AdvancedMode />}
        {tab === 'practice' && <PracticeMode />}
      </main>
    </div>
  );
}

export default App;
