export interface Empresa {
  id: number;
  razon_social: string;
  nombre_comercial: string;
  email_contacto?: string;
  fecha_registro?: string; // ISO
  activo?: boolean;
  Imagen_url?: string | null; // Backend usa Imagen_url con mayúscula
  imagen_url?: string | null; // Alternativa en minúscula
}

// Tipo local para suscripciones (puedes extender según respuesta del backend)
export interface Suscripcion {
  id: number;
  empresa: number;
  enum_plan: string;
  enum_estado?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  precio_usd?: number | null;
  meta?: Record<string, unknown>;
}