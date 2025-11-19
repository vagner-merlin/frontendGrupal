import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { ClienteContext } from './context';
import type { ClienteData } from './context';

export const ClienteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasosCompletados, setPasosCompletados] = useState<Set<number>>(new Set());
  const [clienteData, setClienteData] = useState<ClienteData>({});

  const pasoCompletado = (paso: number): boolean => {
    return pasosCompletados.has(paso);
  };

  const marcarPasoCompletado = (paso: number) => {
    setPasosCompletados(prev => new Set([...prev, paso]));
  };

  const resetearFlujo = () => {
    setClienteId(null);
    setPasoActual(1);
    setPasosCompletados(new Set());
    setClienteData({});
  };

  return (
    <ClienteContext.Provider
      value={{
        clienteId,
        setClienteId,
        pasoActual,
        setPasoActual,
        pasoCompletado,
        marcarPasoCompletado,
        resetearFlujo,
        clienteData,
        setClienteData,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
};
