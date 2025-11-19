import { createContext } from 'react';

export interface ClienteData {
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

export interface ClienteContextType {
  clienteId: number | null;
  setClienteId: (id: number | null) => void;
  pasoActual: number;
  setPasoActual: (paso: number) => void;
  pasoCompletado: (paso: number) => boolean;
  marcarPasoCompletado: (paso: number) => void;
  resetearFlujo: () => void;
  clienteData: ClienteData;
  setClienteData: (data: ClienteData) => void;
}

export const ClienteContext = createContext<ClienteContextType | undefined>(undefined);
