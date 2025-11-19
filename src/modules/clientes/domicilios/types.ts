// src/modules/clientes/domicilios/types.ts

export interface Domicilio {
  id: number;
  descripcion: string;
  croquis_url: string;
  es_propietario: boolean;
  numero_ref: string;
  id_cliente: number;
}

export interface CreateDomicilioInput {
  descripcion: string;
  croquis_url: string;
  es_propietario: boolean;
  numero_ref: string;
  id_cliente: number;
}

export interface UpdateDomicilioInput {
  descripcion?: string;
  croquis_url?: string;
  es_propietario?: boolean;
  numero_ref?: string;
}

export interface ListDomiciliosParams {
  id_cliente?: number;
  page?: number;
  page_size?: number;
}

export interface DomiciliosPage {
  results: Domicilio[];
  count: number;
  next: string | null;
  previous: string | null;
}
