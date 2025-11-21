export interface Mensaje {
  id: number;
  rol: 'user' | 'assistant' | 'system';
  contenido: string;
  metadata?: any;
  fecha_creacion: string;
}

export interface Conversacion {
  id: number;
  titulo: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activa: boolean;
  mensajes?: Mensaje[];
  ultimo_mensaje?: {
    contenido: string;
    rol: string;
    fecha: string;
  };
  cantidad_mensajes?: number;
}

export interface ChatRequest {
  mensaje: string;
  conversacion_id?: number;
  nuevo_chat?: boolean;
}

export interface ChatResponse {
  conversacion_id: number;
  mensaje_usuario: Mensaje;
  mensaje_asistente: Mensaje;
  respuesta: string;
}
