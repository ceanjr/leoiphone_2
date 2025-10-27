export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    }>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, string | number>
    CompositeTypes: Record<string, unknown>
  }
}
