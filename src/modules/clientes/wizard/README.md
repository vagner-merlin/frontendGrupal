# 🎯 Wizard de Registro de Cliente y Crédito

## 📋 Descripción

Sistema completo de registro de clientes y solicitud de créditos siguiendo el flujo del Sprint 3 (HU12-HU17).

## 🔄 Flujo de Pasos

```
1. Cliente (HU12)          → Registrar datos personales
2. Documentación (HU13)    → Registrar CI y documentos
3. Trabajo (HU14)          → Registrar información laboral
4. Domicilio (HU15)        → Registrar dirección
5. Tipos Crédito (HU17)    → Seleccionar tipo de crédito
6. Crear Crédito (HU16)    → Solicitar crédito
```

## 📁 Estructura de Archivos

```
clientes/
├── context/
│   ├── ClienteContext.tsx    # Provider del contexto
│   ├── useCliente.ts          # Hook personalizado
│   └── index.ts               # Exports
├── components/
│   ├── WizardSteps.tsx        # Barra de progreso visual
│   └── index.ts
├── wizard/
│   ├── ClienteWizard.tsx                 # Contenedor principal
│   ├── CrearClienteStep.tsx              # Paso 1: Cliente
│   ├── CrearDocumentacionStep.tsx        # Paso 2: Documentación
│   ├── CrearTrabajoStep.tsx              # Paso 3: Trabajo
│   ├── CrearDomicilioStep.tsx            # Paso 4: Domicilio
│   ├── SeleccionarTipoCreditoStep.tsx    # Paso 5: Tipo Crédito
│   ├── CrearCreditoStep.tsx              # Paso 6: Crear Crédito
│   └── index.ts
├── documentacion/
│   ├── service.ts    # API de documentación
│   └── types.ts
├── trabajo/
│   ├── service.ts    # API de trabajo
│   └── types.ts
└── domicilios/
    ├── service.ts    # API de domicilios
    └── types.ts
```

## 🚀 Uso

### Acceso al Wizard

Desde el historial de clientes:
```
/app/clientes → Click en "🎯 Registrar Cliente + Crédito"
```

O directamente:
```
/app/clientes/wizard
```

### Implementación en Código

```typescript
import { ClienteWizard } from '@/modules/clientes/wizard';

// En las rutas
{
  path: "clientes/wizard",
  element: <ClienteWizard />
}
```

## ✨ Características

- ✅ **Validación en cada paso**: No permite avanzar sin completar correctamente
- ✅ **Navegación bidireccional**: Botón "Volver" en todos los pasos
- ✅ **Estado persistente**: Mantiene los datos del cliente entre pasos
- ✅ **Progreso visual**: Barra de progreso con 6 pasos
- ✅ **Auto-asignación**: empresa y usuario se asignan automáticamente
- ✅ **Relaciones OneToOne**: Un cliente = una documentación = un trabajo = un domicilio
- ✅ **Multi-tenancy**: Cada empresa solo ve sus propios datos
- ✅ **Mensajes claros**: Errores específicos y confirmaciones
- ✅ **Animaciones**: Feedback visual con animaciones suaves

## 📡 APIs Utilizadas

Todos los endpoints requieren autenticación con token y terminan en `/`:

### HU12 - Cliente
```
POST /api/Clientes/clientes/
```

### HU13 - Documentación
```
POST /api/Clientes/documentacion/
```

### HU14 - Trabajo
```
POST /api/Clientes/trabajo/
```

### HU15 - Domicilio
```
POST /api/Clientes/domicilios/
```

### HU17 - Tipos de Crédito
```
GET /api/Creditos/tipo-creditos/
```

### HU16 - Crédito
```
POST /api/Creditos/creditos/
```

## 🎨 Componentes Reutilizables

### ClienteProvider

```typescript
import { ClienteProvider, useCliente } from '@/modules/clientes/context';

// Envolver tu aplicación
<ClienteProvider>
  <TuComponente />
</ClienteProvider>

// Usar en componentes hijos
const { clienteId, pasoActual, setPasoActual } = useCliente();
```

### WizardSteps

```typescript
import { WizardSteps } from '@/modules/clientes/components';

<WizardSteps onPasoClick={(paso) => setPasoActual(paso)} />
```

## 🔧 Configuración

### Context API

El wizard usa Context API para compartir estado entre pasos:

```typescript
interface ClienteContextType {
  clienteId: number | null;
  pasoActual: number;
  clienteData: ClienteData;
  pasoCompletado: (paso: number) => boolean;
  marcarPasoCompletado: (paso: number) => void;
  resetearFlujo: () => void;
}
```

### LocalStorage

Se usa para persistir el tipo de crédito seleccionado:

```typescript
localStorage.setItem('tipo_credito_seleccionado', JSON.stringify(tipo));
```

## 🎯 Validaciones

### Paso 1 - Cliente
- Nombre: requerido
- Apellido: requerido
- Teléfono: requerido (formato: +591 ...)

### Paso 2 - Documentación
- CI: requerido (solo números)
- URL documento: requerido (formato URL válido)

### Paso 3 - Trabajo
- Cargo: requerido
- Empresa: requerido
- Salario: requerido (número > 0)
- Ubicación: requerido
- URL extracto: requerido (formato URL válido)
- Descripción: requerido

### Paso 4 - Domicilio
- Descripción: requerido (dirección completa)
- URL croquis: requerido (formato URL válido)
- Tipo: requerido (Propietario/Alquiler)
- Número referencia: requerido

### Paso 5 - Tipo Crédito
- Selección: requerido (click en tarjeta)

### Paso 6 - Crédito
- Monto: requerido (dentro del rango del tipo)
- Tasa: requerido (0-100%)
- Plazo: requerido (1-360 meses)
- Moneda: requerido (USD/BOB)

## 🐛 Manejo de Errores

Cada paso captura y muestra errores específicos:

```typescript
try {
  const resultado = await createCliente(form);
  setSuccess("✅ Cliente creado exitosamente");
} catch (err) {
  setError((err as Error).message || "Error al crear el cliente");
}
```

## 🎨 Estilos

Usa los estilos globales de `theme.css`:

- `.ui-card`: Tarjetas principales
- `.ui-input`: Campos de entrada
- `.ui-btn`: Botones
- `.ui-select`: Selectores
- Animaciones: `shake`, `slideInDown`

## 📱 Responsive

El wizard es completamente responsive:
- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: hasta 3 columnas (grid adaptativo)

## 🔄 Flujo Completo

1. Usuario hace click en "Registrar Cliente + Crédito"
2. Se muestra la barra de progreso con 6 pasos
3. Paso 1: Ingresa datos del cliente → Se crea en BD → Avanza automáticamente
4. Paso 2: Ingresa documentación → Se vincula al cliente → Avanza
5. Paso 3: Ingresa datos laborales → Se vincula al cliente → Avanza
6. Paso 4: Ingresa domicilio → Se vincula al cliente → Avanza
7. Paso 5: Selecciona tipo de crédito → Se guarda selección → Avanza
8. Paso 6: Configura crédito → Se crea con todos los datos → Redirige a historial
9. El crédito aparece inmediatamente en la lista

## ✅ Checklist de Implementación

- [x] Context para estado global
- [x] 6 componentes de pasos
- [x] Barra de progreso visual
- [x] Validaciones en cada paso
- [x] Navegación bidireccional
- [x] Manejo de errores
- [x] Mensajes de éxito
- [x] Loading states
- [x] Responsive design
- [x] Integración con APIs
- [x] Redirección final
- [x] Limpieza de estado
