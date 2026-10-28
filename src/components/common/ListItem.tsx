import RemoveRowButton from '../fields/RemoveRowButton';

interface ListItemProps {
  children: React.ReactNode;
  contentClassName?: string;
  remove?: {
    label: string;
    requiresConfirmation?: boolean;
    onClick: () => void;
  };
}

export default function ListItem({
  children,
  contentClassName = 'capacite-content',
  remove,
}: ListItemProps) {
  return (
    <li>
      <div className={contentClassName}>{children}</div>
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
