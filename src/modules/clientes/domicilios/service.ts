// src/modules/clientes/domicilios/service.ts
import { http } from "../../../shared/api/client";
import type { Domicilio, CreateDomicilioInput, UpdateDomicilioInput, ListDomiciliosParams, DomiciliosPage } from "./types";

const BASE_URL = "/api/Clientes/domicilios/";

/**
 * Listar domicilios (con filtro opcional por cliente)
 */
export async function listDomicilios(params?: ListDomiciliosParams): Promise<DomiciliosPage> {
  console.log("📋 [DOMICILIOS] GET", BASE_URL, params);
  
  const { data } = await http.get<Domicilio[] | DomiciliosPage>(BASE_URL, { params });
  
  // Si el backend devuelve array directo, lo convertimos a formato paginado
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
 * Obtener domicilio por ID
 */
export async function getDomicilioById(id: number): Promise<Domicilio> {
  console.log(`📋 [DOMICILIOS] GET ${BASE_URL}/${id}/`);
  const { data } = await http.get<Domicilio>(`${BASE_URL}/${id}/`);
  return data;
}

/**
 * Crear domicilio
 */
export async function createDomicilio(input: CreateDomicilioInput): Promise<Domicilio> {
  console.log("✨ [DOMICILIOS] POST", BASE_URL, input);
  const { data } = await http.post<Domicilio>(BASE_URL, input);
  console.log("✅ [DOMICILIOS] Creado:", data);
  return data;
}

/**
 * Actualizar domicilio
 */
export async function updateDomicilio(id: number, input: UpdateDomicilioInput): Promise<Domicilio> {
  console.log(`✏️ [DOMICILIOS] PUT ${BASE_URL}/${id}/`, input);
  const { data } = await http.put<Domicilio>(`${BASE_URL}/${id}/`, input);
  console.log("✅ [DOMICILIOS] Actualizado:", data);
  return data;
}

/**
 * Eliminar domicilio
 */
export async function deleteDomicilio(id: number): Promise<void> {
  console.log(`🗑️ [DOMICILIOS] DELETE ${BASE_URL}/${id}/`);
  await http.delete(`${BASE_URL}/${id}/`);
  console.log("✅ [DOMICILIOS] Eliminado");
}

/**
 * Obtener domicilios de un cliente específico
 */
export async function getDomiciliosByCliente(clienteId: number): Promise<Domicilio[]> {
  const response = await listDomicilios({ id_cliente: clienteId });
  return response.results;
}
