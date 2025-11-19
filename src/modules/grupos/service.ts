// src/modules/grupos/service.ts
import { http } from "../../shared/api/client";
import type { Group, Permission, CreateGroupInput, UpdateGroupInput } from "./types";

const BASE_URL = "/api/User/group/";
const PERMISSIONS_URL = "/api/User/permission/";

/**
 * Listar todos los grupos
 */
export async function listGroups(): Promise<Group[]> {
  try {
    const { data } = await http.get<{ value: Group[]; Count: number } | Group[]>(BASE_URL);
    
    // El backend puede devolver { value: [...], Count: n } o un array directo
    if (data && typeof data === 'object' && 'value' in data) {
      console.log("✅ Grupos cargados:", data.value.length);
      return data.value;
    }
    
    // Si es un array directo
    if (Array.isArray(data)) {
      console.log("✅ Grupos cargados:", data.length);
      return data;
    }
    
    console.warn("⚠️ Formato de respuesta inesperado:", data);
    return [];
  } catch (error) {
    console.error("❌ Error al listar grupos:", error);
    throw error;
  }
}

/**
 * Obtener un grupo específico por ID
 */
export async function getGroup(id: number): Promise<Group> {
  try {
    const { data } = await http.get<Group>(`${BASE_URL}${id}/`);
    return data;
  } catch (error) {
    console.error(`Error al obtener grupo ${id}:`, error);
    throw error;
  }
}

/**
 * Crear un nuevo grupo
 */
export async function createGroup(input: CreateGroupInput): Promise<Group> {
  try {
    // Preparar payload según documentación del backend (campos en español)
    const payload = {
      nombre: input.nombre.trim(),
      descripcion: input.descripcion || "",
      permisos: input.permisos || [],
      usuarios: input.usuarios || []
    };
    
    console.log("📤 URL:", BASE_URL);
    console.log("📤 Payload enviado:", JSON.stringify(payload, null, 2));
    
    const { data } = await http.post<Group>(BASE_URL, payload);
    console.log("✅ Grupo creado exitosamente:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al crear grupo:", error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown; status?: number; config?: { url?: string } } };
      console.error("📍 URL del error:", axiosError.response?.config?.url);
      console.error("📍 Status:", axiosError.response?.status);
      console.error("📍 Detalles del error:", axiosError.response?.data);
    }
    throw error;
  }
}

/**
 * Actualizar un grupo existente
 */
export async function updateGroup(id: number, input: UpdateGroupInput): Promise<Group> {
  try {
    const { data } = await http.put<Group>(`${BASE_URL}${id}/`, input);
    console.log("Grupo actualizado:", data);
    return data;
  } catch (error) {
    console.error(`Error al actualizar grupo ${id}:`, error);
    throw error;
  }
}

/**
 * Actualización parcial de un grupo (PATCH)
 */
export async function patchGroup(id: number, input: Partial<UpdateGroupInput>): Promise<Group> {
  try {
    const { data } = await http.patch<Group>(`${BASE_URL}${id}/`, input);
    console.log("Grupo actualizado parcialmente:", data);
    return data;
  } catch (error) {
    console.error(`Error al actualizar parcialmente grupo ${id}:`, error);
    throw error;
  }
}

/**
 * Eliminar un grupo
 */
export async function deleteGroup(id: number): Promise<void> {
  try {
    await http.delete(`${BASE_URL}${id}/`);
    console.log(`Grupo ${id} eliminado`);
  } catch (error) {
    console.error(`Error al eliminar grupo ${id}:`, error);
    throw error;
  }
}

/**
 * Listar todos los permisos disponibles
 */
export async function listPermissions(): Promise<Permission[]> {
  try {
    const { data } = await http.get<Permission[]>(PERMISSIONS_URL);
    console.log("✅ Permisos cargados:", Array.isArray(data) ? data.length : 0);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("❌ Error al listar permisos:", error);
    throw error;
  }
}
