import { http } from "../../../shared/api/client";
import type { AxiosError } from "axios";
import type { 
  TipoCredito, 
  CreateTipoCreditoInput, 
  UpdateTipoCreditoInput, 
  ListTiposCreditoParams, 
  TiposCreditoPage 
} from "./types";

// ✅ URL según documentación HU10: /api/Creditos/tipo-creditos/
const BASE_URL = "/api/Creditos/tipo-creditos/";

/**
 * Crear un nuevo tipo de crédito
 * POST /api/Creditos/tipo-creditos/
 */
export async function createTipoCredito(data: CreateTipoCreditoInput): Promise<TipoCredito> {
  try {
    const payload = {
      nombre: String(data.nombre).trim(),
      descripcion: String(data.descripcion).trim(),
      monto_minimo: Number(data.monto_minimo),
      monto_maximo: Number(data.monto_maximo)
    };
    
    console.log("📤 [HU10] POST", BASE_URL, payload);
    
    const response = await http.post<TipoCredito>(BASE_URL, payload);
    
    console.log("✅ [HU10] Tipo crédito creado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [HU10] Error creating tipo credito:", error);
    
    // Mostrar detalles del error para debug
    const err = error as AxiosError;
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
      
      // Extraer mensaje de error específico del backend
      const errorData = err.response.data as Record<string, unknown>;
      const errorMsg = errorData?.detail 
        || errorData?.message 
        || JSON.stringify(err.response.data);
      throw new Error(`Error al crear tipo de crédito: ${errorMsg}`);
    }
    
    throw new Error("No se pudo crear el tipo de crédito. Verifica tu conexión.");
  }
}

 /**
 * HU10: Tipos de Crédito - Documentación API
 * 
 * Base URL: http://127.0.0.1:8000/api/Creditos/tipo-creditos/
 *
 * Endpoints disponibles:
 * - GET    /api/Creditos/tipo-creditos/     → Listar todos
 * - GET    /api/Creditos/tipo-creditos/{id}/ → Obtener por ID
 * - POST   /api/Creditos/tipo-creditos/     → Crear nuevo
 * - PUT    /api/Creditos/tipo-creditos/{id}/ → Actualizar completo
 * - PATCH  /api/Creditos/tipo-creditos/{id}/ → Actualizar parcial
 * - DELETE /api/Creditos/tipo-creditos/{id}/ → Eliminar
 *
 * Ejemplo POST payload:
 * {
 *   "nombre": "Crédito Personal",
 *   "descripcion": "Crédito para personas naturales con tasa preferencial",
 *   "monto_minimo": 1000.00,
 *   "monto_maximo": 50000.00
 * }
 *
 * Ejemplo GET response:
 * [
 *   {
 *     "id": 1,
 *     "nombre": "Crédito Personal",
 *     "descripcion": "Crédito para personas naturales con tasa preferencial",
 *     "monto_minimo": "1000.00",
 *     "monto_maximo": "50000.00"
 *   }
 * ]
 */

/**
 * Listar tipos de crédito con soporte a paginación
 * GET /api/Creditos/tipo-creditos/
 */
export async function listTiposCredito(params: ListTiposCreditoParams = {}): Promise<TiposCreditoPage> {
  const { search, page = 1, page_size = 10 } = params;
  const query: Record<string, string | number> = { page, page_size };
  
  if (search && search.trim()) {
    query.search = search.trim();
  }

  try {
    console.log("📤 [HU10] GET", BASE_URL, "params:", query);
    const response = await http.get(BASE_URL, { params: query });
    const data = response.data;
    
    console.log("✅ [HU10] Response:", data);

    // Caso: backend devuelve un array simple
    if (Array.isArray(data)) {
      return {
        results: data,
        count: data.length,
        page,
        page_size
      };
    }

    // Caso: backend devuelve objeto con results/data y metadatos
    const results = data.results || data.data || [];
    const count = data.count || data.total || (Array.isArray(results) ? results.length : 0);

    return {
      results: Array.isArray(results) ? results : [],
      count,
      page,
      page_size
    };
  } catch (error) {
    console.error("❌ [HU10] Error fetching tipos credito:", error);
    
    const err = error as AxiosError;
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
    
    throw new Error("No se pudieron cargar los tipos de crédito. Verifica tu conexión.");
  }
}

/**
 * Obtener un tipo de crédito por ID
 * GET /api/Creditos/tipo-creditos/{id}/
 */
export async function getTipoCredito(id: number): Promise<TipoCredito> {
  try {
    console.log(`📤 [HU10] GET ${BASE_URL}${id}/`);
    const response = await http.get<TipoCredito>(`${BASE_URL}${id}/`);
    console.log("✅ [HU10] Tipo crédito obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [HU10] Error fetching tipo credito:", error);
    const err = error as AxiosError;
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
    throw new Error(`No se pudo cargar el tipo de crédito con ID ${id}`);
  }
}

/**
 * Actualizar un tipo de crédito (completo)
 * PUT /api/Creditos/tipo-creditos/{id}/
 */
export async function updateTipoCredito(data: UpdateTipoCreditoInput): Promise<TipoCredito> {
  try {
    const { id, ...updateData } = data;
    console.log(`📤 [HU10] PUT ${BASE_URL}${id}/`, updateData);
    const response = await http.put<TipoCredito>(`${BASE_URL}${id}/`, updateData);
    console.log("✅ [HU10] Tipo crédito actualizado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [HU10] Error updating tipo credito:", error);
    const err = error as AxiosError;
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
    throw new Error(`No se pudo actualizar el tipo de crédito con ID ${data.id}`);
  }
}

/**
 * Eliminar un tipo de crédito
 * DELETE /api/Creditos/tipo-creditos/{id}/
 */
export async function deleteTipoCredito(id: number): Promise<void> {
  try {
    console.log(`📤 [HU10] DELETE ${BASE_URL}${id}/`);
    await http.delete(`${BASE_URL}${id}/`);
    console.log("✅ [HU10] Tipo crédito eliminado exitosamente");
  } catch (error) {
    console.error("❌ [HU10] Error deleting tipo credito:", error);
    const err = error as AxiosError;
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
    throw new Error(`No se pudo eliminar el tipo de crédito con ID ${id}`);
  }
}

/* Validaciones cliente-side */
export function validateTipoCredito(data: CreateTipoCreditoInput): string[] {
  const errors: string[] = [];

  if (!data.nombre || !String(data.nombre).trim()) {
    errors.push("El nombre es obligatorio");
  }

  if (!data.descripcion || !String(data.descripcion).trim()) {
    errors.push("La descripción es obligatoria");
  }

  if (typeof data.monto_minimo !== "number" || Number(data.monto_minimo) <= 0) {
    errors.push("El monto mínimo debe ser mayor a 0");
  }

  if (typeof data.monto_maximo !== "number" || Number(data.monto_maximo) <= 0) {
    errors.push("El monto máximo debe ser mayor a 0");
  }

  if (Number(data.monto_maximo) <= Number(data.monto_minimo)) {
    errors.push("El monto máximo debe ser mayor al monto mínimo");
  }

  return errors;
}

/* Formatear montos */
export function formatMonto(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return String(amount);
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}