import RemoveRowButton from '../fields/RemoveRowButton';

interface ListItemProps {
  children: React.ReactNode;
  contentClassName?: string;
  className?: string;
  bottomRight?: React.ReactNode;
  remove?: {
    label: string;
    requiresConfirmation?: boolean;
    onClick: () => void;
  };
}

export default function ListItem({
  children,
  contentClassName = 'capacite-content',
  className,
  bottomRight,
  remove,
}: ListItemProps) {
  const itemClassName = [
    className,
    bottomRight ? 'has-bottom-right-control' : undefined,
  ].filter(Boolean).join(' ');

  return (
    <li className={itemClassName || undefined}>
      <div className={contentClassName}>{children}</div>
      {bottomRight}
      {remove && (
        <RemoveRowButton
          label={remove.label}
          confirm={remove.requiresConfirmation}
          onClick={remove.onClick}
        />
      )}
    </li>
  );
}
