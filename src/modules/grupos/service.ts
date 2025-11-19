// src/modules/grupos/service.ts
import { http } from "../../shared/api/client";
import type { Group, Permission, CreateGroupInput, UpdateGroupInput } from "./types";

// Endpoints actualizados para Django auth groups
const BASE_URL = "/api/User/group/";
const PERMISSIONS_URL = "/api/User/permission/";

// Endpoint alternativo para Django's built-in groups
const DJANGO_GROUPS_URL = "/api/auth/group/";
const DJANGO_GROUPS_ALT_URL = "/api/groups/";

/**
 * Normaliza un grupo para usar siempre el formato esperado por el frontend
 */
function normalizeGroup(group: any): Group {
  return {
    id: group.id,
    nombre: group.nombre || group.name || "",
    name: group.name || group.nombre || "",
    empresa: group.empresa,
    empresa_nombre: group.empresa_nombre,
    descripcion: group.descripcion || group.description || "",
    description: group.description || group.descripcion || "",
    permisos: group.permisos || group.permissions || [],
    permissions: group.permissions || group.permisos || [],
    usuarios: group.usuarios || group.users || [],
    users: group.users || group.usuarios || [],
    total_usuarios: group.total_usuarios,
    total_permisos: group.total_permisos,
    fecha_creacion: group.fecha_creacion
  };
}

/**
 * Listar todos los grupos
 * Intenta múltiples endpoints para encontrar el correcto
 */
export async function listGroups(): Promise<Group[]> {
  console.log("🔍 [SERVICE] Iniciando listGroups()");
  
  // Lista de endpoints a probar
  const endpoints = [BASE_URL, DJANGO_GROUPS_URL, DJANGO_GROUPS_ALT_URL];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 [SERVICE] Probando endpoint: ${endpoint}`);
      const { data } = await http.get<{ value: Group[]; Count: number } | Group[]>(endpoint);
      
      console.log(`📦 [SERVICE] Respuesta recibida de ${endpoint}:`, data);
      console.log(`📦 [SERVICE] Tipo de respuesta:`, typeof data);
      console.log(`📦 [SERVICE] Es array?:`, Array.isArray(data));
      console.log(`📦 [SERVICE] Tiene propiedad 'value'?:`, data && typeof data === 'object' && 'value' in data);
      
      let grupos: Group[] = [];
      
      // El backend puede devolver { value: [...], Count: n } o un array directo
      if (data && typeof data === 'object' && 'value' in data) {
        console.log(`✅ [SERVICE] Formato value detectado desde ${endpoint}, cantidad:`, data.value.length);
        grupos = data.value;
      } else if (Array.isArray(data)) {
        console.log(`✅ [SERVICE] Array directo detectado desde ${endpoint}, cantidad:`, data.length);
        grupos = data;
      } else {
        console.warn(`⚠️ [SERVICE] Formato de respuesta inesperado desde ${endpoint}:`, data);
        continue;
      }
      
      console.log(`🔄 [SERVICE] Normalizando ${grupos.length} grupos...`);
      
      // Normalizar grupos para usar formato consistente
      const gruposNormalizados = grupos.map(normalizeGroup);
      
      console.log(`✅ [SERVICE] Grupos normalizados:`, gruposNormalizados);
      
      return gruposNormalizados;
      
    } catch (error) {
      console.warn(`⚠️ [SERVICE] Error con endpoint ${endpoint}:`, error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string } };
        console.warn(`📍 [SERVICE] Status HTTP:`, axiosError.response?.status);
        console.warn(`📍 [SERVICE] Status Text:`, axiosError.response?.statusText);
        console.warn(`📍 [SERVICE] Data:`, axiosError.response?.data);
      }
      // Continuar con el siguiente endpoint
      continue;
    }
  }
  
  // Si ningún endpoint funcionó, lanzar error
  console.error("❌ [SERVICE] No se pudo cargar grupos desde ningún endpoint");
  console.error("❌ [SERVICE] Endpoints probados:", endpoints);
  return [];
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
