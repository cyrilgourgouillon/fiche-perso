import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { STORAGE_KEY } from '../../services/sheetStorage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Downloads exactly what local storage holds, so a sheet that breaks the interface is never lost. */
const downloadRawSheet = () => {
  let raw = '{}';
  try {
    raw = localStorage.getItem(STORAGE_KEY) || '{}';
  } catch {
    // storage unavailable: an empty file still tells the player there was nothing to save
  }
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fiche-secours.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Last line of defence: a rendering error shows a recovery screen instead of a blank
 * page, with a way to keep the stored sheet before trying again.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[fiche] erreur d’affichage', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;
    if (!error) return children;

    return (
      // inline layout: this screen must not depend on the stylesheet that may be part of the problem
      <main className="app-error" role="alert" style={{ maxWidth: '40rem', margin: '10vh auto', padding: '0 16px' }}>
        <h1>La fiche n’a pas pu s’afficher</h1>
        <p>
          Vos données sont toujours enregistrées dans le navigateur. Téléchargez-les avant de
          réessayer, puis signalez le problème avec ce fichier.
        </p>
        <pre className="app-error-detail">{error.message}</pre>
        <div className="app-error-actions">
          <button type="button" className="sheet-button" onClick={downloadRawSheet}>
            Télécharger la fiche enregistrée
          </button>
          <button type="button" className="sheet-button" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      </main>
    );
  }
}
