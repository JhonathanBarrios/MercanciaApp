import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Categorías
  const categorias = await Promise.all([
    prisma.categoria.upsert({ where: { nombre: 'Celulares' },        update: {}, create: { nombre: 'Celulares',         descripcion: 'Teléfonos inteligentes y accesorios' } }),
    prisma.categoria.upsert({ where: { nombre: 'Ropa de Cama' },     update: {}, create: { nombre: 'Ropa de Cama',      descripcion: 'Juegos de sábanas, cobijas, almohadas' } }),
    prisma.categoria.upsert({ where: { nombre: 'Muebles' },          update: {}, create: { nombre: 'Muebles',           descripcion: 'Salas, comedores, camas, escritorios' } }),
    prisma.categoria.upsert({ where: { nombre: 'Electrodomésticos' },update: {}, create: { nombre: 'Electrodomésticos', descripcion: 'Lavadoras, neveras, estufas, microondas' } }),
    prisma.categoria.upsert({ where: { nombre: 'Electrónica' },      update: {}, create: { nombre: 'Electrónica',       descripcion: 'Televisores, computadores, sonido' } }),
  ]);
  console.log(`✅ ${categorias.length} categorías creadas`);

  // Usuarios
  const hash = await bcrypt.hash('admin123', 10);
  const usuarios = await Promise.all([
    prisma.usuario.upsert({
      where: { email: 'admin@mercaapp.co' },
      update: {},
      create: { nombre: 'Carlos Ramírez', email: 'admin@mercaapp.co', rol: 'admin', passwordHash: hash },
    }),
    prisma.usuario.upsert({
      where: { email: 'vendedor@mercaapp.co' },
      update: {},
      create: { nombre: 'Laura Vásquez', email: 'vendedor@mercaapp.co', rol: 'vendedor', passwordHash: await bcrypt.hash('vend123', 10) },
    }),
    prisma.usuario.upsert({
      where: { email: 'cobrador@mercaapp.co' },
      update: {},
      create: { nombre: 'Pedro Cobos', email: 'cobrador@mercaapp.co', rol: 'cobrador', passwordHash: await bcrypt.hash('cobr123', 10) },
    }),
  ]);
  console.log(`✅ ${usuarios.length} usuarios creados`);

  // Proveedor demo
  const proveedor = await prisma.proveedor.upsert({
    where: { nit: '900123456-1' },
    update: {},
    create: { nombre: 'Distribuidora Nacional S.A.S', nit: '900123456-1', telefono: '3001234567', contacto: 'Andrés Torres' },
  });
  console.log('✅ Proveedor demo creado');

  // Productos
  const celularCat = categorias.find(c => c.nombre === 'Celulares')!;
  const electCat   = categorias.find(c => c.nombre === 'Electrodomésticos')!;
  const elecCat    = categorias.find(c => c.nombre === 'Electrónica')!;
  const mueblesCat = categorias.find(c => c.nombre === 'Muebles')!;

  const productosData = [
    { codigo: 'CEL-001', nombre: 'iPhone 13 128GB',          categoriaId: celularCat.id, precio: 2850000, costo: 2200000, stock: 8,  stockMinimo: 3, proveedorId: proveedor.id },
    { codigo: 'CEL-002', nombre: 'Samsung Galaxy A15 5G',    categoriaId: celularCat.id, precio: 980000,  costo: 720000,  stock: 15, stockMinimo: 5, proveedorId: proveedor.id },
    { codigo: 'CEL-003', nombre: 'Xiaomi Redmi Note 13',     categoriaId: celularCat.id, precio: 850000,  costo: 620000,  stock: 2,  stockMinimo: 5, proveedorId: proveedor.id },
    { codigo: 'ELE-001', nombre: 'Nevera Samsung 300L',      categoriaId: electCat.id,   precio: 2100000, costo: 1600000, stock: 5,  stockMinimo: 2, proveedorId: proveedor.id },
    { codigo: 'ELE-002', nombre: 'Lavadora LG 10kg',         categoriaId: electCat.id,   precio: 1650000, costo: 1200000, stock: 4,  stockMinimo: 2, proveedorId: proveedor.id },
    { codigo: 'ELC-001', nombre: 'Televisor 55" 4K Smart TV',categoriaId: elecCat.id,    precio: 1980000, costo: 1500000, stock: 6,  stockMinimo: 2, proveedorId: proveedor.id },
    { codigo: 'MUE-001', nombre: 'Sala Esquinera 5 Puestos', categoriaId: mueblesCat.id, precio: 1850000, costo: 1200000, stock: 3,  stockMinimo: 1, proveedorId: proveedor.id },
  ];

  for (const p of productosData) {
    await prisma.producto.upsert({ where: { codigo: p.codigo }, update: {}, create: p });
  }
  console.log(`✅ ${productosData.length} productos creados`);

  // Clientes demo
  const clientesData = [
    { nombre: 'María García',   documento: '52123456', cupoCredito: 5000000 },
    { nombre: 'Carlos López',   documento: '79654321', cupoCredito: 8000000 },
    { nombre: 'Lucía Herrera',  documento: '43987654', cupoCredito: 3000000 },
  ];
  for (const c of clientesData) {
    await prisma.cliente.upsert({ where: { documento_tipoDocumento: { documento: c.documento, tipoDocumento: 'CC' } }, update: {}, create: c });
  }
  console.log(`✅ ${clientesData.length} clientes demo creados`);

  console.log('\n🎉 Seed completado');
  console.log('   admin@mercaapp.co   → contraseña: admin123');
  console.log('   vendedor@mercaapp.co → contraseña: vend123');
  console.log('   cobrador@mercaapp.co → contraseña: cobr123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
