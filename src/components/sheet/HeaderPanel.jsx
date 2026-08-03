import IdentityBlock from './IdentityBlock.jsx';
import VitalsBlock from './VitalsBlock.jsx';

export default function HeaderPanel() {
  return (
    <div className="panel header-panel">
      <IdentityBlock />
      <VitalsBlock />
    </div>
  );
}
