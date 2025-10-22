function Error({ statusCode }) {
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
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        {statusCode
          ? `Ein Fehler ${statusCode} ist aufgetreten`
          : 'Ein unerwarteter Fehler ist aufgetreten'}
      </p>
      <a
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '0.375rem'
        }}
      >
        Zur Startseite
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
