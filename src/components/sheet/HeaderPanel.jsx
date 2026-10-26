import IdentityBlock from './IdentityBlock.jsx';
import VitalsBlock from './VitalsBlock.jsx';

export default function HeaderPanel({ onOpenAppearance }) {
  return (
    <div className="panel header-panel">
      <IdentityBlock onOpenAppearance={onOpenAppearance} />
      <VitalsBlock />
    </div>
  );
}
