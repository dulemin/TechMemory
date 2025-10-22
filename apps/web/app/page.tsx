export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold">Event Guestbook Lite</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Digitales Gästebuch für Events wie Hochzeiten und Partys.
          Gäste können per QR-Code oder Link Videos, Fotos und Nachrichten hochladen.
        </p>
        <div className="flex gap-4 mt-8">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Dashboard
          </a>
          <a
            href="/login"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
          >
            Login
          </a>
        </div>
      </main>
    </div>
  );
}
