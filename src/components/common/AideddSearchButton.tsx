import { useSheetField } from '../../context/SheetContext';

interface AideddSearchButtonProps {
  fieldName: string;
}

export default function AideddSearchButton({ fieldName }: AideddSearchButtonProps) {
  const [value] = useSheetField(fieldName);
  const query = value.trim();
  const search = new URLSearchParams({ q: query });

  return (
    <a
      className="sheet-button aidedd-search-button"
      href={query ? `https://www.aidedd.org/search/?${search.toString()}` : undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Rechercher « ${query || 'ce nom'} » sur AideDD`}
      aria-disabled={!query}
      title={query ? `Rechercher « ${query} » sur AideDD` : 'Saisissez un nom pour chercher sur AideDD'}
    >
      <span aria-hidden="true">?</span>
    </a>
  );
}
