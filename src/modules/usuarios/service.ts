// Servicio de API para Usuarios - Backend Django
import { http } from "../../shared/api/client";
import type {
  ListUsersParams,
  Page,
  User,
  UserDTO,
  BackendPage,
  CreateUserPayload,
  CreateUserResponse,
  UpdateUserPayload,
} from "./types";

const BASE_URL = "/api/User/user/";
const CREATE_URL = "/api/User/create-user/";
const PERMISSIONS_URL = "/api/User/permission/";

const normalizePage = <T,>(
  raw: BackendPage<T> | T[],
  page: number,
  page_size: number
): { items: T[]; count: number; page: number; page_size: number } => {
  if (Array.isArray(raw)) {
    return { items: raw, count: raw.length, page, page_size };
  }
  const items = raw.results ?? raw.data ?? [];
  const count = raw.count ?? raw.total ?? items.length;
  const pg = raw.page ?? raw.current_page ?? page;
  const ps = raw.page_size ?? raw.per_page ?? page_size;
  return { items, count, page: pg, page_size: ps };
};

export async function createUser(userData: CreateUserPayload): Promise<CreateUserResponse> {
  console.log("📤 Creando usuario:", userData);
  try {
    const payload = {
      username: userData.username,
      password: userData.password || "defaultPassword123",
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      empresa_id: userData.empresa_id || 1,
      imagen_url: userData.imagen_url || userData.avatar || "",
    };
    console.log("📤 Payload enviado al backend:", payload);
    const { data } = await http.post<CreateUserResponse>(CREATE_URL, payload);
    console.log("✅ Usuario creado:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creando usuario:", error);
    throw error;
  }
}

export async function listUsers(params: ListUsersParams = {}): Promise<Page<User>> {
  const { search, activo = "all", page = 1, page_size = 10 } = params;
  try {
    const query: Record<string, unknown> = { page, page_size };
    if (search?.trim()) query.search = search.trim();
    if (activo !== "all") query.is_active = activo === true;

    const { data } = await http.get<BackendPage<UserDTO> | UserDTO[]>(BASE_URL, { params: query });
    const normalized = normalizePage<UserDTO>(data, page, page_size);

    const adaptedUsers = normalized.items.map((user) => ({
      id: user.id,
      nombre: user.first_name || user.username || 'Usuario',
      apellido: user.last_name || "", 
      username: user.username,
      email: user.email || "",
      telefono: user.telefono,
      role: mapDjangoRole(user),
      activo: user.is_active ?? user.active ?? true,
      last_login: user.last_login ?? undefined,
      created_at: user.created_at ?? undefined,
      empresa_id: user.empresa_id,
    }));

    return {
      results: adaptedUsers,
      count: normalized.count,
      page: normalized.page,
      page_size: normalized.page_size,
    };
  } catch (error) {
    console.error("❌ Error listando usuarios:", error);
    throw error;
  }
}

export async function getUser(id: number | string): Promise<UserDTO> {
  try {
    const { data } = await http.get<UserDTO>(`${BASE_URL}${id}/`);
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo usuario ${id}:`, error);
    throw error;
  }
}

export async function updateUser(id: number | string, userData: UpdateUserPayload): Promise<UserDTO> {
  try {
    // Preparar payload - mapear 'nombre' a first_name/last_name si viene como nombre completo
    const payload: Record<string, unknown> = {};
    
    if (userData.username) payload.username = userData.username;
    if (userData.email) payload.email = userData.email;
    if (userData.telefono) payload.telefono = userData.telefono;
    if (userData.role) payload.role = userData.role;
    
    // Si viene 'nombre' completo, dividir en first_name y last_name
    if (userData.nombre) {
      const nombreParts = userData.nombre.trim().split(' ');
      payload.first_name = nombreParts[0] || '';
      payload.last_name = nombreParts.slice(1).join(' ') || '';
    } else {
      if (userData.first_name) payload.first_name = userData.first_name;
      if (userData.last_name) payload.last_name = userData.last_name;
    }
    
    if (userData.groups) payload.groups = userData.groups;
    if (userData.user_permissions) payload.user_permissions = userData.user_permissions;
    
    const { data } = await http.put<UserDTO>(`${BASE_URL}${id}/`, payload);
    console.log("✅ Usuario actualizado:", data);
    return data;
  } catch (error) {
    console.error(`❌ Error actualizando usuario ${id}:`, error);
    throw error;
  }
}

export async function updateUserPermissions(id: number | string, permissions: number[]): Promise<UserDTO> {
  try {
    const { data } = await http.put<UserDTO>(`${BASE_URL}${id}/`, {
      user_permissions: permissions,
    });
    return data;
  } catch (error) {
    console.error(`❌ Error asignando permisos:`, error);
    throw error;
  }
}

export async function listPermissions(): Promise<Array<{ id: number; name: string; codename: string }>> {
  try {
    const { data } = await http.get<Array<{ id: number; name: string; codename: string }>>(PERMISSIONS_URL);
    return data;
  } catch (error) {
    console.error("❌ Error obteniendo permisos:", error);
    throw error;
  }
}

export async function deleteUser(id: number | string): Promise<void> {
  try {
    await http.delete(`${BASE_URL}${id}/`);
  } catch (error) {
    console.error(`❌ Error eliminando usuario:`, error);
    throw error;
  }
}

function mapDjangoRole(user: UserDTO): User["role"] {
  if (user.is_superuser) return "superadmin";
  if (user.is_staff) return "administrador";
  if (user.global_roles?.includes("gerente")) return "gerente";
  if (user.global_roles?.includes("contador")) return "contador";
  return "usuario";
}

export async function getUserHistory(userId: number | string): Promise<unknown[]> {
  try {
    const { data } = await http.get(`${BASE_URL}${userId}/history/`);
    return data || [];
  } catch (error) {
    console.warn(`No se pudo obtener historial:`, error);
    return [];
  }
}

export async function toggleUserStatus(id: number | string, isActive: boolean): Promise<UserDTO> {
  try {
    const { data } = await http.patch<UserDTO>(`${BASE_URL}${id}/`, { is_active: isActive });
    return data;
  } catch (error) {
    console.error(`❌ Error cambiando estado:`, error);
    throw error;
  }
}

// Alias para compatibilidad con código existente
export const setUserActive = toggleUserStatus;
