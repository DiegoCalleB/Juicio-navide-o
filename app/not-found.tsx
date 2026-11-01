import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="my-auto space-y-4 text-center">
      <h1 className="text-2xl font-extrabold">Juicio no encontrado</h1>
      <p className="text-court-snow/70">Este caso no existe o ha sido archivado por Papá Noel.</p>
      <Link href="/" className="inline-flex min-h-12 items-center rounded-2xl bg-court-red px-5 font-bold">
        Abrir un juicio nuevo
      </Link>
    </div>
  );
}
