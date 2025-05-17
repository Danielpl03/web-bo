-- Verificar estructura de tablas relacionadas con descuentos

-- Verificar tabla de monedas
SELECT * FROM monedas;

-- Verificar tabla de métodos de pago
SELECT * FROM pagos;

-- Verificar tabla de descuentos
SELECT * FROM descuentos WHERE activo = true;

-- Verificar relaciones entre descuentos y métodos de pago
SELECT dp.id_relacion, dp.id_descuento, dp.id_pago, 
       d.nombre AS descuento_nombre, d.valor AS descuento_valor,
       p.nombre AS pago_nombre, p.id_moneda
FROM descuentos_pagos dp
JOIN descuentos d ON dp.id_descuento = d.id_descuento
JOIN pagos p ON dp.id_pago = p.id_pago
WHERE d.activo = true AND p.activo = true;

-- Verificar productos con descuentos
SELECT dp.id_producto, p.descripcion, p.codigo,
       d.id_descuento, d.nombre AS descuento_nombre, d.valor AS descuento_valor
FROM descuentos_productos dp
JOIN productos p ON dp.id_producto = p.id_producto
JOIN descuentos d ON dp.id_descuento = d.id_descuento
WHERE p.activo = true AND d.activo = true
LIMIT 10;
