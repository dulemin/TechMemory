import Link from "next/link";
import { Button } from "@/components/ui/button";

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
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-white border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white shadow-md">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
