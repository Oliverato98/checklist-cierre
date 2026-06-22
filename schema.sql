-- Ejecutar en pgAdmin sobre tu base con PostGIS habilitado

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS cierres_diarios (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    responsable TEXT,
    firma TEXT,
    hora_cierre TIME,
    ubicacion GEOGRAPHY(POINT, 4326),   -- coordenadas reales (lat/lng) en formato PostGIS
    tareas JSONB,                        -- estado de las 12 tareas + observaciones
    verificacion JSONB,                  -- estado de la verificación final
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- Índice espacial, útil si luego quieres consultar por cercanía/zona
CREATE INDEX IF NOT EXISTS idx_cierres_ubicacion ON cierres_diarios USING GIST (ubicacion);

-- Habilita Row Level Security: bloquea el acceso vía API pública (clave anónima/autenticada).
-- Tu Netlify Function sigue funcionando porque se conecta directo con usuario/contraseña,
-- esa conexión no pasa por RLS.
ALTER TABLE cierres_diarios ENABLE ROW LEVEL SECURITY;

-- (No se crean políticas a propósito: sin políticas, RLS bloquea TODO acceso vía API pública.
-- Si más adelante quieres leer los datos desde la API con supabase-js, habría que crear
-- una política específica para eso.)

-- Ejemplo de consulta: ver todos los cierres con su ubicación como lat/lng legible
-- SELECT fecha, responsable, ST_Y(ubicacion::geometry) AS lat, ST_X(ubicacion::geometry) AS lng
-- FROM cierres_diarios ORDER BY fecha DESC;
