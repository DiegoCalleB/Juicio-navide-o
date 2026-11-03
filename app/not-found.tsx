import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="my-auto space-y-4 text-center">
      <h1 className="text-2xl font-extrabold">Este enlace no existe</h1>
      <p className="text-court-snow/70">Puede que esté mal copiado o que haya caducado.</p>
      <Link href="/" className="inline-flex min-h-12 items-center rounded-2xl bg-court-gold px-5 font-bold text-court-bg">
        Ir al inicio
      </Link>
    </div>
  );
}
