'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>Error</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Etwas ist schiefgelaufen</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Erneut versuchen
        </button>
        <a
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#fff',
            color: '#000',
            textDecoration: 'none',
            border: '1px solid #000',
            borderRadius: '0.375rem'
          }}
        >
          Zur Startseite
        </a>
      </div>
    </div>
  );
}
