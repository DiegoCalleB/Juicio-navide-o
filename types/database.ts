/** Tipos del esquema Supabase (mantener sincronizado con supabase/migrations). */
export interface Database {
  public: {
    Tables: {
      trials: {
        Row: {
          id: string;
          short_id: string;
          defendant_name: string;
          charge: string;
          sentence: string;
          photo_path: string | null;
          signature_count: number;
          creator_hash: string;
          created_at: string;
        };
        Insert: {
          short_id: string;
          defendant_name: string;
          charge: string;
          sentence: string;
          photo_path?: string | null;
          creator_hash: string;
        };
        Update: never;
        Relationships: [];
      };
      signatures: {
        Row: {
          id: string;
          trial_id: string;
          signer_name: string;
          fingerprint_hash: string;
          created_at: string;
        };
        Insert: {
          trial_id: string;
          signer_name: string;
          fingerprint_hash: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
