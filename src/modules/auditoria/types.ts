// src/modules/auditoria/types.ts

/**
 * Log de auditoría según el modelo Django LogEntry
 */
export interface AdminLog {
  id: number;
  action_time: string;
  user: {
    id: number;
    username: string;
  };
  content_type: {
    id: number;
    model: string;
  } | null;
  object_id: string | null;
  object_repr: string;
  action_flag: number; // 1=Added, 2=Changed, 3=Deleted
  change_message: string;
  action_description: string; // "Added", "Changed", "Deleted"
}

/**
 * Parámetros para listar logs
 */
export interface ListLogsParams {
  user_id?: number;
  action_flag?: number; // 1=Added, 2=Changed, 3=Deleted
  content_type?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

/**
 * Respuesta paginada de logs
 */
export interface LogsPage {
  results: AdminLog[];
  count: number;
  next: string | null;
  previous: string | null;
  page?: number;
  page_size?: number;
}
