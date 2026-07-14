using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Text.Json.Serialization;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

// Configurar serialización JSON para manejar ciclos
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// Configurar base de datos (PostgreSQL - Supabase) usando connection string de appsettings
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString)
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Registrar el servicio en segundo plano para alertas de renovación
builder.Services.AddHostedService<Backend.Services.WorkerRenovaciones>();

// Habilitar política de CORS para conectar con el Frontend en React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// --- BLOQUE DE INICIALIZACIÓN Y DATA SEEDING ---
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Aplica las migraciones pendientes y crea las tablas si no existen sin borrar la BD
        db.Database.Migrate();

        // Verificar si la columna CostoProveedor existe en la tabla Productos, y si no, agregarla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name='Productos' AND column_name='CostoProveedor'
                    ) THEN 
                        ALTER TABLE ""Productos"" ADD COLUMN ""CostoProveedor"" decimal(18,2) NOT NULL DEFAULT 0.00;
                    END IF;
                END $$;");
            Console.WriteLine("Columna CostoProveedor verifada/creada con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar columna CostoProveedor: {ex.Message}");
        }

        // Verificar si la columna Activo existe en la tabla Productos, y si no, agregarla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name='Productos' AND column_name='Activo'
                    ) THEN 
                        ALTER TABLE ""Productos"" ADD COLUMN ""Activo"" BOOLEAN NOT NULL DEFAULT TRUE;
                    END IF;
                END $$;");
            Console.WriteLine("Columna Activo verificada/creada con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar columna Activo: {ex.Message}");
        }

        // Verificar si la columna Dni existe en la tabla Usuarios, y si no, agregarla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name='Usuarios' AND column_name='Dni'
                    ) THEN 
                        ALTER TABLE ""Usuarios"" ADD COLUMN ""Dni"" VARCHAR(20) DEFAULT '';
                    END IF;
                END $$;");
            Console.WriteLine("Columna Dni en Usuarios verificada/creada con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar columna Dni en Usuarios: {ex.Message}");
        }

        // Verificar si la columna Telefono existe en la tabla Usuarios, y si no, agregarla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name='Usuarios' AND column_name='Telefono'
                    ) THEN 
                        ALTER TABLE ""Usuarios"" ADD COLUMN ""Telefono"" VARCHAR(30) DEFAULT '';
                    END IF;
                END $$;");
            Console.WriteLine("Columna Telefono en Usuarios verificada/creada con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar columna Telefono en Usuarios: {ex.Message}");
        }

        // Verificar si la columna Activo existe en la tabla Usuarios, y si no, agregarla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name='Usuarios' AND column_name='Activo'
                    ) THEN 
                        ALTER TABLE ""Usuarios"" ADD COLUMN ""Activo"" BOOLEAN NOT NULL DEFAULT TRUE;
                    END IF;
                END $$;");
            Console.WriteLine("Columna Activo en Usuarios verificada/creada con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar columna Activo en Usuarios: {ex.Message}");
        }

        // Cargar y ejecutar el script SQL alter_imagen_url_length.sql directamente si existe
        var sqlPath = Path.Combine(app.Environment.ContentRootPath, "Data", "alter_imagen_url_length.sql");
        if (File.Exists(sqlPath))
        {
            try
            {
                var sqlScript = File.ReadAllText(sqlPath);
                db.Database.ExecuteSqlRaw(sqlScript);
                Console.WriteLine("Script SQL alter_imagen_url_length.sql ejecutado con éxito.");
            }
            catch (Exception sqlEx)
            {
                Console.WriteLine($"Error al ejecutar script SQL: {sqlEx.Message}");
            }
        }

        // Semilla del Usuario Administrador
        var adminEmail = "admin@informatics.com";
        if (!db.Usuarios.Any(u => u.Email == adminEmail))
        {
            var adminUser = new Usuario
            {
                Nombre = "Admin Informatics",
                Email = adminEmail,
                Rol = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminTemp2026!"),
                WhatsApp = "51984497138",
                Dni = "00000000",
                Telefono = "51984497138",
                Activo = true
            };
            db.Usuarios.Add(adminUser);
            db.SaveChanges();
            Console.WriteLine("Usuario administrador semilla registrado con éxito.");
        }

        // Semilla del Catálogo Completo (23 Productos) con mapeo de imágenes y costos del proveedor
        var catalogToSeed = new List<Producto>
        {
            // 1. Licencias Anuales (Software)
            new Producto { Nombre = "Canva Pro (Anual)", Descripcion = "Acceso premium administrado mediante equipo", Precio = 49.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/canva.png", CostoProveedor = 20.00m, Activo = true },
            new Producto { Nombre = "CapCut Pro (Anual)", Descripcion = "Edición de video premium anual", Precio = 69.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/capcut.png", CostoProveedor = 30.00m, Activo = true },
            new Producto { Nombre = "ESET Internet Security", Descripcion = "Activación retail de 365 días", Precio = 39.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/eset.png", CostoProveedor = 15.00m, Activo = true },
            new Producto { Nombre = "Office 365 A3", Descripcion = "Suscripción anual educativa de Office 365", Precio = 59.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/office365.png", CostoProveedor = 25.00m, Activo = true },
            new Producto { Nombre = "Adobe Creative Cloud", Descripcion = "Acceso completo a todas las aplicaciones creativas", Precio = 120.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/adobe.png", CostoProveedor = 60.00m, Activo = true },
            new Producto { Nombre = "Autodesk Standard", Descripcion = "Licencia oficial Autodesk Suite Standard", Precio = 150.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/autodeskstandado.png", CostoProveedor = 70.00m, Activo = true },
            new Producto { Nombre = "Autodesk Revit", Descripcion = "Diseño arquitectónico y modelado BIM profesional", Precio = 180.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/autodeskrevit.png", CostoProveedor = 90.00m, Activo = true },
            new Producto { Nombre = "AutoCAD", Descripcion = "Diseño asistido por computadora 2D y 3D", Precio = 190.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/autocad.png", CostoProveedor = 100.00m, Activo = true },

            // 2. Accesos Mensuales (IA & Streaming)
            new Producto { Nombre = "ChatGPT Plus (1 Mes)", Descripcion = "Cuenta compartida perfil premium", Precio = 19.90m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/chatgpt.png", CostoProveedor = 10.00m, Activo = true },
            new Producto { Nombre = "Gemini Advanced (1 Mes)", Descripcion = "Acceso premium a Gemini 1.5 Pro y Ultra", Precio = 22.00m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/gemini.png", CostoProveedor = 12.00m, Activo = true },
            new Producto { Nombre = "Supergrok (1 Mes)", Descripcion = "Acceso premium a Grok de xAI", Precio = 15.00m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/supergrok.png", CostoProveedor = 8.00m, Activo = true },
            new Producto { Nombre = "YouTube Premium (1 Mes)", Descripcion = "Sin anuncios y reproducción en segundo plano", Precio = 10.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/youtubepremium.png", CostoProveedor = 4.50m, Activo = true },
            new Producto { Nombre = "Spotify Premium (1 Mes)", Descripcion = "Música sin anuncios y modo sin conexión", Precio = 9.90m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/spotifypremium.png", CostoProveedor = 4.00m, Activo = true },
            new Producto { Nombre = "Netflix Premium (1 Mes)", Descripcion = "Cuenta completa o pantalla ultra HD", Precio = 15.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/netflix.png", CostoProveedor = 7.00m, Activo = true },
            new Producto { Nombre = "HBO Max (1 Mes)", Descripcion = "Perfil de streaming mensual", Precio = 12.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/hbomax.png", CostoProveedor = 5.00m, Activo = true },
            new Producto { Nombre = "Prime Video (1 Mes)", Descripcion = "Películas y series exclusivas de Amazon", Precio = 8.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/primevideo.png", CostoProveedor = 3.00m, Activo = true },
            new Producto { Nombre = "Paramount (1 Mes)", Descripcion = "Suscripción mensual de Paramount+", Precio = 7.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/paramount.png", CostoProveedor = 2.50m, Activo = true },

            // 3. Licencias Perpetuas (Software)
            new Producto { Nombre = "Windows 10 Pro", Descripcion = "Licencia OEM enlazada al hardware", Precio = 25.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/windows10.png", CostoProveedor = 10.00m, Activo = true },
            new Producto { Nombre = "Windows 11 Pro", Descripcion = "Licencia OEM enlazada al hardware", Precio = 29.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/windows.png", CostoProveedor = 12.00m, Activo = true },
            new Producto { Nombre = "Office Profesional Plus 2021", Descripcion = "Licencia perpetua de Office 2021", Precio = 35.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/office2021.png", CostoProveedor = 15.00m, Activo = true },
            new Producto { Nombre = "Office Profesional Plus 2024", Descripcion = "Licencia perpetua de Office 2024", Precio = 45.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/office2024.png", CostoProveedor = 20.00m, Activo = true },
            new Producto { Nombre = "Nitro 14", Descripcion = "Editor y creador de PDF profesional", Precio = 30.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/nitro14.png", CostoProveedor = 12.00m, Activo = true },
            new Producto { Nombre = "Filmora", Descripcion = "Editor de video simple y creativo perpetuo", Precio = 40.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/filmora.png", CostoProveedor = 18.00m, Activo = true }
        };

        foreach (var p in catalogToSeed)
        {
            var existingProd = db.Productos.FirstOrDefault(prod => prod.Nombre == p.Nombre);
            if (existingProd == null)
            {
                db.Productos.Add(p);
            }
            else
            {
                // Actualizar los datos del catálogo, incluyendo CostoProveedor, Activo e ImagenUrl
                existingProd.Descripcion = p.Descripcion;
                existingProd.Precio = p.Precio;
                existingProd.DuracionMeses = p.DuracionMeses;
                existingProd.Categoria = p.Categoria;
                existingProd.ImagenUrl = p.ImagenUrl;
                existingProd.CostoProveedor = p.CostoProveedor;
                existingProd.Activo = p.Activo;
            }
        }
        db.SaveChanges();
        Console.WriteLine("Catálogo oficial sembrado y actualizado correctamente con costos de proveedor y bandera Activo.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al sembrar o reparar la base de datos: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

// --- ENDPOINTS DE LA API CON MANEJO DE ERRORES BLINDADO ---

// 0. HEALTH CHECK (PÚBLICO - ULTRA-LIGERO)
app.MapGet("/api/ping", () =>
{
    try
    {
        return Results.Ok(new { status = "healthy" });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: HealthCheckPing\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error interno en el servidor.", detalle = ex.Message }, statusCode: 500);
    }
});

// 1. REGISTRO DE USUARIO (PÚBLICO)
app.MapPost("/api/auth/register", async (RegisterDto registerDto, ApplicationDbContext db) =>
{
    try
    {
        if (registerDto == null || string.IsNullOrWhiteSpace(registerDto.Email) || string.IsNullOrWhiteSpace(registerDto.Nombre) || string.IsNullOrWhiteSpace(registerDto.WhatsApp) || string.IsNullOrWhiteSpace(registerDto.PasswordHash))
        {
            return Results.BadRequest(new { mensaje = "Todos los campos son obligatorios." });
        }

        var existe = await db.Usuarios.AnyAsync(u => u.Email == registerDto.Email);
        if (existe)
        {
            return Results.Conflict(new { mensaje = "El correo electrónico ya está registrado." });
        }

        var usuario = new Usuario
        {
            Nombre = registerDto.Nombre,
            Email = registerDto.Email,
            WhatsApp = registerDto.WhatsApp,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.PasswordHash),
            Rol = "Cliente",
            Activo = true,
            Dni = string.Empty,
            Telefono = registerDto.WhatsApp
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        return Results.Created($"/api/auth/usuario/{usuario.Id}", new { id = usuario.Id, nombre = usuario.Nombre, email = usuario.Email, rol = usuario.Rol });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AuthRegister\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error interno en el servidor.", detalle = ex.Message }, statusCode: 500);
    }
});

// 2. INICIO DE SESIÓN (LOGIN)
app.MapPost("/api/auth/login", async (LoginDto loginDto, ApplicationDbContext db) =>
{
    try
    {
        if (loginDto == null || string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return Results.BadRequest(new { mensaje = "Debe proveer correo y contraseña." });
        }

        Usuario? usuario = null;
        try
        {
            usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == loginDto.Email && u.Activo);
        }
        catch (Exception dbEx)
        {
            var logDb = $"Fecha: {DateTime.UtcNow}\nComponente: AuthLoginDbQuery\nMensaje: {dbEx.Message}\nTraza: {dbEx.StackTrace}";
            Console.WriteLine(logDb);
            return Results.Json(new { 
                mensaje = "Error al consultar la base de datos (posible restricción de políticas RLS o conexión de red).", 
                detalle = dbEx.Message 
            }, statusCode: 500);
        }

        if (usuario == null)
        {
            int totalUsuariosVisibles = 0;
            try
            {
                totalUsuariosVisibles = await db.Usuarios.CountAsync();
            }
            catch (Exception)
            {
                // Ignorar error secundario al contar
            }

            Console.WriteLine($"[AuthLogin] Fallo de credenciales para {loginDto.Email}. Total usuarios visibles: {totalUsuariosVisibles}");

            return Results.Json(new { 
                mensaje = "Credenciales inválidas.",
                diagnostico = $"El usuario no fue encontrado o RLS está bloqueando la consulta. Total usuarios visibles en tabla: {totalUsuariosVisibles}"
            }, statusCode: 401);
        }

        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, usuario.PasswordHash))
        {
            return Results.Json(new { mensaje = "Credenciales inválidas." }, statusCode: 401);
        }

        // Generar un token JWT real firmado
        var token = JwtHelper.GenerarToken(usuario.Id, usuario.Email, usuario.Rol);

        return Results.Ok(new { 
            token = token, 
            usuario = new { id = usuario.Id, nombre = usuario.Nombre, email = usuario.Email, whatsapp = usuario.WhatsApp, rol = usuario.Rol } 
        });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AuthLoginGeneric\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error interno en el servidor.", detalle = ex.Message }, statusCode: 500);
    }
});

// 3. OBTENER CATALOGO PÚBLICO (RETORNA EXCLUSIVAMENTE PRODUCTOS CON ACTIVO == TRUE)
app.MapGet("/api/productos", async (ApplicationDbContext db) =>
{
    try
    {
        var productos = await db.Productos
            .Where(producto => producto.Activo)
            .Select(producto => new ProductoExternoDto(
                producto.Id,
                producto.Nombre,
                producto.Descripcion,
                producto.Precio,
                producto.DuracionMeses,
                producto.Categoria,
                producto.ImagenUrl,
                producto.Activo
            ))
            .ToListAsync();
        return Results.Ok(productos);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: GetProductos\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al obtener productos." }, statusCode: 500);
    }
});

// 4. CREAR ORDEN
app.MapPost("/api/ordenes", async (CrearOrdenDto dto, ApplicationDbContext db) =>
{
    try
    {
        var usuario = await db.Usuarios.FindAsync(dto.UsuarioId);
        if (usuario == null || !usuario.Activo)
        {
            return Results.NotFound(new { mensaje = "Usuario no encontrado." });
        }

        if (dto.Items == null || dto.Items.Count == 0)
        {
            return Results.BadRequest(new { mensaje = "El carrito no contiene productos." });
        }

        decimal totalAcumulado = 0;
        var detalles = new List<DetalleOrden>();

        foreach (var item in dto.Items)
        {
            var prod = await db.Productos.FindAsync(item.ProductoId);
            if (prod == null || !prod.Activo)
            {
                return Results.BadRequest(new { mensaje = $"Producto con ID {item.ProductoId} no existe o está inactivo." });
            }

            var precioUnitario = prod.Precio;
            totalAcumulado += precioUnitario * item.Cantidad;

            detalles.Add(new DetalleOrden
            {
                ProductoId = prod.Id,
                Cantidad = item.Cantidad,
                PrecioUnitario = precioUnitario,
                AlertaEnviada = false
            });
        }

        var orden = new Orden
        {
            UsuarioId = dto.UsuarioId,
            FechaCreacion = DateTime.UtcNow,
            Estado = "Pendiente",
            Total = totalAcumulado,
            Detalles = detalles
        };

        db.Ordenes.Add(orden);
        await db.SaveChangesAsync();

        string whatsappAdmin = "51984497138"; 
        string mensajeWhatsApp = Uri.EscapeDataString(
            $"¡Hola Informatics! He registrado mi pedido en la web.\n\n" +
            $"*Pedido N°:* #{orden.Id}\n" +
            $"*Cliente:* {usuario.Nombre}\n" +
            $"*Total:* S/ {orden.Total:F2}\n\n" +
            $"Por favor, indíquenme las cuentas de pago para recibir mis accesos."
        );

        string whatsappUrl = $"https://api.whatsapp.com/send?phone={whatsappAdmin}&text={mensajeWhatsApp}";

        return Results.Created($"/api/ordenes/{orden.Id}", new { 
            ordenId = orden.Id, 
            total = orden.Total, 
            estado = orden.Estado, 
            redirectUrl = whatsappUrl 
        });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: PostOrden\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al crear la orden." }, statusCode: 500);
    }
});

// 5. PANEL DE CLIENTE: LICENCIAS Y ESTADOS TEMPORALES
app.MapGet("/api/ordenes/cliente/{usuarioId}", async (int usuarioId, HttpContext httpContext, ApplicationDbContext db) =>
{
    try
    {
        var authUserId = (int?)httpContext.Items["UsuarioId"];
        var authRole = (string?)httpContext.Items["Rol"];
        
        if (authUserId != usuarioId && authRole != "Admin" && authRole != "Administrador")
        {
            return Results.Json(new { mensaje = "Acceso denegado. No tiene permisos para consultar este historial." }, statusCode: 403);
        }

        var ordenes = await db.Ordenes
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(o => o.UsuarioId == usuarioId)
            .OrderByDescending(o => o.FechaCreacion)
            .ToListAsync();

        var servicios = ordenes
            .SelectMany(o => o.Detalles.Select(d => {
                var mesesRestantes = 0;
                var expirado = false;
                if (d.FechaVencimiento.HasValue)
                {
                    var dias = (d.FechaVencimiento.Value - DateTime.UtcNow).TotalDays;
                    mesesRestantes = (int)Math.Max(0, Math.Ceiling(dias / 30));
                    expirado = DateTime.UtcNow > d.FechaVencimiento.Value;
                }

                return new {
                    detalleId = d.Id,
                    productoNombre = d.Producto?.Nombre,
                    categoria = d.Producto?.Categoria,
                    duracionMeses = d.Producto?.DuracionMeses,
                    clave = d.ClaveEntregada,
                    estadoOrden = o.Estado,
                    fechaActivacion = d.FechaActivacion,
                    fechaVencimiento = d.FechaVencimiento,
                    mesesRestantes = mesesRestantes,
                    expirado = expirado
                };
            }))
            .ToList();

        return Results.Ok(servicios);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: GetClienteOrdenes\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al consultar licencias del cliente." }, statusCode: 500);
    }
}).RequireAuthentication();

// 6. BACKOFFICE: GESTIÓN DE ÓRDENES
app.MapGet("/api/admin/ordenes", async (ApplicationDbContext db) =>
{
    try
    {
        var ordenes = await db.Ordenes
            .Include(o => o.Usuario)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Producto)
            .OrderByDescending(o => o.FechaCreacion)
            .ToListAsync();

        return Results.Ok(ordenes);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetOrdenes\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al obtener órdenes para el administrador." }, statusCode: 500);
    }
}).RequireAdminRole();

// 7. BACKOFFICE: COMPLETAR ORDEN Y ENTRADA DE CLAVE (CALCULA FECHA DE VENCIMIENTO SI DURA > 0 MESES)
app.MapPut("/api/admin/ordenes/{ordenId}/completar", async (int ordenId, CompletarOrdenDto dto, ApplicationDbContext db) =>
{
    try
    {
        var orden = await db.Ordenes
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(o => o.Id == ordenId);

        if (orden == null)
        {
            return Results.NotFound(new { mensaje = "Orden no encontrada." });
        }

        orden.Estado = "Completada";
        
        foreach (var detalle in orden.Detalles)
        {
            if (dto.ClavesPorDetalle != null && dto.ClavesPorDetalle.TryGetValue(detalle.Id, out var clave))
            {
                detalle.ClaveEntregada = clave;
            }
            else
            {
                detalle.ClaveEntregada = "AUTOGENERADO-INFORMATICS-KEY";
            }

            detalle.FechaActivacion = DateTime.UtcNow;

            // Consultar producto de la BD para asegurar persistencia
            var product = await db.Productos.FindAsync(detalle.ProductoId);
            if (product != null)
            {
                if (product.DuracionMeses == 1)
                {
                    detalle.FechaVencimiento = DateTime.UtcNow.AddDays(30);
                }
                else if (product.DuracionMeses > 1)
                {
                    detalle.FechaVencimiento = DateTime.UtcNow.AddMonths(product.DuracionMeses);
                }
                else
                {
                    // Para licencias permanentes (0 meses), guardamos un vencimiento a 10 años para evitar que viaje como NULL
                    detalle.FechaVencimiento = DateTime.UtcNow.AddYears(10);
                }
            }
            else
            {
                // En caso de que el producto sea nulo, asignamos por defecto 30 días para evitar valores nulos en BD
                detalle.FechaVencimiento = DateTime.UtcNow.AddDays(30);
            }

            detalle.AlertaEnviada = false;
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { mensaje = "Orden completada y licencias aprovisionadas con éxito.", ordenId = orden.Id });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminCompletarOrden\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al completar la orden." }, statusCode: 500);
    }
}).RequireAdminRole();

// 7b. BACKOFFICE: CANCELAR ORDEN
app.MapPut("/api/admin/ordenes/{id}/cancelar", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var orden = await db.Ordenes
            .Include(o => o.Detalles)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (orden == null)
        {
            return Results.NotFound(new { mensaje = "Orden no encontrada." });
        }

        orden.Estado = "Cancelada";
        
        await db.SaveChangesAsync();
        return Results.Ok(new { mensaje = "Orden cancelada con éxito.", ordenId = orden.Id });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminCancelarOrden\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al cancelar la orden." }, statusCode: 500);
    }
}).RequireAdminRole();

// 7c. BACKOFFICE: EDITAR CANTIDADES DE ORDEN PENDIENTE (RECALCULA EL TOTAL)
app.MapPut("/api/admin/ordenes/{id}/editar", async (int id, EditarOrdenDto dto, ApplicationDbContext db) =>
{
    try
    {
        var orden = await db.Ordenes
            .Include(o => o.Detalles)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (orden == null)
        {
            return Results.NotFound(new { mensaje = "Orden no encontrada." });
        }

        if (orden.Estado != "Pendiente")
        {
            return Results.BadRequest(new { mensaje = "Solo se pueden editar órdenes en estado Pendiente." });
        }

        if (dto.Items == null || dto.Items.Count == 0)
        {
            return Results.BadRequest(new { mensaje = "La orden debe contener al menos un producto." });
        }

        // Limpiar detalles viejos
        db.DetalleOrdenes.RemoveRange(orden.Detalles);
        orden.Detalles.Clear();

        decimal totalAcumulado = 0;
        foreach (var item in dto.Items)
        {
            var prod = await db.Productos.FindAsync(item.ProductoId);
            if (prod == null || !prod.Activo)
            {
                return Results.BadRequest(new { mensaje = $"Producto con ID {item.ProductoId} no existe o está inactivo." });
            }

            var precioUnitario = prod.Precio;
            totalAcumulado += precioUnitario * item.Cantidad;

            orden.Detalles.Add(new DetalleOrden
            {
                ProductoId = prod.Id,
                Cantidad = item.Cantidad,
                PrecioUnitario = precioUnitario,
                AlertaEnviada = false
            });
        }

        orden.Total = totalAcumulado;
        await db.SaveChangesAsync();

        return Results.Ok(new { mensaje = "Orden editada y total recalculado con éxito.", ordenId = orden.Id, nuevoTotal = orden.Total });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminEditarOrden\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al editar la orden.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 8. DASHBOARD INTERNO: ALERTAS DE RENOVACIÓN DE MENOS O IGUAL A 5 DÍAS
app.MapGet("/api/admin/renovaciones", async (ApplicationDbContext db) =>
{
    try
    {
        // Vencimiento menor o igual a 5 días
        DateTime targetDate = DateTime.UtcNow.Date.AddDays(5);
        
        var renovaciones = await db.DetalleOrdenes
            .Include(d => d.Producto)
            .Include(d => d.Orden)
                .ThenInclude(o => o!.Usuario)
            .Where(d => d.FechaVencimiento != null 
                     && d.FechaVencimiento.Value.Date <= targetDate 
                     && d.FechaVencimiento.Value.Date >= DateTime.UtcNow.Date)
            .Select(d => new {
                detalleId = d.Id,
                clienteNombre = d.Orden!.Usuario!.Nombre,
                clienteEmail = d.Orden.Usuario.Email,
                clienteWhatsApp = d.Orden.Usuario.WhatsApp,
                productoNombre = d.Producto!.Nombre,
                fechaVencimiento = d.FechaVencimiento,
                alertaEnviada = d.AlertaEnviada
            })
            .ToListAsync();

        return Results.Ok(renovaciones);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetRenovaciones\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al consultar renovaciones." }, statusCode: 500);
    }
}).RequireAdminRole();

// --- NUEVOS ENDPOINTS ARCHITECTURA EMPRESARIAL ---

// 9. CRUD PRODUCTOS - LISTAR TODOS (SÓLO RETORNA PRODUCTOS CON ACTIVO == TRUE)
app.MapGet("/api/admin/productos", async (ApplicationDbContext db) =>
{
    try
    {
        var productos = await db.Productos.Where(p => p.Activo).OrderBy(p => p.Nombre).ToListAsync();
        return Results.Ok(productos);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetProductos\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al obtener catálogo de productos.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 10. CRUD PRODUCTOS - CREAR
app.MapPost("/api/admin/productos", async (Producto producto, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(producto.Nombre) || string.IsNullOrWhiteSpace(producto.Categoria))
        {
            return Results.BadRequest(new { mensaje = "El nombre y la categoría son campos obligatorios." });
        }

        db.Productos.Add(producto);
        await db.SaveChangesAsync();
        return Results.Created($"/api/productos/{producto.Id}", producto);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminCreateProducto\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al registrar el producto.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 11. CRUD PRODUCTOS - ACTUALIZAR
app.MapPut("/api/admin/productos/{id}", async (int id, Producto producto, ApplicationDbContext db) =>
{
    try
    {
        var existing = await db.Productos.FindAsync(id);
        if (existing == null)
        {
            return Results.NotFound(new { mensaje = "Producto no encontrado." });
        }

        existing.Nombre = producto.Nombre;
        existing.Descripcion = producto.Descripcion;
        existing.Precio = producto.Precio;
        existing.DuracionMeses = producto.DuracionMeses;
        existing.Categoria = producto.Categoria;
        existing.ImagenUrl = producto.ImagenUrl;
        existing.CostoProveedor = producto.CostoProveedor;
        existing.Activo = producto.Activo;

        await db.SaveChangesAsync();
        return Results.Ok(existing);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminUpdateProducto\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al actualizar el producto.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 12. CRUD PRODUCTOS - ELIMINAR (MIGRADO A BORRADO LÓGICO PARA PRESERVAR INTEGRIDAD REFERENCIAL)
app.MapDelete("/api/admin/productos/{id}", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var product = await db.Productos.FindAsync(id);
        if (product == null)
        {
            return Results.NotFound(new { mensaje = "Producto no encontrado." });
        }

        // Borrado lógico toggling Activo = false
        product.Activo = false;
        await db.SaveChangesAsync();
        
        return Results.Ok(new { mensaje = "Producto desactivado con éxito del catálogo." });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminDeleteProducto\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al desactivar el producto.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 13. GESTIÓN DE CLIENTES CON ESTADÍSTICAS (SÓLO RETORNA CLIENTES ACTIVOS)
app.MapGet("/api/admin/clientes", async (ApplicationDbContext db) =>
{
    try
    {
        var clientes = await db.Usuarios
            .Where(u => u.Rol == "Cliente" && u.Activo)
            .Select(u => new
            {
                id = u.Id,
                nombre = u.Nombre,
                email = u.Email,
                whatsapp = u.WhatsApp,
                dni = u.Dni,
                telefono = u.Telefono,
                totalPedidosCompletados = u.Ordenes.Count(o => o.Estado == "Completada"),
                totalInvertido = u.Ordenes.Where(o => o.Estado == "Completada").Sum(o => (decimal?)o.Total) ?? 0.00m
            })
            .ToListAsync();

        return Results.Ok(clientes);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetClientes\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al obtener el listado de clientes.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 13b. GESTIÓN DE CLIENTES - REGISTRAR CLIENTE MANUALMENTE (CON CONTRASEÑA ENCRIPTADA Y DNI / TELEFONO)
app.MapPost("/api/admin/clientes", async (RegistrarClienteDto dto, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.PasswordInicial))
        {
            return Results.BadRequest(new { mensaje = "El nombre, correo y contraseña inicial son obligatorios." });
        }

        var existe = await db.Usuarios.AnyAsync(u => u.Email == dto.Email);
        if (existe)
        {
            return Results.Conflict(new { mensaje = "El correo electrónico ya está registrado." });
        }

        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Email = dto.Email,
            Dni = dto.Dni ?? string.Empty,
            Telefono = dto.Telefono ?? string.Empty,
            WhatsApp = dto.Telefono ?? string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordInicial),
            Rol = "Cliente",
            Activo = true
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        return Results.Created($"/api/admin/clientes/{usuario.Id}", new { id = usuario.Id, nombre = usuario.Nombre, email = usuario.Email });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminCreateCliente\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al registrar el cliente.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 13c. GESTIÓN DE CLIENTES - ACTUALIZAR PERFIL Y NUEVA CONTRASEÑA OPCIONAL
app.MapPut("/api/admin/clientes/{id}", async (int id, EditarClienteDto dto, ApplicationDbContext db) =>
{
    try
    {
        var user = await db.Usuarios.FindAsync(id);
        if (user == null || !user.Activo)
        {
            return Results.NotFound(new { mensaje = "Cliente no encontrado o inactivo." });
        }

        if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Email))
        {
            return Results.BadRequest(new { mensaje = "El nombre y el correo electrónico son campos obligatorios." });
        }

        var correoExiste = await db.Usuarios.AnyAsync(u => u.Email == dto.Email && u.Id != id);
        if (correoExiste)
        {
            return Results.Conflict(new { mensaje = "El correo electrónico ya está en uso por otro usuario." });
        }

        user.Nombre = dto.Nombre;
        user.Email = dto.Email;
        user.Dni = dto.Dni ?? string.Empty;
        user.Telefono = dto.Telefono ?? string.Empty;
        user.WhatsApp = dto.Telefono ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(dto.AsignarNuevaContrasena))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AsignarNuevaContrasena);
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { mensaje = "Cliente actualizado con éxito.", id = user.Id });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminUpdateCliente\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al actualizar el cliente.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 13d. GESTIÓN DE CLIENTES - ELIMINAR/DESACTIVAR CLIENTE DE FORMA SEGURA (BORRADO LÓGICO)
app.MapDelete("/api/admin/clientes/{id}", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var user = await db.Usuarios.FindAsync(id);
        if (user == null)
        {
            return Results.NotFound(new { mensaje = "Cliente no encontrado." });
        }

        user.Activo = false;
        await db.SaveChangesAsync();
        
        return Results.Ok(new { mensaje = "Cliente desactivado con éxito." });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminDeleteCliente\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al desactivar el cliente.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 13e. GESTIÓN DE LICENCIAS - ELIMINAR/DESACTIVAR REGISTRO DE LICENCIA
app.MapDelete("/api/admin/licencias/{id}", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var detalle = await db.DetalleOrdenes.FindAsync(id);
        if (detalle == null)
        {
            return Results.NotFound(new { mensaje = "Licencia no encontrada." });
        }

        db.DetalleOrdenes.Remove(detalle);
        await db.SaveChangesAsync();

        return Results.Ok(new { mensaje = "Licencia eliminada con éxito." });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminDeleteLicencia\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al eliminar la licencia.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 14. REPORTES COMERCIALES Y CONSOLIDADOS FINANCIEROS (SIN CONTROL DE STOCK LOCAL)
app.MapGet("/api/admin/reportes", async (ApplicationDbContext db) =>
{
    try
    {
        // Obtener órdenes completadas con detalles para procesar costos de proveedor
        var ordenesCompletadas = await db.Ordenes
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(o => o.Estado == "Completada")
            .ToListAsync();

        decimal ingresosBrutos = ordenesCompletadas.Sum(o => o.Total);
        decimal costosOperacion = ordenesCompletadas.Sum(o => o.Detalles.Sum(d => (d.Producto?.CostoProveedor ?? 0.00m) * d.Cantidad));
        decimal gananciaNetaReal = ingresosBrutos - costosOperacion;

        // Distribución numérica del total de licencias despachadas por categoría
        var licenciasPorCategoria = ordenesCompletadas
            .SelectMany(o => o.Detalles)
            .Where(d => d.Producto != null)
            .GroupBy(d => d.Producto!.Categoria)
            .Select(g => new
            {
                categoria = g.Key,
                cantidad = g.Sum(d => d.Cantidad)
            })
            .ToList();

        return Results.Ok(new
        {
            ingresosBrutos,
            costosOperacion,
            gananciaNetaReal,
            licenciasPorCategoria
        });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetReportes\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al procesar el reporte financiero consolidado.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

app.Run();

// --- DATA TRANSFER OBJECTS (DTOs) ---
public record LoginDto(string Email, string Password);
public record RegisterDto(string Nombre, string Email, string PasswordHash, string WhatsApp);
public record ItemOrdenDto(int ProductoId, int Cantidad);
public record CrearOrdenDto(int UsuarioId, List<ItemOrdenDto> Items);
public record CompletarOrdenDto(Dictionary<int, string>? ClavesPorDetalle);
public record EditarOrdenDto(List<ItemOrdenDto> Items);
public record RegistrarClienteDto(string Nombre, string Email, string? Dni, string? Telefono, string PasswordInicial);
public record EditarClienteDto(string Nombre, string Email, string? Dni, string? Telefono, string? AsignarNuevaContrasena);
public record ProductoExternoDto(int Id, string Nombre, string Descripcion, decimal Precio, int DuracionMeses, string Categoria, string ImagenUrl, bool Activo);

// --- JWT TOKEN GENERATION HELPER ---
public static class JwtHelper
{
    private static string Base64UrlEncode(byte[] input)
    {
        return Convert.ToBase64String(input)
            .Replace("=", "")
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string input)
    {
        string output = input.Replace('-', '+').Replace('_', '/');
        switch (output.Length % 4)
        {
            case 0: break;
            case 2: output += "=="; break;
            case 3: output += "="; break;
            default: throw new ArgumentOutOfRangeException(nameof(input), "Cadena base64url no válida.");
        }
        return Convert.FromBase64String(output);
    }

    public static string GenerarToken(int usuarioId, string email, string rol)
    {
        var header = new { alg = "HS256", typ = "JWT" };
        var payload = new Dictionary<string, object>
        {
            { "sub", usuarioId.ToString() },
            { "email", email },
            { "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", rol },
            { "exp", DateTimeOffset.UtcNow.AddHours(24).ToUnixTimeSeconds() }
        };

        string headerJson = JsonSerializer.Serialize(header);
        string payloadJson = JsonSerializer.Serialize(payload);

        string headerBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
        string payloadBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

        string message = $"{headerBase64}.{payloadBase64}";
        
        string secret = "InformaticsSuperSecretKeyForJWTAuth2026";
        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret)))
        {
            byte[] signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
            string signatureBase64 = Base64UrlEncode(signatureBytes);
            return $"{message}.{signatureBase64}";
        }
    }

    public static (bool Valido, int UsuarioId, string Email, string Rol) ValidarToken(string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token)) return (false, 0, "", "");

            var parts = token.Split('.');
            if (parts.Length != 3) return (false, 0, "", "");

            var headerBase64 = parts[0];
            var payloadBase64 = parts[1];
            var signatureBase64 = parts[2];

            string message = $"{headerBase64}.{payloadBase64}";
            string secret = "InformaticsSuperSecretKeyForJWTAuth2026";
            
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret)))
            {
                byte[] signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
                string computedSignature = Base64UrlEncode(signatureBytes);
                if (computedSignature != signatureBase64) return (false, 0, "", "");
            }

            var payloadBytes = Base64UrlDecode(payloadBase64);
            var payloadJson = Encoding.UTF8.GetString(payloadBytes);
            var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(payloadJson);
            if (payload == null) return (false, 0, "", "");

            if (payload.TryGetValue("exp", out var expObj))
            {
                long exp = 0;
                if (expObj is JsonElement element && element.ValueKind == JsonValueKind.Number)
                {
                    exp = element.GetInt64();
                }
                else
                {
                    exp = Convert.ToInt64(expObj);
                }

                if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > exp)
                {
                    return (false, 0, "", ""); // Expirado
                }
            }

            int usuarioId = 0;
            if (payload.TryGetValue("sub", out var subObj))
            {
                usuarioId = int.Parse(subObj.ToString()!);
            }

            string email = "";
            if (payload.TryGetValue("email", out var emailObj))
            {
                email = emailObj.ToString()!;
            }

            string rol = "";
            if (payload.TryGetValue("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", out var rolObj))
            {
                rol = rolObj.ToString()!;
            }

            return (true, usuarioId, email, rol);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al validar token: {ex.Message}");
            return (false, 0, "", "");
        }
    }
}

// --- MIDDLEWARE / FILTROS DE AUTORIZACIÓN PARA MINIMAL APIS ---
public static class AuthorizationFilters
{
    public static RouteHandlerBuilder RequireAuthentication(this RouteHandlerBuilder builder)
    {
        return builder.AddEndpointFilter(async (context, next) =>
        {
            try
            {
                var httpContext = context.HttpContext;
                
                if (!httpContext.Request.Headers.TryGetValue("Authorization", out var authHeaderValues))
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Falta cabecera de autorización." }, statusCode: 401);
                }

                var authHeader = authHeaderValues.ToString();
                if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Formato de token inválido." }, statusCode: 401);
                }

                var token = authHeader.Substring("Bearer ".Length).Trim();
                var (valido, usuarioId, email, rol) = JwtHelper.ValidarToken(token);

                if (!valido)
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Token inválido o expirado." }, statusCode: 401);
                }

                httpContext.Items["UsuarioId"] = usuarioId;
                httpContext.Items["Email"] = email;
                httpContext.Items["Rol"] = rol;

                return await next(context);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en filtro de autenticación: {ex.Message}\n{ex.StackTrace}");
                return Results.Json(new { mensaje = "Error interno durante la autenticación.", detalle = ex.Message }, statusCode: 500);
            }
        });
    }

    public static RouteHandlerBuilder RequireAdminRole(this RouteHandlerBuilder builder)
    {
        return builder.AddEndpointFilter(async (context, next) =>
        {
            try
            {
                var httpContext = context.HttpContext;
                
                if (!httpContext.Request.Headers.TryGetValue("Authorization", out var authHeaderValues))
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Falta cabecera de autorización." }, statusCode: 401);
                }

                var authHeader = authHeaderValues.ToString();
                if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Formato de token inválido." }, statusCode: 401);
                }

                var token = authHeader.Substring("Bearer ".Length).Trim();
                var (valido, usuarioId, email, rol) = JwtHelper.ValidarToken(token);

                if (!valido)
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Token inválido o expirado." }, statusCode: 401);
                }

                if (rol != "Admin" && rol != "Administrador")
                {
                    return Results.Json(new { mensaje = "Acceso denegado. Se requiere rol de Administrador." }, statusCode: 403);
                }

                httpContext.Items["UsuarioId"] = usuarioId;
                httpContext.Items["Email"] = email;
                httpContext.Items["Rol"] = rol;

                return await next(context);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en filtro de autorización de administrador: {ex.Message}\n{ex.StackTrace}");
                return Results.Json(new { mensaje = "Error interno durante la autorización.", detalle = ex.Message }, statusCode: 500);
            }
        });
    }
}