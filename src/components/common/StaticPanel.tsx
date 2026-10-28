interface StaticPanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export default function StaticPanel({ id, title, children }: StaticPanelProps) {
  return (
    <section className="panel" id={id}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}
