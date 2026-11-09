import { memo } from 'react';
import { SearchExample } from './SearchSyntax';
import type { SearchEntry } from '../../../services/searchIndex';

type SearchHelpProps = {
  expanded: boolean;
  onToggle: () => void;
  /** Sheet entries, so `>a:` examples can show which part names something already on the sheet. */
  entries: ReadonlyArray<Pick<SearchEntry, 'section' | 'title'>>;
};

const ADD_EXAMPLES = ['quête', 'sort boule de feu', 'arme', 'capacité', 'équipement', 'équipement Potion 3', 'lien magique', 'pièce 10 po'];

/** "Que pouvez-vous écrire ?" — the syntax legend and examples of every command. */
function SearchHelp({ expanded, onToggle, entries }: SearchHelpProps) {
  return (
    <aside className="search-help" aria-label="Aide à la recherche">
      <button
        type="button"
        className="search-help-toggle"
        aria-expanded={expanded}
        aria-controls="search-help-content"
        onClick={onToggle}
      >
        <span>Que pouvez-vous écrire&nbsp;?</span>
        <span className="search-help-caret" aria-hidden="true" />
      </button>
      {expanded && (
        <>
          <div className="search-help-legend" aria-label="Légende des couleurs">
            <span>
              <i className="is-command" aria-hidden="true" />
              Commande reconnue
            </span>
            <span>
              <i className="is-valid" aria-hidden="true" />
              Action correspondante
            </span>
            <span>
              <i className="is-invalid" aria-hidden="true" />
              Aucune correspondance
            </span>
            <span>
              <i className="is-query" aria-hidden="true" />
              Texte recherché
            </span>
          </div>
          <div id="search-help-content" className="search-help-groups">
            <section className="search-help-group" aria-labelledby="search-help-plain-title">
              <h3 id="search-help-plain-title">Recherche en texte libre</h3>
              <ul>
                <li>
                  <span>Rechercher dans la fiche</span>
                  <code className="search-token-query">acrobaties</code>
                </li>
              </ul>
            </section>
            <section className="search-help-group" aria-labelledby="search-help-filter-title">
              <h3 id="search-help-filter-title">Recherche avec filtre de section</h3>
              <ul>
                <li>
                  <span>Limiter la recherche à une section</span>
                  <SearchExample prefix="sort" filter>boule de feu</SearchExample>
                  <SearchExample prefix="quête" filter>dragon</SearchExample>
                </li>
              </ul>
            </section>
            <section className="search-help-group" aria-labelledby="search-help-commands-title">
              <h3 id="search-help-commands-title">Commandes</h3>
              <ul>
                <li>
                  <span>Lancer une compétence, une sauvegarde ou des dés</span>
                  <SearchExample prefix="t">acrobaties</SearchExample>
                  <SearchExample prefix="t">force</SearchExample>
                  <SearchExample prefix="t">d20+4</SearchExample>
                  <SearchExample prefix="t">2d6+3</SearchExample>
                </li>
                <li>
                  <span>Ajouter un élément</span>
                  {ADD_EXAMPLES.map((example) => (
                    <SearchExample key={example} prefix="a" entries={entries}>{example}</SearchExample>
                  ))}
                </li>
                <li>
                  <span>Retirer un objet de l’inventaire ou des pièces</span>
                  <SearchExample prefix="r" entries={entries}>équipement</SearchExample>
                  <SearchExample prefix="r">pieces 10 po</SearchExample>
                </li>
                <li>
                  <span>Accéder à une section</span>
                  <SearchExample prefix="g">sorts</SearchExample>
                  <SearchExample prefix="g">caractéristiques</SearchExample>
                </li>
                <li>
                  <span>Ouvrir un outil</span>
                  <SearchExample prefix="o">dés</SearchExample>
                  <SearchExample prefix="o">référence</SearchExample>
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </aside>
  );
}

export default memo(SearchHelp);
