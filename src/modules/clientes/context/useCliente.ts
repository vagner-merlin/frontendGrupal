import { useContext } from 'react';
import { ClienteContext } from './context';

export const useCliente = () => {
  const context = useContext(ClienteContext);
  if (context === undefined) {
    throw new Error('useCliente debe ser usado dentro de un ClienteProvider');
  }
  return context;
};
