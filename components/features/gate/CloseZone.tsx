'use client';

/** Cierra la zona de mayores en este navegador (también se cierra sola tras 30 min sin uso). */
export function CloseZone({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/mayores/salir', { method: 'POST' }).catch(() => undefined);
        window.location.replace('/');
      }}
      className={className}
    >
      Cerrar la zona de mayores
    </button>
  );
}
