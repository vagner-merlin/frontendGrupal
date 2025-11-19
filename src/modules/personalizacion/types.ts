// Tipos para la configuración del sistema (HU9)

export interface Configuracion {
  id: number;
  empresa: number;
  color: string; // Formato hexadecimal #RRGGBB
  tipo_letra: string; // Arial, Roboto, Helvetica, etc.
  enum_tema: "CLARO" | "OSCURO";
}

export interface ConfiguracionCreate {
  empresa: number;
  color: string;
  tipo_letra: string;
  enum_tema: "CLARO" | "OSCURO";
}

export interface ConfiguracionUpdate {
  empresa?: number;
  color?: string;
  tipo_letra?: string;
  enum_tema?: "CLARO" | "OSCURO";
}

export const FUENTES_DISPONIBLES = [
  "Arial",
  "Roboto",
  "Helvetica",
  "Open Sans",
  "Montserrat",
  "Inter",
  "Lato",
  "Poppins",
] as const;

export const TEMAS = {
  CLARO: "CLARO",
  OSCURO: "OSCURO",
} as const;
