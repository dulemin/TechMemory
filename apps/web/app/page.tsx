export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-br from-brand-bg-start via-brand-bg-mid to-brand-bg-end">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-text-dark">
          Event Guestbook Lite
        </h1>
        <p className="text-lg md:text-xl text-brand-text-mid max-w-2xl">
          Digitales Gästebuch für Events wie Hochzeiten und Partys.
          Gäste können per QR-Code oder Link Videos, Fotos und Nachrichten hochladen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <a
            href="/dashboard"
            className="px-8 py-4 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Dashboard
          </a>
          <a
            href="/login"
            className="px-8 py-4 bg-white text-brand-primary border-2 border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-all shadow-md font-medium"
          >
            Login
          </a>
        </div>
      </main>
    </div>
  );
}
