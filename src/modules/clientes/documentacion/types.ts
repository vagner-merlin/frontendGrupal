// src/modules/clientes/documentacion/types.ts

export interface Documentacion {
  id: number;
  ci: string;
  documento_url: string;
  fecha_registro: string;
  id_cliente: number;
}

export interface CreateDocumentacionInput {
  ci: string;
  documento_url: string;
  id_cliente: number;
}

export interface UpdateDocumentacionInput {
  ci?: string;
  documento_url?: string;
}

export interface ListDocumentacionParams {
  id_cliente?: number;
  page?: number;
  page_size?: number;
}

export interface DocumentacionPage {
  results: Documentacion[];
  count: number;
  next: string | null;
  previous: string | null;
}
