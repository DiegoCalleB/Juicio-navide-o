import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AGE_COOKIE, GATE_COOKIE, ageStatus, gateEnabled, safeNext, sessionValid } from '@/lib/adultGate';
import { track } from '@/lib/metrics';
import { billingInfo } from '@/lib/billing';
import { EdadChispa } from '@/components/features/gate/EdadChispa';
import { CloseZone } from '@/components/features/gate/CloseZone';
import { MyRooms } from '@/components/features/royal-chat/MyRooms';
import { InstallApp } from '@/components/features/InstallApp';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#120c22' };
export const metadata: Metadata = { title: 'Acceso a la cuenta', robots: { index: false, follow: false } };

export default async function MayoresPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const open = !gateEnabled() || (await sessionValid((await cookies()).get(GATE_COOKIE)?.value));

  // Con la sesión abierta y un destino pedido (venía de /crear, /precios…), se le lleva allí sin parar en el menú.
  if (open && next && safeNext(next) !== '/mayores') redirect(safeNext(next));

  if (!open) {
    // Chispa pregunta la edad; quien dice ser menor se queda ahí. Quien dice ser mayor entra directo.
    const age = await ageStatus((await cookies()).get(AGE_COOKIE)?.value);
    if (age === 'ok') redirect(`/api/mayores/entrar?next=${encodeURIComponent(safeNext(next))}`);
    await track('mayores_edad', { src: 'web' });
    return (
      <main className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#120c22] px-6 py-10">
        <EdadChispa initialMinor={age === 'menor'} />
      </main>
    );
  }

  await track('mayores_cuenta', { src: 'web' });
  const billing = billingInfo();
  const items: { href: string; title: string; text: string }[] = [
    { href: '/prueba', title: 'Cómo funciona', text: 'Qué recibe tu peque, en 3 pasos, y por qué es privado.' },
    { href: '/crear', title: 'Abrir un portal', text: 'Abre el portal para que tu peque hable con sus seres mágicos esta Navidad.' },
    { href: '/ideas-elfo', title: 'Ideas de trastadas del elfo', text: 'Las 24 noches, paso a paso.' },
    { href: '/ideas-elfo/sin-tiempo', title: 'Trastadas exprés', text: 'Para los días sin tiempo.' },
    ...(billing.enabled
      ? [{
          href: '/precios',
          title: billing.campaign ? `${billing.campaign.label} · Pase de Navidad ${billing.price}` : `Precios · Pase de Navidad ${billing.price}`,
          text: billing.campaign ? `Hasta el ${billing.campaign.until}. Prueba gratis 3 días.` : 'Prueba gratis 3 días.',
        }]
      : []),
  ];
  return (
    <main data-scroll-root className="fixed inset-0 z-40 overflow-y-auto bg-[#120c22] text-[#f3ecff]">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-8 lg:max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold">Zona de mayores</h1>
          <Link href="/" className="text-[13px] text-[#f3ecff]/60 underline underline-offset-2">Inicio</Link>
        </div>
        <p className="mt-1 text-[13.5px] text-[#f3ecff]/55">Se cierra sola tras 30 minutos sin usarla.</p>

        <div className="mt-6">
          <MyRooms />
        </div>

        <nav aria-label="Zona de mayores" className="mt-2 grid gap-2.5 lg:grid-cols-2">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="block rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3.5 hover:bg-white/[.07] active:scale-[0.99]">
              <span className="block text-[16px] font-semibold">{i.title}</span>
              <span className="mt-0.5 block text-[13px] text-[#f3ecff]/60">{i.text}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <InstallApp />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[13px] text-[#f3ecff]/55">
          <span className="space-x-4">
            <Link href="/privacidad" className="underline underline-offset-2">Privacidad</Link>
            <Link href="/terminos" className="underline underline-offset-2">Términos de uso</Link>
          </span>
          <CloseZone className="min-h-11 rounded-xl border border-white/20 px-4 font-semibold text-[#f3ecff]" />
        </div>
      </div>
    </main>
  );
}
