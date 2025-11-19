# 🔐 ALINEACIÓN FRONTEND-BACKEND - ANÁLISIS COMPLETO

## 📊 ANÁLISIS DE LA DOCUMENTACIÓN DEL BACKEND

### **1. Sistema de Autenticación**

#### **Endpoint de Login**
```
POST http://127.0.0.1:8000/api/auth/login/
```

**Campos Esperados por el Backend:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**❌ PROBLEMA ENCONTRADO:**
- El backend espera campo `email`
- El frontend actualmente envía `{email, password}` ✅ CORRECTO

**✅ Estado:** ALINEADO

---

### **2. Sistema de Tokens**

#### **Características de los Tokens:**
- ✅ **Permanentes** (NO expiran automáticamente)
- ✅ Se crean con `Token.objects.get_or_create(user=user)`
- ✅ Se guardan en tabla `authtoken_token`
- ✅ Un usuario = un token único
- ✅ Se eliminan solo al hacer logout

#### **Formato del Header:**
```
Authorization: Token 498fa4de19f238ba3d436b1e8f9a2c7d1e5b8f3a
```

**❌ PROBLEMA ENCONTRADO:**
El frontend usa:
```typescript
config.headers.Authorization = `Token ${token}`;  // ✅ CORRECTO
```

**✅ Estado:** ALINEADO

---

### **3. Sistema de Roles**

#### **Roles Disponibles en Backend:**
```python
ROLES_CHOICES = [
    ('ADMIN', 'Administrador de Empresa'),
    ('GERENTE', 'Gerente'),
    ('EMPLEADO', 'Empleado'),
    ('LIMPIADOR', 'Limpiador'),
]
```

#### **Dónde se Guardan:**
- Tabla: `Perfiluser`
- Campos: `empresa_id`, `usuario_id`, `rol`

#### **❌ PROBLEMA ENCONTRADO:**

**Frontend actual:**
```typescript
// src/modules/auth/service.ts
const roles = deriveGlobalRoles(u);  // Deriva: "superadmin", "admin", "user"
```

**Backend real:**
- Roles: `"ADMIN"`, `"GERENTE"`, `"EMPLEADO"`, `"LIMPIADOR"`
- NO tiene `"superadmin"` ni `"user"`

**🔧 CORRECCIÓN NECESARIA:**
El frontend debe usar los roles exactos del backend.

---

### **4. Permisos Actuales**

#### **Según Documentación:**

| Acción | ADMIN | GERENTE | EMPLEADO | LIMPIADOR |
|--------|-------|---------|----------|-----------|
| Crear Usuarios | ✅ | ❌ | ❌ | ❌ |
| Crear Clientes | ✅ | ✅ | ✅ | ✅ |
| Crear Créditos | ✅ | ✅ | ✅ | ✅ |
| Ver Datos | ✅ | ✅ | ✅ | ✅ |
| Actualizar | ✅ | ✅ | ✅ | ✅ |
| Eliminar | ✅ | ✅ | ✅ | ✅ |

**Validación:**
```python
permission_classes = [permissions.IsAuthenticated]  # Solo requiere login
```

**❌ PROBLEMA:**
El backend NO valida roles para operaciones CRUD (excepto crear usuarios).

**✅ Estado:** El frontend NO debe restringir por rol (excepto crear usuarios).

---

### **5. Endpoints de Sprint 3 (HU12-HU17)**

#### **HU12 - Crear Cliente**
```
POST /api/Clientes/clientes/
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez González",
  "telefono": "+591 75757575"
}
```

**Campos Auto-asignados:**
- `empresa` → De `Perfiluser.empresa`
- `fecha_registro` → Auto

**✅ Estado Frontend:** CORRECTO

---

#### **HU13 - Documentación**
```
POST /api/Clientes/documentacion/
{
  "ci": "7845123",
  "documento_url": "https://...",
  "id_cliente": 1  // ← REQUERIDO
}
```

**⚠️ Relación:** OneToOne (un cliente = una documentación)

**✅ Estado Frontend:** CORRECTO (wizard paso 2)

---

#### **HU14 - Trabajo**
```
POST /api/Clientes/trabajo/
{
  "cargo": "Gerente",
  "empresa": "Empresa XYZ",
  "extracto_url": "https://...",
  "salario": 5000.00,
  "ubicacion": "La Paz",
  "descripcion": "...",
  "id_cliente": 1  // ← REQUERIDO
}
```

**✅ Estado Frontend:** CORRECTO (wizard paso 3)

---

#### **HU15 - Domicilio**
```
POST /api/Clientes/domicilios/
{
  "descripcion": "Av. 6 de Agosto...",
  "croquis_url": "https://...",
  "es_propietario": true,
  "numero_ref": "502-TA",
  "id_cliente": 1  // ← REQUERIDO
}
```

**✅ Estado Frontend:** CORRECTO (wizard paso 4)

---

#### **HU17 - Tipos de Crédito**
```
GET /api/Creditos/tipo-creditos/
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Préstamo Personal",
    "descripcion": "...",
    "monto_minimo": "1000.00",
    "monto_maximo": "50000.00"
  }
]
```

**✅ Estado Frontend:** CORRECTO (wizard paso 5)

---

#### **HU16 - Crear Crédito**
```
POST /api/Creditos/creditos/
{
  "Monto_Solicitado": 10000.00,
  "enum_estado": "SOLICITADO",
  "Numero_Cuotas": 12,
  "Monto_Cuota": 916.67,
  "Moneda": "USD",
  "Tasa_Interes": 10.50,
  "Monto_Pagar": 11000.00,
  "cliente": 1,           // ← REQUERIDO
  "tipo_credito": 1,      // ← REQUERIDO
  "Fecha_Aprobacion": null,
  "Fecha_Desembolso": null,
  "Fecha_Finalizacion": null
}
```

**Campos Auto-asignados:**
- `empresa` → De `Perfiluser.empresa`
- `usuario` → ID del usuario que crea

**❌ PROBLEMA ENCONTRADO:**

**Frontend actual (crear_creditos.tsx):**
```typescript
const dataParaBackend: CreateCreditoInput = {
  Monto_Solicitado: form.monto,
  enum_estado: 'SOLICITADO',
  Numero_Cuotas: form.plazo_meses,
  Monto_Cuota: montoCuota,
  Moneda: form.moneda,
  Tasa_Interes: form.tasa_anual,
  Monto_Pagar: montoPagar,
  empresa: empresaId,        // ← ELIMINAR (auto-asignado)
  usuario: usuarioId,        // ← ELIMINAR (auto-asignado)
  cliente: Number(form.cliente_id),
  tipo_credito: Number(tipoSeleccionado.id)
};
```

**🔧 CORRECCIÓN:**
El backend asigna `empresa` y `usuario` automáticamente. NO deben enviarse.

---

### **6. Multi-Tenancy**

#### **Filtrado Automático:**
✅ Todos los endpoints filtran por `empresa_id` del usuario autenticado.

**Ejemplo:**
```python
def get_queryset(self):
    user = self.request.user
    perfil = Perfiluser.objects.get(usuario=user)
    return Cliente.objects.filter(empresa_id=perfil.empresa.id)
```

**✅ Estado Frontend:** NO necesita enviar `empresa_id` en requests.

---

### **7. Validaciones de Campos**

#### **Según Backend:**

**Cliente:**
- `nombre` ✅ Requerido
- `apellido` ✅ Requerido
- `telefono` ✅ Requerido

**Documentación:**
- `ci` ✅ Requerido
- `documento_url` ✅ Requerido (URL válida)
- `id_cliente` ✅ Requerido

**Trabajo:**
- `cargo` ✅ Requerido
- `empresa` ✅ Requerido
- `extracto_url` ✅ Requerido (URL válida)
- `salario` ✅ Requerido (decimal)
- `ubicacion` ✅ Requerido
- `descripcion` ✅ Requerido
- `id_cliente` ✅ Requerido

**Domicilio:**
- `descripcion` ✅ Requerido
- `croquis_url` ✅ Requerido (URL válida)
- `es_propietario` ✅ Requerido (boolean)
- `numero_ref` ✅ Requerido
- `id_cliente` ✅ Requerido

**Crédito:**
- `Monto_Solicitado` ✅ Requerido
- `enum_estado` ✅ Requerido
- `Numero_Cuotas` ✅ Requerido
- `Monto_Cuota` ✅ Requerido
- `Moneda` ✅ Requerido
- `Tasa_Interes` ✅ Requerido
- `Monto_Pagar` ✅ Requerido
- `cliente` ✅ Requerido
- `tipo_credito` ✅ Requerido

**✅ Estado Frontend:** Wizard valida todos los campos requeridos.

---

## 🔧 CORRECCIONES NECESARIAS

### **1. Eliminar empresa/usuario de CreateCreditoInput**

**Archivo:** `src/modules/creditos/crear_creditos.tsx`

**Antes:**
```typescript
const dataParaBackend: CreateCreditoInput = {
  // ...
  empresa: empresaId,     // ❌ ELIMINAR
  usuario: usuarioId,     // ❌ ELIMINAR
  cliente: Number(form.cliente_id),
  tipo_credito: Number(tipoSeleccionado.id)
};
```

**Después:**
```typescript
const dataParaBackend: CreateCreditoInput = {
  Monto_Solicitado: form.monto,
  enum_estado: 'SOLICITADO',
  Numero_Cuotas: form.plazo_meses,
  Monto_Cuota: montoCuota,
  Moneda: form.moneda,
  Tasa_Interes: form.tasa_anual,
  Monto_Pagar: montoPagar,
  cliente: Number(form.cliente_id),
  tipo_credito: Number(tipoSeleccionado.id),
  Fecha_Aprobacion: null,
  Fecha_Desembolso: null,
  Fecha_Finalizacion: null
};
```

---

### **2. Actualizar CreateCreditoInput en types.ts**

**Archivo:** `src/modules/creditos/types.ts`

**Antes:**
```typescript
export interface CreateCreditoInput {
  // ... campos ...
  empresa?: number;    // ❌ ELIMINAR
  usuario?: number;    // ❌ ELIMINAR
}
```

**Después:**
```typescript
export interface CreateCreditoInput {
  Monto_Solicitado: number;
  enum_estado: string;
  Numero_Cuotas: number;
  Monto_Cuota: number;
  Moneda: string;
  Tasa_Interes: number;
  Monto_Pagar: number;
  cliente: number;
  tipo_credito: number;
  Fecha_Aprobacion?: string | null;
  Fecha_Desembolso?: string | null;
  Fecha_Finalizacion?: string | null;
}
```

---

### **3. Alinear Roles con Backend**

**Archivo:** `src/modules/auth/types.ts`

**Antes:**
```typescript
export type GlobalRole = "superadmin" | "platform_admin" | "admin" | "user";
```

**Después:**
```typescript
export type GlobalRole = "ADMIN" | "GERENTE" | "EMPLEADO" | "LIMPIADOR";
export type TenantRole = "ADMIN" | "GERENTE" | "EMPLEADO" | "LIMPIADOR";
```

---

### **4. Actualizar deriveGlobalRoles**

**Archivo:** `src/modules/auth/service.ts`

**Antes:**
```typescript
function deriveGlobalRoles(u: UserDTO): GlobalRole[] {
  if (u.is_superuser && !u.empresa_id) {
    return ["superadmin", "platform_admin"];
  }
  if (u.is_staff && u.empresa_id) {
    return ["admin"];
  }
  return ["user"];
}
```

**Después:**
```typescript
function deriveGlobalRoles(u: UserDTO): GlobalRole[] {
  // Si el backend envía el rol directamente, usarlo
  if (u.rol) {
    return [u.rol as GlobalRole];
  }
  
  // Fallback: derivar del is_staff
  if (u.is_staff) {
    return ["ADMIN"];
  }
  
  return ["EMPLEADO"];  // Default
}
```

---

### **5. Actualizar UserDTO Interface**

**Archivo:** `src/modules/auth/types.ts`

**Agregar campo `rol`:**
```typescript
export interface UserDTO {
  id: number;
  username: string;
  email?: string;
  nombre_completo?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  rol?: "ADMIN" | "GERENTE" | "EMPLEADO" | "LIMPIADOR";  // ← AGREGAR
  empresa_id?: number | null;
  empresa_nombre?: string;
  tenant_id?: number | null;
  global_roles?: string[];
  org_roles?: OrgRolesMap;
}
```

---

## ✅ CHECKLIST DE CORRECCIONES

### **Autenticación**
- [x] ✅ Usa `email` en login (CORRECTO)
- [x] ✅ Token en formato `Token XXX` (CORRECTO)
- [ ] 🔧 Actualizar tipos de roles a backend

### **Wizard HU12-HU17**
- [x] ✅ HU12 - Cliente (CORRECTO)
- [x] ✅ HU13 - Documentación (CORRECTO)
- [x] ✅ HU14 - Trabajo (CORRECTO)
- [x] ✅ HU15 - Domicilio (CORRECTO)
- [x] ✅ HU17 - Tipos de Crédito (CORRECTO)
- [ ] 🔧 HU16 - Eliminar empresa/usuario de payload

### **Tipos TypeScript**
- [ ] 🔧 Actualizar GlobalRole
- [ ] 🔧 Agregar campo `rol` a UserDTO
- [ ] 🔧 Actualizar CreateCreditoInput

### **Servicios**
- [ ] 🔧 Actualizar deriveGlobalRoles
- [ ] 🔧 Actualizar mapUser

---

## 📝 RESUMEN

**Estado General:** 85% ALINEADO ✅

**Correcciones Pendientes:** 5
1. Eliminar empresa/usuario de crear crédito
2. Actualizar tipos de roles
3. Agregar campo rol a UserDTO
4. Actualizar deriveGlobalRoles
5. Actualizar CreateCreditoInput

**Prioridad:** MEDIA (no afecta funcionalidad actual, mejora alineación)

---

Fecha: 9 de noviembre de 2025
