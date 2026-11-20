-- PIN de los padres (bloqueo del panel). Solo se guardan huellas (scrypt con sal), nunca el PIN ni el código de rescate.
-- Formato: scrypt$<sal base64>$<huella base64>. Las salas de una familia comparten PIN.
alter table public.rooms
  add column if not exists parent_pin text check (parent_pin is null or char_length(parent_pin) between 20 and 300),
  add column if not exists pin_recovery text check (pin_recovery is null or char_length(pin_recovery) between 20 and 300);
