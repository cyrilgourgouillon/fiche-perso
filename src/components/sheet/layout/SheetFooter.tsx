const GITHUB_URL = 'https://github.com/cyrilgourgouillon';

export default function SheetFooter() {
  return (
    <p className="sheet-footer">
      Made with <span className="footer-heart">❤️</span> by{' '}
      <a href={GITHUB_URL} target="_blank" rel="noreferrer">
        Cyril Gourgouillon
      </a>
    </p>
  );
}
