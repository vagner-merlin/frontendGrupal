# 🔐 SISTEMA DE ROLES Y PERMISOS

## 📊 ESTRUCTURA DE 3 NIVELES

### 1️⃣ **SUPERUSUARIO (byvagner)** - Nivel Plataforma
```javascript
{
  username: "byvagner",
  email: "vagner@gmail.com", 
  is_superuser: true,
  is_staff: true,
  empresa_id: null,  // ← SIN EMPRESA (acceso global)
  roles: ["superadmin", "platform_admin"]
}
```

**PERMISOS:**
- ✅ Registrar nuevas empresas en el sistema
- ✅ Ver/editar TODAS las empresas
- ✅ Hacer soporte técnico a cualquier empresa
- ✅ Ver estadísticas globales de toda la plataforma
- ✅ Acceder al Django Admin
- ✅ Gestionar usuarios de cualquier empresa
- ✅ Crear/eliminar empresas

**MENÚ VISIBLE:**
- Dashboard Global
- Empresas (ver todas)
- Usuarios (todos)
- Grupos/Roles (todos)
- Reportes Globales
- Backup/Auditoría
- Personalización Global

---

### 2️⃣ **ADMIN EMPRESA (Lucho1)** - Nivel Empresa
```javascript
{
  username: "Lucho1",
  email: "luchoromero2025@gmail.com",
  is_superuser: false,
  is_staff: true,        // ← STAFF de su empresa
  empresa_id: 1,         // ← Petrodill SA
  roles: ["admin"]
}
```

**PERMISOS:**
- ✅ Registrar empleados de Petrodill (solo de SU empresa)
- ✅ Gestionar créditos de sus clientes
- ✅ Asignar roles a sus empleados
- ✅ Crear/editar/eliminar usuarios de su empresa
- ✅ Ver reportes de su empresa
- ✅ Gestionar grupos de su empresa
- ❌ NO puede ver otras empresas
- ❌ NO puede acceder a funciones de plataforma

**MENÚ VISIBLE:**
- Dashboard (solo su empresa)
- Usuarios (solo de Petrodill)
- Grupos/Roles (solo de Petrodill)
- Créditos (todos los permisos)
- Clientes (crear, editar, eliminar)
- Reportes (solo de Petrodill)
- Ingresos/Pagos
- Personalización de empresa
- Tipos de Crédito (admin only)

---

### 3️⃣ **USUARIO NORMAL (Contador)** - Nivel Empleado
```javascript
{
  username: "contador_petrodill",
  email: "contador@petrodill.com",
  is_superuser: false,
  is_staff: false,       // ← NO ES STAFF
  empresa_id: 1,         // ← Pertenece a Petrodill
  roles: ["user"]
}
```

**PERMISOS:**
- ✅ Ver créditos de la empresa
- ✅ Generar reportes
- ✅ Ver clientes
- ✅ Ver ingresos/pagos
- ❌ NO puede crear usuarios
- ❌ NO puede eliminar datos
- ❌ NO puede gestionar roles
- ❌ NO puede ver configuración de empresa

**MENÚ VISIBLE:**
- Dashboard (solo vista)
- Créditos (solo lectura)
- Clientes (solo lectura)
- Reportes (generar)
- Ingresos (solo vista)

---

## 🔍 CÓMO SE DETERMINA EL ROL

### En el backend (Django):
```python
# Backend determina el rol al hacer login
if user.is_superuser and user.empresa_id is None:
    role = "superadmin"  # Nivel plataforma
elif user.is_staff and user.empresa_id:
    role = "admin"       # Admin de empresa
else:
    role = "user"        # Usuario normal
```

### En el frontend (`auth/service.ts`):
```typescript
function deriveGlobalRoles(u: UserDTO): GlobalRole[] {
  // 1. Superuser SIN empresa => superadmin
  if (u.is_superuser && !u.empresa_id) {
    return ["superadmin", "platform_admin"];
  }
  
  // 2. Staff CON empresa => admin de empresa
  if (u.is_staff && u.empresa_id) {
    return ["admin"];
  }
  
  // 3. Usuario normal
  return ["user"];
}
```

---

## 🎯 FILTROS DE DATOS

### Superadmin (byvagner):
```sql
SELECT * FROM usuarios;  -- Ve TODOS los usuarios
SELECT * FROM empresas;  -- Ve TODAS las empresas
```

### Admin Empresa (Lucho1):
```sql
SELECT * FROM usuarios WHERE empresa_id = 1;  -- Solo usuarios de Petrodill
SELECT * FROM clientes WHERE empresa_id = 1;  -- Solo clientes de Petrodill
```

### Usuario Normal (Contador):
```sql
SELECT * FROM creditos WHERE empresa_id = 1;  -- Solo créditos de Petrodill
-- NO tiene acceso a tabla usuarios
```

---

## ✅ IMPLEMENTACIÓN ACTUAL

### ✅ Correctamente implementado:
1. **Roles derivados automáticamente** según `is_superuser`, `is_staff`, `empresa_id`
2. **Menú dinámico** según rol del usuario (`menuData.ts`)
3. **Protección de rutas** con `RequireRole` component
4. **Filtros de empresa_id** en queries (tenant_id)

### ⚠️ Verificar:
1. **Backend**: Asegurar que las APIs filtren por `empresa_id` automáticamente
2. **Permisos de Django**: Configurar permisos en grupos correctamente
3. **UI**: Ocultar botones de acciones prohibidas según rol

---

## 🧪 TESTING

### Crear los 3 usuarios de prueba:

```bash
# 1. Superusuario (ya existe)
# username: byvagner
# email: vagner@gmail.com
# empresa_id: NULL

# 2. Admin Empresa
POST /api/User/create-user/
{
  "username": "Lucho1",
  "email": "luchoromero2025@gmail.com",
  "password": "tu_contraseña",
  "is_staff": true,
  "empresa_id": 1
}

# 3. Usuario Normal
POST /api/User/create-user/
{
  "username": "contador_petrodill",
  "email": "contador@petrodill.com",
  "password": "contador123",
  "is_staff": false,
  "empresa_id": 1
}
```

---

## 📋 CHECKLIST DE PERMISOS

| Funcionalidad | Superadmin | Admin Empresa | Usuario Normal |
|--------------|------------|---------------|----------------|
| Ver empresas globales | ✅ | ❌ | ❌ |
| Crear empresas | ✅ | ❌ | ❌ |
| Ver usuarios de su empresa | ✅ | ✅ | ❌ |
| Crear usuarios | ✅ | ✅ | ❌ |
| Asignar roles | ✅ | ✅ | ❌ |
| Gestionar créditos | ✅ | ✅ | 👁️ Ver |
| Crear clientes | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ |
| Django Admin | ✅ | ❌ | ❌ |
| Backup/Auditoría | ✅ | ✅ | ❌ |

---

## 🔧 ENDPOINTS CON FILTROS

```typescript
// Usuarios - Solo de su empresa (excepto superadmin)
GET /api/User/user/?empresa_id=1

// Créditos - Solo de su empresa
GET /api/creditos/?empresa_id=1

// Clientes - Solo de su empresa
GET /api/clientes/?empresa_id=1
```

El `empresa_id` se envía automáticamente desde el frontend usando:
```typescript
headers: {
  'X-Tenant-ID': localStorage.getItem('auth.tenant_id')
}
```
