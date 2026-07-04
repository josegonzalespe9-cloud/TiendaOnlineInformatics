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
                WhatsApp = "51900000000"
            };
            db.Usuarios.Add(adminUser);
            db.SaveChanges();
            Console.WriteLine("Usuario administrador semilla registrado con éxito.");
        }

        // Semilla del Catálogo Completo (23 Productos) con mapeo exacto de imágenes
        var catalogToSeed = new List<Producto>
        {
            // 1. Licencias Anuales (Software)
            new Producto { Nombre = "Canva Pro (Anual)", Descripcion = "Acceso premium administrado mediante equipo", Precio = 49.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/canva.png" },
            new Producto { Nombre = "CapCut Pro (Anual)", Descripcion = "Edición de video premium anual", Precio = 69.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/capcut.png" },
            new Producto { Nombre = "ESET Internet Security", Descripcion = "Activación retail de 365 días", Precio = 39.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/eset.png" },
            new Producto { Nombre = "Office 365 A3", Descripcion = "Suscripción anual educativa de Office 365", Precio = 59.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/office365.png" },
            new Producto { Nombre = "Adobe Creative Cloud", Descripcion = "Acceso completo a todas las aplicaciones creativas", Precio = 120.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/adobe.png" },
            new Producto { Nombre = "Autodesk Standard", Descripcion = "Licencia oficial Autodesk Suite Standard", Precio = 150.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/autodeskstandado.png" },
            new Producto { Nombre = "Autodesk Revit", Descripcion = "Diseño arquitectónico y modelado BIM profesional", Precio = 180.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/autodeskrevit.png" },
            new Producto { Nombre = "AutoCAD", Descripcion = "Diseño asistido por computadora 2D y 3D", Precio = 190.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/autocad.png" },

            // 2. Accesos Mensuales (IA & Streaming)
            new Producto { Nombre = "ChatGPT Plus (1 Mes)", Descripcion = "Cuenta compartida perfil premium", Precio = 19.90m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/chatgpt.png" },
            new Producto { Nombre = "Gemini Advanced (1 Mes)", Descripcion = "Acceso premium a Gemini 1.5 Pro y Ultra", Precio = 22.00m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/gemini.png" },
            new Producto { Nombre = "Supergrok (1 Mes)", Descripcion = "Acceso premium a Grok de xAI", Precio = 15.00m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/supergrok.png" },
            new Producto { Nombre = "YouTube Premium (1 Mes)", Descripcion = "Sin anuncios y reproducción en segundo plano", Precio = 10.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/youtubepremium.png" },
            new Producto { Nombre = "Spotify Premium (1 Mes)", Descripcion = "Música sin anuncios y modo sin conexión", Precio = 9.90m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/spotifypremium.png" },
            new Producto { Nombre = "Netflix Premium (1 Mes)", Descripcion = "Cuenta completa o pantalla ultra HD", Precio = 15.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/netflix.png" },
            new Producto { Nombre = "HBO Max (1 Mes)", Descripcion = "Perfil de streaming mensual", Precio = 12.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/hbomax.png" },
            new Producto { Nombre = "Prime Video (1 Mes)", Descripcion = "Películas y series exclusivas de Amazon", Precio = 8.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/primevideo.png" },
            new Producto { Nombre = "Paramount (1 Mes)", Descripcion = "Suscripción mensual de Paramount+", Precio = 7.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "/paramount.png" },

            // 3. Licencias Perpetuas (Software)
            new Producto { Nombre = "Windows 10 Pro", Descripcion = "Licencia OEM enlazada al hardware", Precio = 25.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/windows10.png" },
            new Producto { Nombre = "Windows 11 Pro", Descripcion = "Licencia OEM enlazada al hardware", Precio = 29.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/windows.png" },
            new Producto { Nombre = "Office Profesional Plus 2021", Descripcion = "Licencia perpetua de Office 2021", Precio = 35.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/office2021.png" },
            new Producto { Nombre = "Office Profesional Plus 2024", Descripcion = "Licencia perpetua de Office 2024", Precio = 45.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/office2024.png" },
            new Producto { Nombre = "Nitro 14", Descripcion = "Editor y creador de PDF profesional", Precio = 30.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/nitro14.png" },
            new Producto { Nombre = "Filmora", Descripcion = "Editor de video simple y creativo perpetuo", Precio = 40.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/filmora.png" }
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
                // Actualizar los datos del catálogo e ImagenUrl de forma obligatoria con la nueva ruta de texto plano
                existingProd.Descripcion = p.Descripcion;
                existingProd.Precio = p.Precio;
                existingProd.DuracionMeses = p.DuracionMeses;
                existingProd.Categoria = p.Categoria;
                existingProd.ImagenUrl = p.ImagenUrl;
            }
        }
        db.SaveChanges();
        Console.WriteLine("Catálogo oficial sembrado y actualizado correctamente con mapeo de imágenes reales en la base de datos.");
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

// 1. REGISTRO DE USUARIO
app.MapPost("/api/auth/register", async (Usuario usuario, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(usuario.Email) || string.IsNullOrWhiteSpace(usuario.Nombre) || string.IsNullOrWhiteSpace(usuario.WhatsApp))
        {
            return Results.BadRequest(new { mensaje = "Todos los campos son obligatorios." });
        }

        var existe = await db.Usuarios.AnyAsync(u => u.Email == usuario.Email);
        if (existe)
        {
            return Results.Conflict(new { mensaje = "El correo electrónico ya está registrado." });
        }

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(usuario.PasswordHash);
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
        if (string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return Results.BadRequest(new { mensaje = "Debe proveer correo y contraseña." });
        }

        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, usuario.PasswordHash))
        {
            return Results.Unauthorized();
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
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AuthLogin\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error interno en el servidor." }, statusCode: 500);
    }
});

// 3. OBTENER CATALOGO
app.MapGet("/api/productos", async (ApplicationDbContext db) =>
{
    try
    {
        var productos = await db.Productos.ToListAsync();
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
        if (usuario == null)
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
            if (prod == null)
            {
                return Results.BadRequest(new { mensaje = $"Producto con ID {item.ProductoId} no existe." });
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

        string whatsappAdmin = "51900000000"; 
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
app.MapGet("/api/ordenes/cliente/{usuarioId}", async (int usuarioId, ApplicationDbContext db) =>
{
    try
    {
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
});

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
});

// 7. BACKOFFICE: COMPLETAR ORDEN Y ENTRADA DE CLAVE
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

            if (detalle.Producto != null && detalle.Producto.DuracionMeses > 0)
            {
                detalle.FechaVencimiento = DateTime.UtcNow.AddMonths(detalle.Producto.DuracionMeses);
            }
            else
            {
                detalle.FechaVencimiento = null; 
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
});

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
});

app.Run();

// --- DATA TRANSFER OBJECTS (DTOs) ---
public record LoginDto(string Email, string Password);
public record ItemOrdenDto(int ProductoId, int Cantidad);
public record CrearOrdenDto(int UsuarioId, List<ItemOrdenDto> Items);
public record CompletarOrdenDto(Dictionary<int, string>? ClavesPorDetalle);

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
}