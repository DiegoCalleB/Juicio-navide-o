import { redirect } from 'next/navigation';

/** Ruta antigua: la Mensajería Real vive ahora en la portada. */
export default function ReyesPage() {
  redirect('/');
}
