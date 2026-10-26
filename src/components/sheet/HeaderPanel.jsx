import IdentityBlock from './IdentityBlock.jsx';
import VitalsBlock from './VitalsBlock.jsx';

export default function HeaderPanel({ onOpenAppearance }) {
  return (
    <div className="header-panel">
      <section className="panel header-subpanel header-identity-panel">
        <IdentityBlock onOpenAppearance={onOpenAppearance} />
      </section>
      <section className="panel header-subpanel header-vitals-panel">
        <VitalsBlock />
      </section>
    </div>
  );
}
