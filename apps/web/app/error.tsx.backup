'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Fehler aufgetreten</h1>
      <p className="mt-4 text-muted-foreground">
        {error.message || 'Ein unerwarteter Fehler ist aufgetreten'}
      </p>
      <button
        onClick={reset}
        className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
