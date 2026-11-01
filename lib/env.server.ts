import 'server-only';
import { z } from 'zod';

export const serverEnv = z
  .object({ FINGERPRINT_SALT: z.string().min(16) })
  .parse({ FINGERPRINT_SALT: process.env.FINGERPRINT_SALT });
