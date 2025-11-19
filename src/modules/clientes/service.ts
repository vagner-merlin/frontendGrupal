import { http } from "../../shared/api/client";
import type {
  Cliente,
  CreateClienteInput,
  UpdateClienteInput,
  ListClientesParams,
  ClientesPage
} from "./types";

const BASE_URL = "/api/Clientes/clientes/"; // URL correcta según documentación backend

/**
 * Listado de clientes con búsqueda y paginación
 */
export async function listClientes(params: ListClientesParams = {}): Promise<ClientesPage> {
  try {
    const { search, page = 1, page_size = 10 } = params;
    const query: Record<string, string | number> = { page, page_size };
    if (search && search.trim()) {
      query.search = search.trim();
    }

    console.log("📤 [CLIENTES] GET", `${BASE_URL}/`, query);
    const response = await http.get(`${BASE_URL}/`, { params: query });
    const data = response.data;

    console.log("📦 Respuesta del backend:", data);

    // Caso: backend devuelve un array simple
    if (Array.isArray(data)) {
      const results: Cliente[] = data;
      console.log("✅ [CLIENTES] Cargados:", results.length);
      return {
        results,
        count: results.length,
        page,
        page_size
      };
    }

    // Caso: backend devuelve objeto con results y metadatos
    const results = data.results || data.data || [];
    const count = data.count || data.total || (Array.isArray(results) ? results.length : 0);

    console.log("✅ [CLIENTES] Cargados:", results.length, "de", count);
    return {
      results: Array.isArray(results) ? results : [],
      count,
      page,
      page_size
    };
  } catch (error) {
    console.error("❌ Error fetching clientes:", error);
    throw new Error("No se pudieron cargar los clientes");
  }
}

/**
 * Obtener cliente por ID
 */
export async function getCliente(id: number): Promise<Cliente> {
  try {
    console.log("📤 [CLIENTES] GET", `${BASE_URL}/${id}/`);
    const response = await http.get<Cliente>(`${BASE_URL}/${id}/`);
    console.log("✅ Cliente obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching cliente:", error);
    throw new Error("No se pudo cargar el cliente");
  }
}

/**
 * Crear nuevo cliente
 */
export async function createCliente(data: CreateClienteInput): Promise<Cliente> {
  try {
    console.log("📤 [CLIENTES] POST", BASE_URL, data);
    
    // Obtener empresa_id del localStorage
    const empresaId = localStorage.getItem('auth.tenant_id');
    if (!empresaId) {
      throw new Error("No se encontró la empresa del usuario");
    }
    
    // Según documentación: POST /api/Clientes/clientes/
    // Body: { nombre, apellido, telefono, empresa }
    const payload = {
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      empresa: parseInt(empresaId)
    };
    
    console.log("📦 Payload enviado:", payload);
    const response = await http.post<Cliente>(`${BASE_URL}/`, payload);
    console.log("✅ Cliente creado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating cliente:", error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      console.error("📍 Detalles del error:", axiosError.response?.data);
    }
    throw new Error("No se pudo crear el cliente");
  }
}

/**
 * Actualizar cliente existente
 */
export async function updateCliente(data: UpdateClienteInput): Promise<Cliente> {
  try {
    const { id, ...updateData } = data;
    console.log("📤 [CLIENTES] PUT", `${BASE_URL}/${id}/`, updateData);
    const response = await http.put<Cliente>(`${BASE_URL}/${id}/`, updateData);
    console.log("✅ Cliente actualizado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating cliente:", error);
    throw new Error("No se pudo actualizar el cliente");
  }
}

/**
 * Eliminar cliente
 */
export async function deleteCliente(id: number): Promise<void> {
  try {
    console.log("📤 [CLIENTES] DELETE", `${BASE_URL}/${id}/`);
    await http.delete(`${BASE_URL}/${id}/`);
    console.log("✅ Cliente eliminado");
  } catch (error) {
    console.error("❌ Error deleting cliente:", error);
    throw new Error("No se pudo eliminar el cliente");
  }
}

/**
 * Validaciones cliente-side
 */
export function validateCliente(data: CreateClienteInput): string[] {
  const errors: string[] = [];

  if (!data.nombre || !String(data.nombre).trim()) {
    errors.push("El nombre es obligatorio");
  }

  if (!data.apellido || !String(data.apellido).trim()) {
    errors.push("El apellido es obligatorio");
  }

  if (!data.telefono || !String(data.telefono).trim()) {
    errors.push("El teléfono es obligatorio");
  }

  // Validar formato de teléfono (básico)
  if (data.telefono && !/^\+?[\d\s()]{8,15}$/.test(data.telefono)) {
    errors.push("El formato del teléfono no es válido");
  }
  
  return errors;
}

/**
 * Formatear nombre completo
 */
export function formatNombreCompleto(cliente: Cliente): string {
  return `${cliente.nombre} ${cliente.apellido}`.trim();
}