// src/modules/clientes/trabajo/types.ts

export interface Trabajo {
  id: number;
  cargo: string;
  empresa: string;
  extracto_url: string;
  salario: string | number;
  ubicacion: string;
  descripcion: string;
  id_cliente: number;
}

export interface CreateTrabajoInput {
  cargo: string;
  empresa: string;
  extracto_url: string;
  salario: number;
  ubicacion: string;
  descripcion: string;
  id_cliente: number;
}

export interface UpdateTrabajoInput {
  cargo?: string;
  empresa?: string;
  extracto_url?: string;
  salario?: number;
  ubicacion?: string;
  descripcion?: string;
}

export interface ListTrabajosParams {
  id_cliente?: number;
  page?: number;
  page_size?: number;
}

export interface TrabajosPage {
  results: Trabajo[];
  count: number;
  next: string | null;
  previous: string | null;
}
