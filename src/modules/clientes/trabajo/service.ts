// src/modules/clientes/trabajo/service.ts
import { http } from "../../../shared/api/client";
import type { Trabajo, CreateTrabajoInput, UpdateTrabajoInput, ListTrabajosParams, TrabajosPage } from "./types";

const BASE_URL = "/api/Clientes/trabajo/";

/**
 * Listar trabajos (con filtro opcional por cliente)
 */
export async function listTrabajos(params?: ListTrabajosParams): Promise<TrabajosPage> {
  console.log("💼 [TRABAJOS] GET", BASE_URL, params);
  
  const { data } = await http.get<Trabajo[] | TrabajosPage>(BASE_URL, { params });
  
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
 * Obtener trabajo por ID
 */
export async function getTrabajoById(id: number): Promise<Trabajo> {
  console.log(`💼 [TRABAJOS] GET ${BASE_URL}/${id}/`);
  const { data } = await http.get<Trabajo>(`${BASE_URL}/${id}/`);
  return data;
}

/**
 * Crear trabajo
 */
export async function createTrabajo(input: CreateTrabajoInput): Promise<Trabajo> {
  console.log("✨ [TRABAJOS] POST", BASE_URL, input);
  const { data } = await http.post<Trabajo>(BASE_URL, input);
  console.log("✅ [TRABAJOS] Creado:", data);
  return data;
}

/**
 * Actualizar trabajo
 */
export async function updateTrabajo(id: number, input: UpdateTrabajoInput): Promise<Trabajo> {
  console.log(`✏️ [TRABAJOS] PUT ${BASE_URL}/${id}/`, input);
  const { data } = await http.put<Trabajo>(`${BASE_URL}/${id}/`, input);
  console.log("✅ [TRABAJOS] Actualizado:", data);
  return data;
}

/**
 * Eliminar trabajo
 */
export async function deleteTrabajo(id: number): Promise<void> {
  console.log(`🗑️ [TRABAJOS] DELETE ${BASE_URL}/${id}/`);
  await http.delete(`${BASE_URL}/${id}/`);
  console.log("✅ [TRABAJOS] Eliminado");
}

/**
 * Obtener trabajos de un cliente específico
 */
export async function getTrabajosByCliente(clienteId: number): Promise<Trabajo[]> {
  const response = await listTrabajos({ id_cliente: clienteId });
  return response.results;
}
