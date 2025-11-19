// src/modules/personalizacion/cambiar_fotos.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/service";
import {
  getPerfilUserByUsuarioId,
  getEmpresaById,
  updatePerfilUserAvatar,
  updateEmpresaLogo,
} from "../empresa/service";
import PageHeader from "../../shared/components/PageHeader";

export const CambiarFotosPage: React.FC = () => {
  const { user } = useAuth();
  
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>("");
  const [perfilId, setPerfilId] = useState<number | null>(null);
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  // Cargar foto de perfil y logo de empresa
  useEffect(() => {
    const cargarImagenes = async () => {
      if (!user?.id || !user?.empresa_id) {
        console.log("❌ No hay user.id o user.empresa_id:", { userId: user?.id, empresaId: user?.empresa_id });
        setLoading(false);
        return;
      }

      console.log("🔍 Cargando imágenes para:", { userId: user.id, empresaId: user.empresa_id });

      try {
        // Cargar perfil de usuario
        const perfil = await getPerfilUserByUsuarioId(Number(user.id));
        console.log("📥 Perfil cargado:", perfil);
        if (perfil) {
          setPerfilId(perfil.id);
          setUserAvatarUrl(perfil.imagen_url || "");
          console.log("✅ Avatar URL:", perfil.imagen_url);
        }

        // Cargar empresa
        const empresa = await getEmpresaById(Number(user.empresa_id));
        console.log("📥 Empresa cargada:", empresa);
        if (empresa) {
          const logoUrl = (empresa as any).Imagen_url || (empresa as any).imagen_url || "";
          setCompanyLogoUrl(logoUrl);
          console.log("✅ Logo URL:", logoUrl);
        }
      } catch (error) {
        console.error("❌ Error al cargar imágenes:", error);
        mostrarMensaje("error", "Error al cargar las imágenes");
      } finally {
        setLoading(false);
      }
    };

    cargarImagenes();
  }, [user?.id, user?.empresa_id]);

  const mostrarMensaje = (tipo: "success" | "error", texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfilId) {
      console.log("❌ No file o perfilId:", { file: file?.name, perfilId });
      return;
    }

    console.log("📤 Subiendo avatar:", { fileName: file.name, perfilId });
    setUploadingAvatar(true);
    try {
      const updatedPerfil = await updatePerfilUserAvatar(perfilId, file);
      console.log("📥 Respuesta del servidor (avatar):", updatedPerfil);
      if (updatedPerfil && updatedPerfil.imagen_url) {
        setUserAvatarUrl(updatedPerfil.imagen_url);
        mostrarMensaje("success", "Foto de perfil actualizada exitosamente");
        console.log("✅ Avatar actualizado:", updatedPerfil.imagen_url);
        
        // Recargar página para actualizar sidebar
        setTimeout(() => window.location.reload(), 1500);
      } else {
        console.error("❌ No se recibió imagen_url en la respuesta");
        mostrarMensaje("error", "Error al actualizar la foto de perfil");
      }
    } catch (error) {
      console.error("❌ Error al subir avatar:", error);
      mostrarMensaje("error", "Error al subir la foto de perfil");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.empresa_id) {
      console.log("❌ No file o empresa_id:", { file: file?.name, empresaId: user?.empresa_id });
      return;
    }

    console.log("📤 Subiendo logo:", { fileName: file.name, empresaId: user.empresa_id });
    setUploadingLogo(true);
    try {
      const updatedEmpresa = await updateEmpresaLogo(Number(user.empresa_id), file);
      console.log("📥 Respuesta del servidor (logo):", updatedEmpresa);
      if (updatedEmpresa) {
        const newLogoUrl = (updatedEmpresa as any).Imagen_url || (updatedEmpresa as any).imagen_url || "";
        setCompanyLogoUrl(newLogoUrl);
        mostrarMensaje("success", "Logo de empresa actualizado exitosamente");
        console.log("✅ Logo actualizado:", newLogoUrl);
        
        // Recargar página para actualizar topbar
        setTimeout(() => window.location.reload(), 1500);
      } else {
        console.error("❌ No se recibió respuesta del servidor");
        mostrarMensaje("error", "Error al actualizar el logo");
      }
    } catch (error) {
      console.error("❌ Error al subir logo:", error);
      mostrarMensaje("error", "Error al subir el logo de empresa");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <PageHeader title="Cambiar Fotos" subtitle="Actualiza tu foto de perfil y logo de empresa" />
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <p>Cargando...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <PageHeader
        title="Cambiar Fotos"
        subtitle="Actualiza tu foto de perfil y el logo de tu empresa"
        showBackButton={true}
        backPath="/app/personalizacion"
      />

      {mensaje && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            backgroundColor: mensaje.tipo === "success" ? "#d1fae5" : "#fee2e2",
            color: mensaje.tipo === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${mensaje.tipo === "success" ? "#10b981" : "#ef4444"}`,
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Foto de Perfil */}
        <div className="card" style={{ padding: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
            👤 Foto de Perfil
          </h3>
          
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="Avatar"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid var(--primary)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=3b82f6&color=fff&size=150`;
                }}
              />
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                  margin: "0 auto",
                  border: "4px solid var(--primary)",
                }}
              >
                👤
              </div>
            )}
          </div>

          <label
            htmlFor="avatar-upload"
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem",
              textAlign: "center",
              backgroundColor: uploadingAvatar ? "#9ca3af" : "var(--primary)",
              color: "white",
              borderRadius: "8px",
              cursor: uploadingAvatar ? "not-allowed" : "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            {uploadingAvatar ? "Subiendo..." : "📸 Cambiar Foto de Perfil"}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
            style={{ display: "none" }}
          />
          
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
            Formatos: JPG, PNG, GIF (máx. 5MB)
          </p>
        </div>

        {/* Logo de Empresa */}
        <div className="card" style={{ padding: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
            🏢 Logo de Empresa
          </h3>
          
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt="Logo Empresa"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "12px",
                  objectFit: "cover",
                  border: "4px solid var(--primary)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                  margin: "0 auto",
                  border: "4px solid var(--primary)",
                }}
              >
                🏢
              </div>
            )}
          </div>

          <label
            htmlFor="logo-upload"
            style={{
              display: "block",
              width: "100%",
              padding: "0.75rem",
              textAlign: "center",
              backgroundColor: uploadingLogo ? "#9ca3af" : "var(--primary)",
              color: "white",
              borderRadius: "8px",
              cursor: uploadingLogo ? "not-allowed" : "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            {uploadingLogo ? "Subiendo..." : "🖼️ Cambiar Logo de Empresa"}
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={uploadingLogo}
            style={{ display: "none" }}
          />
          
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
            Formatos: JPG, PNG, SVG (máx. 5MB)
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem", backgroundColor: "#eff6ff" }}>
        <h4 style={{ marginBottom: "1rem", color: "#1e40af", fontWeight: 600 }}>
          💡 Información
        </h4>
        <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#1e3a8a" }}>
          <li>Las imágenes se suben automáticamente a AWS S3</li>
          <li>Los cambios se reflejarán inmediatamente en toda la aplicación</li>
          <li>Recomendamos usar imágenes cuadradas para mejores resultados</li>
          <li>El tamaño máximo recomendado es 5MB por imagen</li>
        </ul>
      </div>
    </section>
  );
};

export default CambiarFotosPage;
