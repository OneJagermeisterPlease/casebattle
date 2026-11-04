import { BATTLE_SLOTS } from '@casebattle/shared';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>Case Battle</h1>
      <p>Демо-версия: только выдуманные монеты, без реальных денег.</p>
      <p>Режимы батлов: {Object.keys(BATTLE_SLOTS).join(' · ')}</p>
    </main>
  );
}
