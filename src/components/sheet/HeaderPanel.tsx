import IdentityBlock from './IdentityBlock';
import VitalsBlock from './VitalsBlock';

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
