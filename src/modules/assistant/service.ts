import { http } from "../../shared/api/client";
import type { Conversacion, ChatRequest, ChatResponse, Mensaje } from "./types";

const BASE_URL = "/api/assistant/";

/**
 * Enviar mensaje al asistente
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  console.log("💬 [ASSISTANT] POST chat/", request);
  const { data } = await http.post<ChatResponse>(`${BASE_URL}chat/`, request);
  console.log("✅ [ASSISTANT] Respuesta:", data);
  return data;
}

/**
 * Listar conversaciones del usuario
 */
export async function listConversaciones(): Promise<Conversacion[]> {
  console.log("📋 [ASSISTANT] GET conversaciones/");
  const { data } = await http.get<Conversacion[]>(`${BASE_URL}conversaciones/`);
  console.log("✅ [ASSISTANT] Conversaciones:", data);
  return data;
}

/**
 * Obtener historial de una conversación
 */
export async function getHistorial(conversacionId: number): Promise<Conversacion> {
  console.log(`📜 [ASSISTANT] GET ${conversacionId}/historial/`);
  const { data } = await http.get<Conversacion>(`${BASE_URL}${conversacionId}/historial/`);
  console.log("✅ [ASSISTANT] Historial:", data);
  return data;
}

/**
 * Eliminar conversación
 */
export async function deleteConversacion(conversacionId: number): Promise<void> {
  console.log(`🗑️ [ASSISTANT] DELETE ${conversacionId}/`);
  await http.delete(`${BASE_URL}${conversacionId}/`);
  console.log("✅ [ASSISTANT] Conversación eliminada");
}
