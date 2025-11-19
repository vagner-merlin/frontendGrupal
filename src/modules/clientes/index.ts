// src/modules/clientes/index.ts
/**
 * Exportaciones centralizadas del módulo de clientes
 * Incluye todos los servicios relacionados: clientes, domicilios, trabajo y documentación
 */

// Servicio principal de clientes
export * from './service';
export * from './types';

// Componentes
export { default as ClientesPage } from './page';
export { default as HistorialClientesPage } from './historial';
export { default as CrearClientePage } from './crear_cliente';
export { default as VerClientePage } from './ver_cliente';
export { default as EditarClientePage } from './editar_cliente';

// Wizard (flujo completo de registro)
export { ClienteWizard } from './wizard';
export { ClienteProvider, useCliente } from './context';

// Sub-módulos
export * as Domicilios from './domicilios/service';
export * as DomiciliosTypes from './domicilios/types';

export * as Trabajo from './trabajo/service';
export * as TrabajoTypes from './trabajo/types';

export * as Documentacion from './documentacion/service';
export * as DocumentacionTypes from './documentacion/types';
