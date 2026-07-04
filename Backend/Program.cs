using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configurar serialización JSON para manejar ciclos
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// Configurar base de datos (PostgreSQL - Supabase) usando connection string de appsettings
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

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

// --- BLOQUE DE INICIALIZACIÓN CORREGIDO ---
// --- BLOQUE DE INICIALIZACIÓN CORREGIDO PARA SUPABASE ---
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Aplica las migraciones pendientes y crea las tablas si no existen sin borrar la BD
        db.Database.Migrate();
        
        if (!db.Productos.Any())
        {
            db.Productos.AddRange(
                new Producto { Nombre = "Canva Pro (Anual)", Descripcion = "Acceso premium administrado mediante equipo", Precio = 49.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/canva.svg" },
                new Producto { Nombre = "CapCut Pro (Anual)", Descripcion = "Edición de video premium anual", Precio = 69.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/capcut.svg" },
                new Producto { Nombre = "ESET Internet Security", Descripcion = "Activación retail de 365 días", Precio = 39.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/eset.svg" },
                new Producto { Nombre = "Windows 11 Pro", Descripcion = "Licencia OEM enlazada al hardware", Precio = 29.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/windows11.svg" },
                new Producto { Nombre = "ChatGPT Plus (1 Mes)", Descripcion = "Cuenta compartida perfil premium", Precio = 19.90m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/openai.svg" },
                new Producto { Nombre = "Netflix Premium (1 Mes)", Descripcion = "Cuenta completa o pantalla ultra HD", Precio = 15.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg" },
                new Producto { Nombre = "HBO Max (1 Mes)", Descripcion = "Perfil de streaming mensual", Precio = 12.00m, DuracionMeses = 1, Categoria = "Streaming", ImagenUrl = "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hbo.svg" }
            );
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al sembrar la base de datos: {ex.Message}");
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

        var tokenSimulado = $"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.usuario_{usuario.Id}_{usuario.Rol}";
        return Results.Ok(new { 
            token = tokenSimulado, 
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

// 4. CREAR ORDEN (Mago de Oz - Redirección a WhatsApp)
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

// 6. BACKOFFICE: GESTIÓN DE ÓRDENES PENDIENTES
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

// 8. DASHBOARD INTERNO: ALERTAS DE RENOVACIÓN DE 5 DÍAS
app.MapGet("/api/admin/renovaciones", async (ApplicationDbContext db) =>
{
    try
    {
        DateTime targetDate = DateTime.UtcNow.Date.AddDays(5);
        
        var renovaciones = await db.DetalleOrdenes
            .Include(d => d.Producto)
            .Include(d => d.Orden)
                .ThenInclude(o => o!.Usuario)
            .Where(d => d.FechaVencimiento != null && d.FechaVencimiento.Value.Date == targetDate)
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