'use client';

export function MetricasLogout() {
  return (
    <button
      type="button"
      className="text-[13px] text-white/60 underline underline-offset-2"
      onClick={async () => { await fetch('/api/metricas/entrar', { method: 'DELETE' }); location.reload(); }}
    >
      Salir
    </button>
  );
}
