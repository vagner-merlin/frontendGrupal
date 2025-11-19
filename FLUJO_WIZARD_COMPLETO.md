# 🎯 Flujo Completo del Wizard de Créditos (HU12-HU17)

## 📋 Resumen Ejecutivo

El wizard es un flujo secuencial de 6 pasos que permite registrar:
1. Un **cliente** (HU12)
2. Su **documentación** (HU13)
3. Su información **laboral** (HU14)
4. Su **domicilio** (HU15)
5. Seleccionar un **tipo de crédito** (HU17)
6. Crear el **crédito** (HU16)

## 🏗️ Arquitectura

```
src/modules/clientes/
├── context/                          ← 📦 Estado Compartido
│   ├── context.ts                    - Definición del Context (Cliente, pasos)
│   ├── ClienteContext.tsx            - Provider con lógica de estado
│   ├── useCliente.ts                 - Hook para consumir el Context
│   └── index.ts                      - Exports limpios
│
├── components/                       ← 🎨 Componentes Visuales
│   ├── WizardSteps.tsx               - Barra de progreso (6 pasos)
│   └── index.ts
│
└── wizard/                           ← 🚀 Los 6 Pasos
    ├── ClienteWizard.tsx             - Contenedor principal
    ├── CrearClienteStep.tsx          - Paso 1 (HU12)
    ├── CrearDocumentacionStep.tsx    - Paso 2 (HU13)
    ├── CrearTrabajoStep.tsx          - Paso 3 (HU14)
    ├── CrearDomicilioStep.tsx        - Paso 4 (HU15)
    ├── SeleccionarTipoCreditoStep.tsx- Paso 5 (HU17)
    ├── CrearCreditoStep.tsx          - Paso 6 (HU16)
    └── index.ts
```

## 🔄 Flujo Paso a Paso

### **Paso 1: Crear Cliente (HU12)**
📂 `wizard/CrearClienteStep.tsx`

**Campos:**
- ✏️ Nombre (requerido)
- ✏️ Apellido (requerido)
- ✏️ Teléfono (requerido)

**API:**
```typescript
POST /api/Clientes/clientes/
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+591 70123456"
}
```

**Respuesta:**
```json
{
  "id": 123,
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+591 70123456",
  "fecha_registro": "2025-11-09T16:24:06Z"
}
```

**Qué hace:**
1. Valida que todos los campos estén llenos
2. Envía POST al backend
3. Guarda `cliente_id = 123` en el **Context**
4. Guarda datos del cliente en Context (para mostrar en header)
5. Marca Paso 1 como completado
6. Avanza automáticamente al **Paso 2**

---

### **Paso 2: Documentación (HU13)**
📂 `wizard/CrearDocumentacionStep.tsx`

**Campos:**
- ✏️ CI (Cédula de Identidad)
- ✏️ URL del documento escaneado

**API:**
```typescript
POST /api/Clientes/documentacion/
{
  "ci": "12345678",
  "documento_url": "https://storage.example.com/docs/ci-12345678.pdf",
  "id_cliente": 123  // ← Viene del Context (Paso 1)
}
```

**Qué hace:**
1. Usa `clienteId` del Context (guardado en Paso 1)
2. Valida CI y URL
3. Envía POST con `id_cliente`
4. Marca Paso 2 como completado
5. Avanza al **Paso 3**

**Navegación:**
- ⬅️ "Volver" → Regresa al Paso 1 (sin borrar datos)
- ➡️ "Guardar y Continuar" → Va al Paso 3

---

### **Paso 3: Información Laboral (HU14)**
📂 `wizard/CrearTrabajoStep.tsx`

**Campos:**
- ✏️ Cargo
- ✏️ Empresa
- ✏️ Salario (numérico)
- ✏️ Ubicación
- ✏️ Descripción (textarea)
- ✏️ URL del extracto bancario

**API:**
```typescript
POST /api/Clientes/trabajo/
{
  "cargo": "Ingeniero de Sistemas",
  "empresa": "TechCorp S.A.",
  "salario": 5000,
  "ubicacion": "La Paz, Bolivia",
  "descripcion": "Desarrollador full-stack con 5 años de experiencia",
  "extracto_url": "https://storage.example.com/bank/extracto-202511.pdf",
  "id_cliente": 123  // ← Del Context
}
```

**Qué hace:**
1. Valida que salario > 0
2. Envía POST con `id_cliente` del Context
3. Marca Paso 3 como completado
4. Avanza al **Paso 4**

---

### **Paso 4: Domicilio (HU15)**
📂 `wizard/CrearDomicilioStep.tsx`

**Campos:**
- ✏️ Descripción de la dirección (textarea)
- ✏️ URL del croquis/foto
- ✏️ ¿Es propietario? (select: Sí/No)
- ✏️ Número de referencia

**API:**
```typescript
POST /api/Clientes/domicilios/
{
  "descripcion": "Av. Arce #123, entre calle 14 y 15, zona San Jorge",
  "croquis_url": "https://storage.example.com/maps/croquis-123.jpg",
  "es_propietario": true,  // o false
  "numero_ref": "Ref-7890",
  "id_cliente": 123  // ← Del Context
}
```

**Qué hace:**
1. Muestra select con opciones visuales:
   - 🏠 Propietario (true)
   - 🏘️ Alquiler (false)
2. Envía POST con `id_cliente` del Context
3. Marca Paso 4 como completado
4. Avanza al **Paso 5**

---

### **Paso 5: Seleccionar Tipo de Crédito (HU17)**
📂 `wizard/SeleccionarTipoCreditoStep.tsx`

**API de consulta:**
```typescript
GET /api/Creditos/tipo-creditos/
```

**Respuesta:**
```json
{
  "results": [
    {
      "id": 1,
      "nombre": "Préstamo Personal",
      "descripcion": "Para gastos personales y familiares",
      "monto_minimo": 1000,
      "monto_maximo": 50000
    },
    {
      "id": 2,
      "nombre": "Crédito Vehicular",
      "descripcion": "Para compra de vehículos nuevos o usados",
      "monto_minimo": 10000,
      "monto_maximo": 200000
    }
  ]
}
```

**UI:**
- Muestra **tarjetas** en grid (2 columnas)
- Cada tarjeta tiene:
  - 💳 Nombre del tipo
  - 📝 Descripción
  - 💰 Rango de monto (min - max)
  - Estado: Gris (normal) → Verde con ✓ (seleccionado)

**Qué hace:**
1. Carga tipos disponibles del backend
2. Al hacer clic en una tarjeta:
   - Guarda `tipoSeleccionado` en **localStorage**
   - Marca Paso 5 como completado
   - Avanza al **Paso 6**

---

### **Paso 6: Crear Crédito (HU16)**
📂 `wizard/CrearCreditoStep.tsx`

**Pre-carga:**
- Lee `tipoSeleccionado` del localStorage (guardado en Paso 5)
- Muestra información del tipo seleccionado
- Valida montos según rangos del tipo

**Campos:**
- ✏️ Monto (validado entre min y max del tipo)
- ✏️ Tasa Anual (%) - default: 10.5
- ✏️ Plazo (meses) - default: 12
- ✏️ Moneda (select: USD/BOB) - default: BOB

**Preview en tiempo real:**
```
Monto solicitado: 10,000.00 BOB
Tasa anual: 10.5%
Plazo: 12 meses

→ Cuota mensual: 879.16 BOB
→ Total a pagar: 10,550.00 BOB
```

**Cálculos:**
```typescript
const montoCuota = Math.round((monto / plazo) * 100) / 100;
const montoPagar = Math.round((monto * (1 + (tasa/100) * (plazo/12))) * 100) / 100;
```

**API:**
```typescript
POST /api/Creditos/creditos/
{
  "Monto_Solicitado": 10000,
  "enum_estado": "SOLICITADO",
  "Numero_Cuotas": 12,
  "Monto_Cuota": 879.16,
  "Moneda": "BOB",
  "Tasa_Interes": 10.5,
  "Monto_Pagar": 10550.00,
  "empresa": 1,        // ← De localStorage
  "usuario": 5,        // ← De localStorage
  "cliente": 123,      // ← Del Context (Paso 1)
  "tipo_credito": 1    // ← De localStorage (Paso 5)
}
```

**Qué hace:**
1. Valida que monto esté en rango permitido
2. Calcula cuota y total
3. Auto-asigna empresa y usuario del localStorage
4. Usa cliente_id del Context
5. Usa tipo_credito del localStorage
6. Envía POST al backend
7. **Limpia localStorage** (borra tipoSeleccionado)
8. **Resetea el Context** (limpia cliente_id, pasos completados)
9. Redirige a `/app/creditos` (vista de lista)

---

## 🔑 Gestión de Estado

### **Context (Compartido entre pasos):**
```typescript
interface ClienteContextType {
  clienteId: number | null;           // ID del cliente creado en Paso 1
  pasoActual: number;                 // Paso actual (1-6)
  pasosCompletados: Set<number>;      // Set de pasos completados
  clienteData: ClienteData;           // {nombre, apellido, telefono}
  
  // Métodos
  setClienteId(id: number | null): void;
  setPasoActual(paso: number): void;
  pasoCompletado(paso: number): boolean;
  marcarPasoCompletado(paso: number): void;
  resetearFlujo(): void;
}
```

### **localStorage (Datos entre componentes):**
```typescript
// Guardado en Paso 5
localStorage.setItem('tipoSeleccionado', JSON.stringify({
  id: 1,
  nombre: "Préstamo Personal",
  monto_minimo: 1000,
  monto_maximo: 50000
}));

// Leído en Paso 6
const tipoSeleccionado = JSON.parse(localStorage.getItem('tipoSeleccionado'));

// Limpiado después de crear crédito
localStorage.removeItem('tipoSeleccionado');
```

---

## 🎨 Componente Visual: Barra de Progreso

📂 `components/WizardSteps.tsx`

**Muestra:**
```
[✓ 1] → [✓ 2] → [● 3] → [  4] → [  5] → [  6]
Cliente  Doc    Trabajo  Dom    Tipo    Crédito

Progreso: 3/6 (50%)
```

**Estados visuales:**
- ✅ **Completado** - Verde, checkmark ✓
- 🟢 **Activo** - Verde brillante, pulsando
- ⚪ **Disponible** - Blanco/gris claro (si pasos previos completos)
- 🔒 **Bloqueado** - Gris oscuro (pasos previos incompletos)

**Navegación:**
- Click en paso **completado** → Salta a ese paso
- Click en paso **activo** → No hace nada (ya estás ahí)
- Click en paso **bloqueado** → No hace nada (no puedes saltar)

---

## 🚀 Cómo Usar el Wizard

### **Opción 1: Desde Historial de Clientes**
1. Ir a `/app/clientes`
2. Click en "🎯 Registrar Cliente + Crédito"
3. Se abre el wizard en `/app/clientes/wizard`

### **Opción 2: Navegación Directa**
```
http://localhost:5173/app/clientes/wizard
```

### **Flujo Típico:**
1. Usuario llena Paso 1 (Cliente) → Click "Crear Cliente"
2. Sistema crea cliente, guarda ID, avanza a Paso 2
3. Usuario llena Paso 2 (Documentación) → Click "Guardar y Continuar"
4. Sistema asocia doc con cliente, avanza a Paso 3
5. Usuario llena Paso 3 (Trabajo) → Click "Continuar"
6. Sistema asocia trabajo con cliente, avanza a Paso 4
7. Usuario llena Paso 4 (Domicilio) → Click "Finalizar Datos Personales"
8. Sistema asocia domicilio, avanza a Paso 5
9. Usuario selecciona un tipo de crédito → Sistema avanza a Paso 6
10. Usuario llena monto, tasa, plazo → Click "Crear Crédito"
11. Sistema crea crédito, limpia estado, redirige a `/app/creditos`

---

## ✅ Validaciones

### **Paso 1:**
- ✓ Nombre no vacío
- ✓ Apellido no vacío
- ✓ Teléfono no vacío

### **Paso 2:**
- ✓ CI no vacío
- ✓ documento_url formato URL válido
- ✓ clienteId existe en Context

### **Paso 3:**
- ✓ Todos los campos llenos
- ✓ Salario > 0
- ✓ extracto_url formato URL válido

### **Paso 4:**
- ✓ Descripción no vacía
- ✓ croquis_url formato URL válido
- ✓ es_propietario (true/false seleccionado)
- ✓ numero_ref no vacío

### **Paso 5:**
- ✓ Al menos un tipo de crédito seleccionado

### **Paso 6:**
- ✓ Monto ≥ monto_minimo del tipo
- ✓ Monto ≤ monto_maximo del tipo
- ✓ Tasa entre 0 y 100
- ✓ Plazo entre 1 y 360 meses

---

## 🐛 Debugging

### **Ver estado del Context:**
Abre React DevTools → Components → busca `ClienteProvider`

Verás:
```
State:
  clienteId: 123
  pasoActual: 3
  pasosCompletados: Set(2) {1, 2}
  clienteData: {nombre: "Juan", apellido: "Pérez", telefono: "+591..."}
```

### **Ver localStorage:**
Consola del navegador:
```javascript
localStorage.getItem('tipoSeleccionado')
```

### **Logs en consola:**
Cada paso imprime:
- 📤 Antes de enviar al backend
- ✅ Cuando recibe respuesta exitosa
- ❌ Si hay error

---

## 🔧 Solución de Problemas

### **"No puedo avanzar al Paso 2"**
→ Verifica que Paso 1 se completó exitosamente
→ Abre Context y confirma que `clienteId` tiene un valor

### **"El crédito no aparece en la lista"**
→ Verifica que el backend haya guardado correctamente
→ Revisa logs en consola del navegador
→ Usa el archivo `test-creditos-endpoint.html` para verificar

### **"Perdí el progreso al recargar"**
→ El Context se resetea al recargar la página (es intencional)
→ Los datos YA están guardados en el backend
→ Solo se pierde el flujo del wizard, no los datos

---

## 📊 Relaciones en Base de Datos

```
Cliente (HU12)
    ↓ (OneToOne)
Documentación (HU13)
    ↓ (mismo cliente)
Trabajo (HU14)
    ↓ (mismo cliente)
Domicilio (HU15)
    ↓ (mismo cliente)
TipoCredito (HU17) ← Selección
    ↓
Crédito (HU16) ← Asocia cliente + tipo + monto
```

**Importante:** 
- 1 Cliente puede tener 1 Documentación
- 1 Cliente puede tener 1 Trabajo
- 1 Cliente puede tener 1 Domicilio
- 1 Cliente puede tener MUCHOS Créditos

---

## 🎯 Próximos Pasos

Si necesitas agregar más funcionalidad:

1. **Editar datos del cliente:** Crear ruta `/app/clientes/wizard/:clienteId`
2. **Reanudar wizard:** Cargar `clienteId` existente en el Context
3. **Validaciones adicionales:** Agregar en cada step antes del submit
4. **Carga de archivos:** Integrar upload real en vez de URLs manuales

---

## 📝 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `context/context.ts` | Define tipos y Context |
| `context/ClienteContext.tsx` | Lógica de estado del wizard |
| `context/useCliente.ts` | Hook para usar el Context |
| `components/WizardSteps.tsx` | Barra de progreso visual |
| `wizard/ClienteWizard.tsx` | Contenedor que renderiza cada paso |
| `wizard/CrearClienteStep.tsx` | HU12 - Crear cliente |
| `wizard/CrearDocumentacionStep.tsx` | HU13 - Documentación |
| `wizard/CrearTrabajoStep.tsx` | HU14 - Información laboral |
| `wizard/CrearDomicilioStep.tsx` | HU15 - Domicilio |
| `wizard/SeleccionarTipoCreditoStep.tsx` | HU17 - Seleccionar tipo |
| `wizard/CrearCreditoStep.tsx` | HU16 - Crear crédito final |

---

¡Eso es todo! El wizard está completamente implementado y funcionando. 🎉
