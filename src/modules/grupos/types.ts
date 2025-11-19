// src/modules/grupos/types.ts

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type?: number;
}

export interface Group {
  id: number;
  nombre: string;
  empresa: number;
  empresa_nombre?: string;
  descripcion?: string;
  permisos: number[];
  usuarios?: number[];
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
