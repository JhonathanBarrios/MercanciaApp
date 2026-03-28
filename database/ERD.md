# MercaApp — Modelo Entidad-Relación

## Diagrama de relaciones

```
┌─────────────┐       ┌──────────────┐       ┌─────────────────┐
│  categorias │───<   │   productos  │ >───  │   proveedores   │
└─────────────┘       └──────┬───────┘       └─────────────────┘
                             │
                    inventario_movimientos
                             │
┌─────────────┐       ┌──────┴───────┐       ┌─────────────────┐
│   clientes  │───<   │    ventas    │ >───  │    usuarios     │
└──────┬──────┘       └──────┬───────┘       └─────────────────┘
       │                     │
       │              ┌──────┴──────────────┐
       │              │                     │
       │        ┌─────┴──────┐       ┌──────┴──────┐
       │        │ venta_items│       │   cuotas    │
       │        └─────┬──────┘       └──────┬──────┘
       │              │                     │
       │        ┌─────┴──────┐       ┌──────┴──────┐
       │        │  garantias │       │    pagos    │
       └────────┤            │       │             │
                └────────────┘       └─────────────┘

ventas ──< despachos
```

---

## Tablas y responsabilidades

### `usuarios`
Personas que operan el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador único |
| `nombre` | VARCHAR(100) | Nombre completo |
| `email` | VARCHAR(150) UNIQUE | Correo electrónico |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `rol` | ENUM | `admin` / `vendedor` / `cobrador` |
| `password_hash` | TEXT | Hash de contraseña (BCrypt/Argon2) |
| `activo` | BOOLEAN | Soft delete |

---

### `categorias`
Clasificación de productos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | Auto-incremental |
| `nombre` | VARCHAR(80) UNIQUE | Ej: Celulares, Muebles |
| `descripcion` | TEXT | Descripción opcional |
| `activa` | BOOLEAN | Soft delete |

---

### `proveedores`
Empresas o personas que suministran los productos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `nombre` | VARCHAR(150) | Razón social |
| `nit` | VARCHAR(20) UNIQUE | NIT del proveedor |
| `telefono` | VARCHAR(20) | |
| `email` | VARCHAR(150) | |
| `contacto` | VARCHAR(100) | Nombre del asesor |
| `activo` | BOOLEAN | Soft delete |

---

### `productos`
Artículos del inventario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `codigo` | VARCHAR(30) UNIQUE | Código interno |
| `nombre` | VARCHAR(200) | Nombre del producto |
| `categoria_id` | FK → categorias | |
| `proveedor_id` | FK → proveedores | Nullable |
| `precio` | NUMERIC(15,2) | Precio de venta al público |
| `costo` | NUMERIC(15,2) | Costo de adquisición (margen) |
| `stock` | INTEGER | Unidades disponibles |
| `stock_minimo` | INTEGER | Umbral de alerta |
| `activo` | BOOLEAN | Soft delete |

---

### `clientes`
Personas que compran (contado o crédito).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `nombre` | VARCHAR(150) | Nombre completo |
| `documento` | VARCHAR(20) | Cédula / NIT |
| `tipo_documento` | ENUM | CC / NIT / CE / TI / PP |
| `telefono` | VARCHAR(20) | |
| `direccion` | TEXT | |
| `ciudad` | VARCHAR(100) | Default: Cali |
| `cupo_credito` | NUMERIC(15,2) | Cupo máximo autorizado |
| `saldo_deuda` | NUMERIC(15,2) | Deuda vigente acumulada |
| `activo` | BOOLEAN | Soft delete |

---

### `ventas`
Cabecera de cada transacción de venta.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `numero` | VARCHAR(20) UNIQUE | Ej: V-0001 |
| `cliente_id` | FK → clientes | Nullable (mostrador) |
| `vendedor_id` | FK → usuarios | |
| `tipo` | ENUM | `contado` / `credito` |
| `estado` | ENUM | `pendiente` / `despachado` / `anulado` |
| `subtotal` | NUMERIC(15,2) | Suma de ítems antes de descuento |
| `descuento` | NUMERIC(15,2) | Descuento aplicado |
| `total` | NUMERIC(15,2) | = subtotal − descuento |
| `num_cuotas` | INTEGER | Solo si tipo = crédito |
| `fecha` | DATE | Fecha de la venta |

**Constraint:** Si `tipo = credito` → `num_cuotas` es obligatorio > 0

---

### `venta_items`
Líneas de detalle de cada venta (N ítems por venta).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `venta_id` | FK → ventas | CASCADE delete |
| `producto_id` | FK → productos | |
| `nombre_snap` | VARCHAR(200) | **Snapshot** del nombre al vender |
| `precio_snap` | NUMERIC(15,2) | **Snapshot** del precio al vender |
| `costo_snap` | NUMERIC(15,2) | Snapshot del costo (para margen) |
| `cantidad` | INTEGER | Unidades vendidas |
| `subtotal` | NUMERIC(15,2) | = precio_snap × cantidad |

> Los campos `_snap` guardan el valor histórico. Si el precio del producto cambia después, la venta ya registrada no se altera.

---

### `cuotas`
Plan de pagos de ventas a crédito.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `venta_id` | FK → ventas | CASCADE delete |
| `numero` | INTEGER | Número de la cuota (1, 2, 3…) |
| `valor` | NUMERIC(15,2) | Valor total de la cuota |
| `saldo` | NUMERIC(15,2) | Saldo pendiente por pagar |
| `fecha_vence` | DATE | Fecha límite de pago |
| `estado` | ENUM | `pendiente` / `pagada` / `vencida` / `parcial` |

**Unique:** `(venta_id, numero)` — no puede repetirse el número de cuota por venta.

---

### `pagos`
Abonos realizados a una cuota específica.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `cuota_id` | FK → cuotas | |
| `cobrador_id` | FK → usuarios | Quien registró el pago |
| `valor` | NUMERIC(15,2) | Monto abonado |
| `metodo` | ENUM | efectivo / transferencia / nequi / daviplata / tarjeta |
| `referencia` | VARCHAR(100) | Número de comprobante |
| `fecha` | DATE | Fecha del pago |

---

### `garantias`
Control de garantías por producto vendido.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `venta_item_id` | FK → venta_items | Nullable |
| `producto_id` | FK → productos | |
| `cliente_id` | FK → clientes | |
| `serial` | VARCHAR(100) | Número de serial del equipo |
| `fecha_venta` | DATE | |
| `meses` | INTEGER | Duración de la garantía |
| `fecha_vence` | DATE | = fecha_venta + meses |
| `estado` | ENUM | `activa` / `por_vencer` / `vencida` / `reclamada` |

---

### `despachos`
Órdenes de entrega asociadas a ventas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `venta_id` | FK → ventas | |
| `despachador_id` | FK → usuarios | Nullable |
| `direccion` | TEXT | Dirección de entrega |
| `ciudad` | VARCHAR(100) | |
| `estado` | ENUM | `pendiente` / `en_ruta` / `entregado` / `devuelto` |
| `fecha_programada` | DATE | Fecha estimada de entrega |
| `fecha_entrega` | TIMESTAMPTZ | Fecha real de entrega |

---

### `inventario_movimientos`
Registro histórico de cada cambio de stock (trazabilidad).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `producto_id` | FK → productos | |
| `usuario_id` | FK → usuarios | Quién realizó el movimiento |
| `tipo` | ENUM | `entrada` / `salida` / `ajuste` / `devolucion` |
| `cantidad` | INTEGER | + entrada, − salida |
| `stock_antes` | INTEGER | Stock previo al movimiento |
| `stock_despues` | INTEGER | Stock resultante |
| `referencia_tipo` | VARCHAR(30) | `venta` / `ajuste_manual` / `importacion_excel` |
| `referencia_id` | UUID | ID del documento origen |

---

## Reglas de negocio implementadas en la BD

| # | Regla | Implementación |
|---|---|---|
| 1 | Venta a crédito requiere num_cuotas | `CHECK` en tabla `ventas` |
| 2 | total = subtotal − descuento | `CHECK` en tabla `ventas` |
| 3 | subtotal_item = precio × cantidad | `CHECK` en tabla `venta_items` |
| 4 | Stock no puede ser negativo | `CHECK (stock >= 0)` en `productos` |
| 5 | Cupo y saldo siempre ≥ 0 | `CHECK` en tabla `clientes` |
| 6 | fecha_vence garantía > fecha_venta | `CHECK` en tabla `garantias` |
| 7 | No puede repetirse cuota N° en una venta | `UNIQUE (venta_id, numero)` |
| 8 | No puede repetirse documento+tipo por cliente | `UNIQUE (documento, tipo_documento)` |
| 9 | `updated_at` se actualiza automáticamente | `TRIGGER fn_updated_at()` en 6 tablas |
| 10 | Borrar venta elimina sus ítems y cuotas | `ON DELETE CASCADE` en hijos |

---

## Vistas incluidas

| Vista | Descripción |
|---|---|
| `v_cartera_activa` | Todas las cuotas pendientes/vencidas con datos del cliente y días de mora |
| `v_alertas_stock` | Productos con stock ≤ stock_mínimo |
| `v_ventas_por_mes` | Ventas agrupadas por mes y tipo (contado/crédito) |
| `v_top_productos` | Productos más vendidos por ingresos totales |
