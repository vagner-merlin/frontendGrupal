// src/modules/grupos/types.ts

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type?: number;
}

export interface Group {
  id: number;
  nombre?: string; // Campo personalizado del backend
  name?: string;   // Campo estándar de Django auth.Group
  empresa?: number;
  empresa_nombre?: string;
  descripcion?: string;
  description?: string; // Alias
  permisos?: number[];
  permissions?: number[]; // Alias para permisos en inglés
  usuarios?: number[];
  users?: number[]; // Alias para usuarios en inglés
  total_usuarios?: number;
  total_permisos?: number;
  fecha_creacion?: string;
}

export interface CreateGroupInput {
  nombre: string;
  descripcion?: string;
  permisos?: number[];
  usuarios?: number[];
}

export interface UpdateGroupInput {
  nombre: string;
  descripcion?: string;
  permisos?: number[];
  usuarios?: number[];
}
