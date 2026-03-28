-- ============================================================
--  MercaApp — Esquema de Base de Datos PostgreSQL
--  Motor:   PostgreSQL 15+
--  Versión: 1.0
--  Autor:   MercaApp Team
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Búsqueda de texto (LIKE optimizado)

-- ============================================================
--  TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE rol_usuario      AS ENUM ('admin', 'vendedor', 'cobrador');
CREATE TYPE tipo_venta        AS ENUM ('contado', 'credito');
CREATE TYPE estado_venta      AS ENUM ('pendiente', 'despachado', 'anulado');
CREATE TYPE estado_cuota      AS ENUM ('pendiente', 'pagada', 'vencida', 'parcial');
CREATE TYPE estado_despacho   AS ENUM ('pendiente', 'en_ruta', 'entregado', 'devuelto');
CREATE TYPE estado_garantia   AS ENUM ('activa', 'por_vencer', 'vencida', 'reclamada');
CREATE TYPE metodo_pago       AS ENUM ('efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta');
CREATE TYPE tipo_movimiento   AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');
CREATE TYPE tipo_documento    AS ENUM ('CC', 'NIT', 'CE', 'TI', 'PP');

-- ============================================================
--  FUNCIÓN AUXILIAR: auto-actualizar updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  1. USUARIOS
--     Personas que operan el sistema (admin, vendedor, cobrador)
-- ============================================================

CREATE TABLE usuarios (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE,
    telefono        VARCHAR(20),
    rol             rol_usuario  NOT NULL DEFAULT 'vendedor',
    password_hash   TEXT,                          -- BCrypt / Argon2
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_usuarios_upd
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
--  2. CATEGORÍAS DE PRODUCTO
-- ============================================================

CREATE TABLE categorias (
    id          SERIAL       PRIMARY KEY,
    nombre      VARCHAR(80)  NOT NULL UNIQUE,
    descripcion TEXT,
    activa      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============================================================
--  3. PROVEEDORES
-- ============================================================

CREATE TABLE proveedores (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(150) NOT NULL,
    nit         VARCHAR(20)  UNIQUE,
    telefono    VARCHAR(20),
    email       VARCHAR(150),
    direccion   TEXT,
    contacto    VARCHAR(100),  -- Nombre del asesor comercial
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_proveedores_upd
    BEFORE UPDATE ON proveedores
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
--  4. PRODUCTOS / INVENTARIO
-- ============================================================

CREATE TABLE productos (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30)  NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    categoria_id    INTEGER      NOT NULL REFERENCES categorias(id),
    proveedor_id    UUID         REFERENCES proveedores(id) ON DELETE SET NULL,
    precio          NUMERIC(15,2) NOT NULL CHECK (precio >= 0),
    costo           NUMERIC(15,2)          CHECK (costo >= 0),  -- Costo de adquisición
    stock           INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo    INTEGER      NOT NULL DEFAULT 0,
    imagen_url      TEXT,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productos_categoria    ON productos(categoria_id);
CREATE INDEX idx_productos_activo       ON productos(activo) WHERE activo = TRUE;
CREATE INDEX idx_productos_stock_bajo   ON productos(stock) WHERE stock <= stock_minimo;
CREATE INDEX idx_productos_nombre_trgm  ON productos USING GIN (nombre gin_trgm_ops);

CREATE TRIGGER trg_productos_upd
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
--  5. CLIENTES
-- ============================================================

CREATE TABLE clientes (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(150) NOT NULL,
    documento       VARCHAR(20),
    tipo_documento  tipo_documento NOT NULL DEFAULT 'CC',
    telefono        VARCHAR(20),
    email           VARCHAR(150),
    direccion       TEXT,
    barrio          VARCHAR(100),
    ciudad          VARCHAR(100) NOT NULL DEFAULT 'Cali',
    cupo_credito    NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (cupo_credito >= 0),
    saldo_deuda     NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (saldo_deuda >= 0),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cliente_documento UNIQUE (documento, tipo_documento)
);

CREATE INDEX idx_clientes_documento     ON clientes(documento);
CREATE INDEX idx_clientes_nombre_trgm   ON clientes USING GIN (nombre gin_trgm_ops);
CREATE INDEX idx_clientes_activo        ON clientes(activo) WHERE activo = TRUE;

CREATE TRIGGER trg_clientes_upd
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
--  6. VENTAS  (cabecera)
-- ============================================================

CREATE TABLE ventas (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero          VARCHAR(20)  NOT NULL UNIQUE,           -- Ej: V-0001
    cliente_id      UUID         REFERENCES clientes(id) ON DELETE RESTRICT,
    vendedor_id     UUID         REFERENCES usuarios(id)  ON DELETE SET NULL,
    tipo            tipo_venta   NOT NULL,
    estado          estado_venta NOT NULL DEFAULT 'pendiente',
    subtotal        NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
    descuento       NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    total           NUMERIC(15,2) NOT NULL CHECK (total >= 0),
    num_cuotas      INTEGER,                                -- Solo si tipo = 'credito'
    observaciones   TEXT,
    fecha           DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Una venta a crédito debe tener num_cuotas definido
    CONSTRAINT chk_cuotas_credito CHECK (
        (tipo = 'credito' AND num_cuotas IS NOT NULL AND num_cuotas > 0)
        OR tipo = 'contado'
    ),
    -- El total debe ser coherente con subtotal y descuento
    CONSTRAINT chk_total_venta CHECK (
        total = subtotal - descuento
    )
);

CREATE INDEX idx_ventas_cliente         ON ventas(cliente_id);
CREATE INDEX idx_ventas_vendedor        ON ventas(vendedor_id);
CREATE INDEX idx_ventas_fecha           ON ventas(fecha DESC);
CREATE INDEX idx_ventas_tipo_estado     ON ventas(tipo, estado);
CREATE INDEX idx_ventas_numero          ON ventas(numero);

CREATE TRIGGER trg_ventas_upd
    BEFORE UPDATE ON ventas
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
--  7. ÍTEMS DE VENTA  (detalle / líneas)
-- ============================================================

CREATE TABLE venta_items (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id        UUID         NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id     UUID         NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    nombre_snap     VARCHAR(200) NOT NULL,   -- Nombre del producto al momento de vender
    precio_snap     NUMERIC(15,2) NOT NULL,  -- Precio al momento de vender
    costo_snap      NUMERIC(15,2),           -- Costo al momento de vender (para margen)
    cantidad        INTEGER      NOT NULL CHECK (cantidad > 0),
    subtotal        NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),

    CONSTRAINT chk_subtotal_item CHECK (subtotal = precio_snap * cantidad)
);

CREATE INDEX idx_venta_items_venta      ON venta_items(venta_id);
CREATE INDEX idx_venta_items_producto   ON venta_items(producto_id);

-- ============================================================
--  8. CUOTAS DE CRÉDITO
-- ============================================================

CREATE TABLE cuotas (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id        UUID         NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    numero          INTEGER      NOT NULL CHECK (numero > 0),
    valor           NUMERIC(15,2) NOT NULL CHECK (valor > 0),
    saldo           NUMERIC(15,2) NOT NULL CHECK (saldo >= 0), -- Pendiente por pagar
    fecha_vence     DATE         NOT NULL,
    estado          estado_cuota NOT NULL DEFAULT 'pendiente',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cuota_numero UNIQUE (venta_id, numero)
);

CREATE INDEX idx_cuotas_venta           ON cuotas(venta_id);
CREATE INDEX idx_cuotas_fecha_vence     ON cuotas(fecha_vence);
CREATE INDEX idx_cuotas_estado_activas  ON cuotas(estado, fecha_vence)
    WHERE estado IN ('pendiente', 'vencida', 'parcial');

-- ============================================================
--  9. PAGOS  (abonos a cuotas)
-- ============================================================

CREATE TABLE pagos (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuota_id        UUID         NOT NULL REFERENCES cuotas(id) ON DELETE RESTRICT,
    cobrador_id     UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
    valor           NUMERIC(15,2) NOT NULL CHECK (valor > 0),
    metodo          metodo_pago  NOT NULL DEFAULT 'efectivo',
    referencia      VARCHAR(100),  -- Número de transacción, comprobante
    observaciones   TEXT,
    fecha           DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_cuota            ON pagos(cuota_id);
CREATE INDEX idx_pagos_cobrador         ON pagos(cobrador_id);
CREATE INDEX idx_pagos_fecha            ON pagos(fecha DESC);

-- ============================================================
--  10. GARANTÍAS
-- ============================================================

CREATE TABLE garantias (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_item_id   UUID         REFERENCES venta_items(id) ON DELETE SET NULL,
    producto_id     UUID         NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cliente_id      UUID         REFERENCES clientes(id) ON DELETE SET NULL,
    serial          VARCHAR(100),
    fecha_venta     DATE         NOT NULL,
    meses           INTEGER      NOT NULL CHECK (meses > 0),
    fecha_vence     DATE         NOT NULL,
    estado          estado_garantia NOT NULL DEFAULT 'activa',
    observaciones   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_garantia_fecha CHECK (fecha_vence > fecha_venta)
);

CREATE INDEX idx_garantias_cliente      ON garantias(cliente_id);
CREATE INDEX idx_garantias_producto     ON garantias(producto_id);
CREATE INDEX idx_garantias_fecha_vence  ON garantias(fecha_vence);
CREATE INDEX idx_garantias_estado       ON garantias(estado) WHERE estado != 'vencida';

-- ============================================================
--  11. DESPACHOS
-- ============================================================

CREATE TABLE despachos (
    id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id         UUID          NOT NULL REFERENCES ventas(id) ON DELETE RESTRICT,
    despachador_id   UUID          REFERENCES usuarios(id) ON DELETE SET NULL,
    direccion        TEXT          NOT NULL,
    ciudad           VARCHAR(100)  NOT NULL DEFAULT 'Cali',
    estado           estado_despacho NOT NULL DEFAULT 'pendiente',
    fecha_programada DATE,
    fecha_entrega    TIMESTAMPTZ,
    observaciones    TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_despachos_venta        ON despachos(venta_id);
CREATE INDEX idx_despachos_estado       ON despachos(estado) WHERE estado != 'entregado';

CREATE TRIGGER trg_despachos_upd
    BEFORE UPDATE ON despachos
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
--  12. MOVIMIENTOS DE INVENTARIO  (trazabilidad completa)
--      Se inserta un registro cada vez que el stock cambia
-- ============================================================

CREATE TABLE inventario_movimientos (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id     UUID         NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    usuario_id      UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo            tipo_movimiento NOT NULL,
    cantidad        INTEGER      NOT NULL,   -- Positivo = entrada, Negativo = salida
    stock_antes     INTEGER      NOT NULL,
    stock_despues   INTEGER      NOT NULL,
    referencia_tipo VARCHAR(30),             -- 'venta', 'ajuste_manual', 'devolucion', 'importacion_excel'
    referencia_id   UUID,                    -- FK polimórfica al documento origen
    observaciones   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_mov_producto       ON inventario_movimientos(producto_id);
CREATE INDEX idx_inv_mov_created        ON inventario_movimientos(created_at DESC);
CREATE INDEX idx_inv_mov_referencia     ON inventario_movimientos(referencia_tipo, referencia_id);

-- ============================================================
--  VISTAS ÚTILES
-- ============================================================

-- Vista: cartera activa (cuotas pendientes con datos del cliente)
CREATE VIEW v_cartera_activa AS
SELECT
    c.id            AS cuota_id,
    c.numero,
    c.valor,
    c.saldo,
    c.fecha_vence,
    c.estado,
    v.numero        AS venta_numero,
    v.fecha         AS fecha_venta,
    v.total         AS total_venta,
    cli.id          AS cliente_id,
    cli.nombre      AS cliente_nombre,
    cli.telefono    AS cliente_telefono,
    CURRENT_DATE - c.fecha_vence AS dias_mora
FROM cuotas c
JOIN ventas  v   ON v.id  = c.venta_id
LEFT JOIN clientes cli ON cli.id = v.cliente_id
WHERE c.estado IN ('pendiente', 'vencida', 'parcial');

-- Vista: productos con alerta de stock mínimo
CREATE VIEW v_alertas_stock AS
SELECT
    p.id,
    p.codigo,
    p.nombre,
    cat.nombre      AS categoria,
    p.stock,
    p.stock_minimo,
    p.stock_minimo - p.stock AS unidades_faltantes
FROM productos p
JOIN categorias cat ON cat.id = p.categoria_id
WHERE p.activo = TRUE
  AND p.stock <= p.stock_minimo
ORDER BY unidades_faltantes DESC;

-- Vista: resumen de ventas por mes
CREATE VIEW v_ventas_por_mes AS
SELECT
    DATE_TRUNC('month', fecha)  AS mes,
    tipo,
    COUNT(*)                    AS num_ventas,
    SUM(total)                  AS total_vendido
FROM ventas
WHERE estado != 'anulado'
GROUP BY mes, tipo
ORDER BY mes DESC, tipo;

-- Vista: top productos vendidos (por ingresos)
CREATE VIEW v_top_productos AS
SELECT
    p.id,
    p.codigo,
    p.nombre,
    cat.nombre          AS categoria,
    SUM(vi.cantidad)    AS unidades_vendidas,
    SUM(vi.subtotal)    AS total_ingresos
FROM venta_items vi
JOIN productos  p   ON p.id   = vi.producto_id
JOIN categorias cat ON cat.id = p.categoria_id
JOIN ventas     v   ON v.id   = vi.venta_id
WHERE v.estado != 'anulado'
GROUP BY p.id, p.codigo, p.nombre, cat.nombre
ORDER BY total_ingresos DESC;

-- ============================================================
--  DATOS INICIALES (seed)
-- ============================================================

-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Celulares',         'Teléfonos inteligentes y accesorios'),
    ('Ropa de Cama',      'Juegos de sábanas, cobijas, almohadas'),
    ('Muebles',           'Salas, comedores, camas, escritorios'),
    ('Electrodomésticos', 'Lavadoras, neveras, estufas, microondas'),
    ('Electrónica',       'Televisores, computadores, sonido');

-- Usuario administrador por defecto
INSERT INTO usuarios (nombre, email, rol) VALUES
    ('Administrador', 'admin@mercaapp.co', 'admin');
