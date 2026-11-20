-- Limpieza de seguridad: el esquema inicial («trials», «signatures», bucket público «evidence») ya no lo usa la app
-- y dejaba escritura anónima (tablas y subida de ficheros) con la clave pública. REVISAR ANTES DE APLICAR:
-- borra datos. Comprobar en el panel que no hay nada que conservar.
drop policy if exists evidence_insert_public on storage.objects;
drop table if exists public.signatures cascade;
drop table if exists public.trials cascade;
drop function if exists public.trials_rate_limit();
drop function if exists public.signatures_rate_limit();
drop function if exists public.bump_signature_count();
-- El bucket 'evidence' se vacía y se borra desde el panel de Storage (Supabase no permite borrarlo con SQL).
update storage.buckets set public = false where id = 'evidence';
