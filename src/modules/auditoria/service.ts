// src/modules/auditoria/service.ts
import { http } from "../../shared/api/client";
import type { AdminLog, ListLogsParams, LogsPage } from "./types";

const BASE_URL = "/api/User/admin-log/";

/**
 * Listar logs de auditoría
 */
export async function listAdminLogs(params?: ListLogsParams): Promise<LogsPage> {
  try {
    console.log("📤 [AUDITORIA] GET", BASE_URL, params);
    
    const queryParams: Record<string, string | number> = {};
    if (params?.user_id) queryParams.user_id = params.user_id;
    if (params?.action_flag) queryParams.action_flag = params.action_flag;
    if (params?.content_type) queryParams.content_type = params.content_type;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.page) queryParams.page = params.page;
    if (params?.page_size) queryParams.page_size = params.page_size;

    const { data } = await http.get<AdminLog[] | LogsPage>(BASE_URL, { params: queryParams });
    
    // Si el backend devuelve un array directo, convertirlo a formato paginado
    if (Array.isArray(data)) {
      console.log("✅ [AUDITORIA] Logs cargados:", data.length);
      return {
        results: data,
        count: data.length,
        next: null,
        previous: null,
        page: params?.page || 1,
        page_size: params?.page_size || data.length
      };
    }
    
    console.log("✅ [AUDITORIA] Logs cargados:", data.results?.length || 0);
    return data;
  } catch (error) {
    console.error("❌ [AUDITORIA] Error al cargar logs:", error);
    throw error;
  }
}

/**
 * Obtener logs de un usuario específico
 */
export async function getUserLogs(userId: number): Promise<AdminLog[]> {
  try {
    console.log("📤 [AUDITORIA] GET logs del usuario", userId);
    const response = await listAdminLogs({ user_id: userId });
    return response.results;
  } catch (error) {
    console.error(`❌ [AUDITORIA] Error al cargar logs del usuario ${userId}:`, error);
    throw error;
  }
}

/**
 * Mapea action_flag a descripción legible
 */
export function getActionDescription(actionFlag: number): string {
  switch (actionFlag) {
    case 1:
      return "Added";
    case 2:
      return "Changed";
    case 3:
      return "Deleted";
    default:
      return "Unknown";
  }
}

/**
 * Mapea action_flag a emoji
 */
export function getActionIcon(actionFlag: number): string {
  switch (actionFlag) {
    case 1:
      return "➕";
    case 2:
      return "✏️";
    case 3:
      return "🗑️";
    default:
      return "📝";
  }
}

/**
 * Mapea action_flag a color
 */
export function getActionColor(actionFlag: number): string {
  switch (actionFlag) {
    case 1:
      return "#10b981"; // verde
    case 2:
      return "#f59e0b"; // naranja
    case 3:
      return "#ef4444"; // rojo
    default:
      return "#6b7280"; // gris
  }
}
