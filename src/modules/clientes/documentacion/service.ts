// src/modules/clientes/documentacion/service.ts
import { http } from "../../../shared/api/client";
import type { Documentacion, CreateDocumentacionInput, UpdateDocumentacionInput, ListDocumentacionParams, DocumentacionPage } from "./types";

const BASE_URL = "/api/Clientes/documentacion/";

/**
 * Listar documentación (con filtro opcional por cliente)
 */
export async function listDocumentacion(params?: ListDocumentacionParams): Promise<DocumentacionPage> {
  console.log("📄 [DOCUMENTACION] GET", BASE_URL, params);
  
  const { data } = await http.get<Documentacion[] | DocumentacionPage>(BASE_URL, { params });
  
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null
    };
  }
  
  return data;
}

/**
 * Obtener documentación por ID
 */
export async function getDocumentacionById(id: number): Promise<Documentacion> {
  console.log(`📄 [DOCUMENTACION] GET ${BASE_URL}/${id}/`);
  const { data } = await http.get<Documentacion>(`${BASE_URL}/${id}/`);
  return data;
}

/**
 * Crear documentación
 */
export async function createDocumentacion(input: CreateDocumentacionInput): Promise<Documentacion> {
  console.log("✨ [DOCUMENTACION] POST", BASE_URL, input);
  const { data } = await http.post<Documentacion>(BASE_URL, input);
  console.log("✅ [DOCUMENTACION] Creado:", data);
  return data;
}

/**
 * Actualizar documentación
 */
export async function updateDocumentacion(id: number, input: UpdateDocumentacionInput): Promise<Documentacion> {
  console.log(`✏️ [DOCUMENTACION] PUT ${BASE_URL}/${id}/`, input);
  const { data } = await http.put<Documentacion>(`${BASE_URL}/${id}/`, input);
  console.log("✅ [DOCUMENTACION] Actualizado:", data);
  return data;
}

/**
 * Eliminar documentación
 */
export async function deleteDocumentacion(id: number): Promise<void> {
  console.log(`🗑️ [DOCUMENTACION] DELETE ${BASE_URL}/${id}/`);
  await http.delete(`${BASE_URL}/${id}/`);
  console.log("✅ [DOCUMENTACION] Eliminado");
}

/**
 * Obtener documentación de un cliente específico
 */
export async function getDocumentacionByCliente(clienteId: number): Promise<Documentacion[]> {
  const response = await listDocumentacion({ id_cliente: clienteId });
  return response.results;
}
