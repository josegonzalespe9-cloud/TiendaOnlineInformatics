-- SECCIÓN 1: ALTERACIÓN DE LA TABLA PRODUCTOS
ALTER TABLE "Productos" ALTER COLUMN "ImagenUrl" TYPE
VARCHAR
(2048);

-- SECCIÓN 2: ACTUALIZACIÓN DE LAS RUTAS ESTÁTICAS LOCALES
UPDATE "Productos" SET "ImagenUrl" = '/canva.png' WHERE "Nombre" = 'Canva Pro (Anual)';
UPDATE "Productos" SET "ImagenUrl" = '/capcut.png' WHERE "Nombre" = 'CapCut Pro (Anual)';
UPDATE "Productos" SET "ImagenUrl" = '/eset.png' WHERE "Nombre" = 'ESET Internet Security';
UPDATE "Productos" SET "ImagenUrl" = '/windows.png' WHERE "Nombre" = 'Windows 11 Pro';
UPDATE "Productos" SET "ImagenUrl" = '/chatgpt.png' WHERE "Nombre" = 'ChatGPT Plus (1 Mes)';
UPDATE "Productos" SET "ImagenUrl" = '/netflix.png' WHERE "Nombre" = 'Netflix Premium (1 Mes)';
UPDATE "Productos" SET "ImagenUrl" = '/hbomax.png' WHERE "Nombre" = 'HBO Max (1 Mes)';