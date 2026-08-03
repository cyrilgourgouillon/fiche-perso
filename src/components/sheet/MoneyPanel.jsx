import Panel from './Panel.jsx';
import TextField from '../fields/TextField.jsx';

const COIN_TYPES = ['pc', 'pa', 'pe', 'po', 'pp'];

export default function MoneyPanel() {
  return (
    <Panel as="div" id="pieces" title="Pièces">
      <div className="money-grid">
        {COIN_TYPES.map((coin) => (
          <div className="coin-block" key={coin}>
            <div className="coin-label">{coin.toUpperCase()}</div>
            <TextField name={coin} />
          </div>
        ))}
      </div>
    </Panel>
  );
}
