using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Text.Json.Serialization;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

// Prevenir el límite de inotify de Linux/Render al cargar configuraciones con FileSystemWatcher
Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

var builder = WebApplication.CreateBuilder(args);

// Configurar serialización JSON para manejar ciclos
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// Configurar base de datos (PostgreSQL - Supabase) usando connection string de appsettings o fallback seguro
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString) || !connectionString.Contains("Host="))
{
    connectionString = builder.Configuration["DATABASE_URL"];
}

if (string.IsNullOrWhiteSpace(connectionString) || !connectionString.Contains("Host="))
{
    // Fallback directo a la cadena de conexión oficial de Supabase
    connectionString = "Host=aws-0-us-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.llpdxrzrbsispgxrdxyn;Password=6Ff!?BdiL2L5,ZJ;SSL Mode=Require;Trust Server Certificate=True;No Reset On Close=true;Multiplexing=false;";
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString)
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Registrar el servicio en segundo plano para alertas de renovación
builder.Services.AddHostedService<Backend.Services.WorkerRenovaciones>();

// Registrar cliente HTTP y servicio de Radar de Proveedores
builder.Services.AddHttpClient();
builder.Services.AddSingleton<Backend.Services.RadarProveedoresService>();

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
        // Asegurar que la carpeta local wwwroot/uploads exista
        var localUploadsFolder = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
        if (!Directory.Exists(localUploadsFolder))
        {
            Directory.CreateDirectory(localUploadsFolder);
        }
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

        // Verificar si la tabla Cupones existe, y si no, crearla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Cupones"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Codigo"" VARCHAR(50) NOT NULL UNIQUE,
                    ""PorcentajeDescuento"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""MontoDescuentoFijo"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""EsPorcentaje"" BOOLEAN NOT NULL DEFAULT TRUE,
                    ""Activo"" BOOLEAN NOT NULL DEFAULT TRUE,
                    ""UsosMaximos"" INT NOT NULL DEFAULT 100,
                    ""UsosActuales"" INT NOT NULL DEFAULT 0,
                    ""FechaExpiracion"" TIMESTAMP WITH TIME ZONE NULL
                );");
            Console.WriteLine("Tabla Cupones verificada/creada con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar tabla Cupones: {ex.Message}");
        }

        // Verificar columnas en Ordenes (CuponCodigo, DescuentoAplicado)
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Ordenes' AND column_name='CuponCodigo') THEN 
                        ALTER TABLE ""Ordenes"" ADD COLUMN ""CuponCodigo"" VARCHAR(50) NULL;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Ordenes' AND column_name='DescuentoAplicado') THEN 
                        ALTER TABLE ""Ordenes"" ADD COLUMN ""DescuentoAplicado"" decimal(18,2) NOT NULL DEFAULT 0.00;
                    END IF;
                END $$;");
            Console.WriteLine("Columnas CuponCodigo y DescuentoAplicado en Ordenes verificadas/creadas con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar columnas de cupones en Ordenes: {ex.Message}");
        }

        // Verificar si la tabla Visitas existe para Analítica en Tiempo Real, y si no, crearla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Visitas"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""SessionId"" VARCHAR(100) NOT NULL,
                    ""Ruta"" VARCHAR(255) NOT NULL,
                    ""TituloPagina"" VARCHAR(255),
                    ""Dispositivo"" VARCHAR(50) NOT NULL DEFAULT 'Escritorio',
                    ""Navegador"" VARCHAR(50) NOT NULL DEFAULT 'Desconocido',
                    ""SistemaOperativo"" VARCHAR(50) NOT NULL DEFAULT 'Desconocido',
                    ""Referrer"" VARCHAR(255) DEFAULT 'Directo',
                    ""Pais"" VARCHAR(100) DEFAULT 'Perú',
                    ""UsuarioId"" INTEGER,
                    ""UsuarioNombre"" VARCHAR(150),
                    ""UsuarioEmail"" VARCHAR(150),
                    ""FechaCreacion"" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS ""IX_Visitas_FechaCreacion"" ON ""Visitas"" (""FechaCreacion"");
                CREATE INDEX IF NOT EXISTS ""IX_Visitas_SessionId"" ON ""Visitas"" (""SessionId"");");
            Console.WriteLine("Tabla Visitas e índices de analítica verificados/creados con éxito.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar tabla Visitas: {ex.Message}");
        }

        // Verificar si la tabla Combos existe para Packs & Combos Pro de Ahorro, y si no, crearla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Combos"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Nombre"" VARCHAR(150) NOT NULL,
                    ""Subtitulo"" VARCHAR(255) DEFAULT '',
                    ""Descripcion"" VARCHAR(600) DEFAULT '',
                    ""PrecioOriginal"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""PrecioCombo"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""Ahorro"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""Badge"" VARCHAR(100) DEFAULT 'Oferta Especial',
                    ""ItemsJson"" TEXT DEFAULT '[]',
                    ""Activo"" BOOLEAN NOT NULL DEFAULT TRUE,
                    ""OrdenVisual"" INTEGER NOT NULL DEFAULT 0,
                    ""FechaCreacion"" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS ""IX_Combos_Activo"" ON ""Combos"" (""Activo"");");
            Console.WriteLine("Tabla Combos e índices verificados/creados con éxito.");

            // Sembrado inicial de Combos si la tabla está vacía
            if (!db.Combos.Any())
            {
                var combosIniciales = new List<Combo>
                {
                    new Combo
                    {
                        Nombre = "🔥 Combo Formateo PC Master",
                        Subtitulo = "Windows 11 Pro + Office 2024 Pro Plus + ESET Antivirus",
                        Descripcion = "El kit definitivo para dejar tu computadora blindada, activada de por vida y protegida con la mejor suite de seguridad.",
                        PrecioOriginal = 114.80m,
                        PrecioCombo = 89.90m,
                        Ahorro = 24.90m,
                        Badge = "Más Vendido para Técnicos y Gamers",
                        ItemsJson = JsonSerializer.Serialize(new[] { "Windows 11 Pro", "Office Profesional Plus 2024", "ESET Internet Security" }),
                        Activo = true,
                        OrdenVisual = 1
                    },
                    new Combo
                    {
                        Nombre = "🎨 Combo Creador de Contenido & Video",
                        Subtitulo = "Canva Pro + CapCut Pro + Filmora",
                        Descripcion = "Todo lo que necesitas para diseñar miniaturas virales, editar reels y producir videos en 4K sin marcas de agua.",
                        PrecioOriginal = 159.80m,
                        PrecioCombo = 129.90m,
                        Ahorro = 29.90m,
                        Badge = "Ahorro del 20% Anual",
                        ItemsJson = JsonSerializer.Serialize(new[] { "Canva Pro (Anual)", "CapCut Pro (Anual)", "Filmora" }),
                        Activo = true,
                        OrdenVisual = 2
                    },
                    new Combo
                    {
                        Nombre = "🍿 Combo Cine & Música Total",
                        Subtitulo = "Netflix UHD + Spotify + YouTube Premium + HBO Max",
                        Descripcion = "Disfruta de películas, series sin anuncios y tu música favorita en máxima fidelidad con perfiles garantizados.",
                        PrecioOriginal = 46.90m,
                        PrecioCombo = 36.90m,
                        Ahorro = 10.00m,
                        Badge = "Cero Anuncios en 4K",
                        ItemsJson = JsonSerializer.Serialize(new[] { "Netflix Premium (1 Mes)", "Spotify Premium (1 Mes)", "YouTube Premium (1 Mes)", "HBO Max (1 Mes)" }),
                        Activo = true,
                        OrdenVisual = 3
                    },
                    new Combo
                    {
                        Nombre = "🤖 Combo Dúo Inteligencia Artificial",
                        Subtitulo = "ChatGPT Plus + Claude Pro (o Gemini Advanced)",
                        Descripcion = "Compara respuestas, programa software y analiza documentos extensos con los 2 mejores modelos de IA del planeta.",
                        PrecioOriginal = 44.80m,
                        PrecioCombo = 34.90m,
                        Ahorro = 9.90m,
                        Badge = "Productividad Extrema",
                        ItemsJson = JsonSerializer.Serialize(new[] { "ChatGPT Plus (1 Mes)", "Claude Pro (1 Mes)" }),
                        Activo = true,
                        OrdenVisual = 4
                    }
                };

                db.Combos.AddRange(combosIniciales);
                db.SaveChanges();
                Console.WriteLine("Combos semilla registrados con éxito.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar o sembrar tabla Combos: {ex.Message}");
        }

        // Verificar si la tabla ProveedorTrackings existe para Radar de Proveedores, y si no, crearla
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""ProveedorTrackings"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""ProductoId"" INTEGER NULL,
                    ""ProductoNombre"" VARCHAR(150) NOT NULL,
                    ""ProveedorNombre"" VARCHAR(100) NOT NULL,
                    ""ProveedorUrl"" VARCHAR(500) NOT NULL,
                    ""PrecioProveedor"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""Moneda"" VARCHAR(10) NOT NULL DEFAULT 'PEN',
                    ""StockProveedor"" INTEGER NULL,
                    ""Disponible"" BOOLEAN NOT NULL DEFAULT TRUE,
                    ""CostoAnterior"" decimal(18,2) NULL,
                    ""VariacionPrecio"" decimal(18,2) NOT NULL DEFAULT 0.00,
                    ""Notas"" VARCHAR(255) NULL,
                    ""AutoActualizarCosto"" BOOLEAN NOT NULL DEFAULT FALSE,
                    ""UltimaActualizacion"" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS ""IX_ProveedorTrackings_ProductoId"" ON ""ProveedorTrackings"" (""ProductoId"");
                CREATE INDEX IF NOT EXISTS ""IX_ProveedorTrackings_ProveedorNombre"" ON ""ProveedorTrackings"" (""ProveedorNombre"");");
            Console.WriteLine("Tabla ProveedorTrackings e índices verificados/creados con éxito.");

            // Sembrado inicial de ProveedorTrackings si la tabla está vacía
            if (!db.ProveedorTrackings.Any())
            {
                var trackingsSemilla = new List<ProveedorTracking>
                {
                    new ProveedorTracking
                    {
                        ProductoNombre = "Windows 11 Pro",
                        ProveedorNombre = "Compufarma",
                        ProveedorUrl = "https://ganvent.com/compufarma",
                        PrecioProveedor = 2.88m,
                        Moneda = "PEN",
                        StockProveedor = 21,
                        Disponible = true,
                        Notas = "Licencia OEM enlazada al hardware (Firestore REST API)",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "Office 365 A3",
                        ProveedorNombre = "Compufarma",
                        ProveedorUrl = "https://ganvent.com/compufarma",
                        PrecioProveedor = 1.50m,
                        Moneda = "PEN",
                        StockProveedor = 45,
                        Disponible = true,
                        Notas = "Suscripción institucional Office 365",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "ESET Internet Security",
                        ProveedorNombre = "Compufarma",
                        ProveedorUrl = "https://ganvent.com/compufarma",
                        PrecioProveedor = 15.00m,
                        Moneda = "PEN",
                        StockProveedor = 18,
                        Disponible = true,
                        Notas = "Activación retail de 365 días",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "Canva Pro (Anual)",
                        ProveedorNombre = "Compufarma",
                        ProveedorUrl = "https://ganvent.com/compufarma",
                        PrecioProveedor = 4.00m,
                        Moneda = "PEN",
                        StockProveedor = 29,
                        Disponible = true,
                        Notas = "Acceso premium administrado por equipo",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "Filmora",
                        ProveedorNombre = "Compufarma",
                        ProveedorUrl = "https://ganvent.com/compufarma",
                        PrecioProveedor = 28.00m,
                        Moneda = "PEN",
                        StockProveedor = 9,
                        Disponible = true,
                        Notas = "Wondershare Filmora 15 Pro",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "Netflix Premium (1 Mes)",
                        ProveedorNombre = "SkyStreaming",
                        ProveedorUrl = "https://skystreaming.com.pe/categoria-producto/netflix/",
                        PrecioProveedor = 9.50m,
                        Moneda = "PEN",
                        StockProveedor = 15,
                        Disponible = true,
                        Notas = "Perfil 4K Ultra HD con PIN privado",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "Spotify Premium (1 Mes)",
                        ProveedorNombre = "SkyStreaming",
                        ProveedorUrl = "https://skystreaming.com.pe/categoria-producto/spotify/",
                        PrecioProveedor = 4.00m,
                        Moneda = "PEN",
                        StockProveedor = 30,
                        Disponible = true,
                        Notas = "Plan individual sin caídas",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "ChatGPT Plus (1 Mes)",
                        ProveedorNombre = "SkyStreaming",
                        ProveedorUrl = "https://skystreaming.com.pe/categoria-producto/ia/",
                        PrecioProveedor = 11.50m,
                        Moneda = "PEN",
                        StockProveedor = 12,
                        Disponible = true,
                        Notas = "Acceso GPT-4o mensual garantizado",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    },
                    new ProveedorTracking
                    {
                        ProductoNombre = "Windows 10 Pro",
                        ProveedorNombre = "G2A",
                        ProveedorUrl = "https://www.g2a.com/microsoft-windows-10-professional-oem-key-global-i10000033961001",
                        PrecioProveedor = 7.85m,
                        Moneda = "USD",
                        StockProveedor = 50,
                        Disponible = true,
                        Notas = "Global OEM Key marketplace ($2.10 USD)",
                        AutoActualizarCosto = false,
                        UltimaActualizacion = DateTime.UtcNow
                    }
                };

                // Asignar ProductoId buscando por nombre en el catálogo existente
                foreach (var trk in trackingsSemilla)
                {
                    var prod = db.Productos.FirstOrDefault(p => p.Nombre.ToLower() == trk.ProductoNombre.ToLower() || p.Nombre.ToLower().Contains(trk.ProductoNombre.ToLower()));
                    if (prod != null)
                    {
                        trk.ProductoId = prod.Id;
                    }
                }

                db.ProveedorTrackings.AddRange(trackingsSemilla);
                db.SaveChanges();
                Console.WriteLine("ProveedorTrackings semilla registrados con éxito.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Advertencia al verificar o sembrar tabla ProveedorTrackings: {ex.Message}");
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

        // --- SEMBRADO DE DATOS PROTEGIDO POR ENTORNO (SOLO DESARROLLO) ---
        if (app.Environment.IsDevelopment())
        {
            Console.WriteLine("Entorno de desarrollo detectado. Ejecutando sembrado de datos semilla...");

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
                new Producto { Nombre = "Filmora", Descripcion = "Editor de video simple y creativo perpetuo", Precio = 40.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/filmora.png", CostoProveedor = 18.00m, Activo = true },
                new Producto { Nombre = "Internet Download Manager (IDM)", Descripcion = "Licencia perpetua del acelerador de descargas #1 del mundo para Windows", Precio = 29.00m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/idm.png", CostoProveedor = 12.00m, Activo = true },
                new Producto { Nombre = "WinRAR Pro", Descripcion = "Licencia permanente oficial del compresor y descompresor universal", Precio = 19.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/winrar.png", CostoProveedor = 8.00m, Activo = true },
                new Producto { Nombre = "Malwarebytes Premium (1 Año)", Descripcion = "Protección anti-malware, ransomware y exploits en tiempo real para 1 PC", Precio = 35.00m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/malwarebytes.png", CostoProveedor = 15.00m, Activo = true },
                new Producto { Nombre = "NordVPN (1 Año)", Descripcion = "VPN de alta velocidad para streaming, privacidad y seguridad sin registros", Precio = 49.90m, DuracionMeses = 12, Categoria = "Software", ImagenUrl = "/nordvpn.png", CostoProveedor = 20.00m, Activo = true },
                new Producto { Nombre = "Microsoft Project 2024 Pro", Descripcion = "Gestión profesional de proyectos, cronogramas y diagramas de Gantt", Precio = 49.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/project.png", CostoProveedor = 22.00m, Activo = true },
                new Producto { Nombre = "Microsoft Visio 2024 Pro", Descripcion = "Creación de diagramas de flujo, mapas de red y esquemas de ingeniería", Precio = 49.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/visio.png", CostoProveedor = 22.00m, Activo = true },
                new Producto { Nombre = "Office Hogar y Empresas 2024 (Mac & PC)", Descripcion = "Licencia perpetua oficial compatible con MacOS y Windows vinculable a tu cuenta Microsoft", Precio = 59.90m, DuracionMeses = 0, Categoria = "Software", ImagenUrl = "/office_mac.png", CostoProveedor = 28.00m, Activo = true },
                new Producto { Nombre = "Claude Pro (1 Mes)", Descripcion = "Acceso premium a Claude 3.5 Sonnet de Anthropic con alta capacidad y proyectos", Precio = 24.90m, DuracionMeses = 1, Categoria = "IA", ImagenUrl = "/claude.png", CostoProveedor = 12.00m, Activo = true }
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
                    // Actualizar los datos del catálogo sin sobrescribir la bandera Activo
                    existingProd.Descripcion = p.Descripcion;
                    existingProd.Precio = p.Precio;
                    existingProd.DuracionMeses = p.DuracionMeses;
                    existingProd.Categoria = p.Categoria;
                    existingProd.ImagenUrl = p.ImagenUrl;
                    existingProd.CostoProveedor = p.CostoProveedor;
                    // Note: existingProd.Activo se mantiene como está para no reactivar productos eliminados lógicamente
                }
            }
            // Semilla de Cupones Demostrativos
            if (!db.Cupones.Any())
            {
                db.Cupones.AddRange(
                    new Cupon { Codigo = "INFORMATICS10", PorcentajeDescuento = 10m, EsPorcentaje = true, Activo = true, UsosMaximos = 100, UsosActuales = 0 },
                    new Cupon { Codigo = "BIENVENIDA5", MontoDescuentoFijo = 5m, EsPorcentaje = false, Activo = true, UsosMaximos = 50, UsosActuales = 0 }
                );
            }

            db.SaveChanges();
            Console.WriteLine("Catálogo oficial y cupones sembrados correctamente.");
        }
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

app.UseCors("AllowReactApp");
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();

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
        return Results.Json(new { mensaje = "Error al obtener productos.", detalle = ex.Message }, statusCode: 500);
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

        decimal descuentoAplicado = 0m;
        string? cuponCodigoAplicado = null;

        if (!string.IsNullOrWhiteSpace(dto.CuponCodigo))
        {
            var codigoNormalizado = dto.CuponCodigo.Trim().ToUpper();
            var cupon = await db.Cupones.FirstOrDefaultAsync(c => c.Codigo == codigoNormalizado && c.Activo);
            if (cupon != null && cupon.UsosActuales < cupon.UsosMaximos && (!cupon.FechaExpiracion.HasValue || cupon.FechaExpiracion.Value > DateTime.UtcNow))
            {
                if (cupon.EsPorcentaje)
                {
                    descuentoAplicado = Math.Round(totalAcumulado * (cupon.PorcentajeDescuento / 100m), 2);
                }
                else
                {
                    descuentoAplicado = Math.Min(totalAcumulado, cupon.MontoDescuentoFijo);
                }

                cuponCodigoAplicado = cupon.Codigo;
                cupon.UsosActuales += 1;
            }
        }

        decimal totalFinal = Math.Max(0m, totalAcumulado - descuentoAplicado);

        var orden = new Orden
        {
            UsuarioId = dto.UsuarioId,
            FechaCreacion = DateTime.UtcNow,
            Estado = "Pendiente",
            Total = totalFinal,
            CuponCodigo = cuponCodigoAplicado,
            DescuentoAplicado = descuentoAplicado,
            Detalles = detalles
        };

        db.Ordenes.Add(orden);
        await db.SaveChangesAsync();

        string whatsappAdmin = "51984497138"; 
        string mensajeWhatsApp = Uri.EscapeDataString(
            $"¡Hola Informatics! He registrado mi pedido en la web.\n\n" +
            $"*Pedido N°:* #{orden.Id}\n" +
            $"*Cliente:* {usuario.Nombre}\n" +
            (string.IsNullOrEmpty(orden.CuponCodigo) ? "" : $"*Cupón Aplicado:* {orden.CuponCodigo} (-S/ {orden.DescuentoAplicado:F2})\n") +
            $"*Total Final:* S/ {orden.Total:F2}\n\n" +
            $"Por favor, indíquenme las cuentas de pago para recibir mis accesos."
        );

        string whatsappUrl = $"https://api.whatsapp.com/send?phone={whatsappAdmin}&text={mensajeWhatsApp}";

        return Results.Created($"/api/ordenes/{orden.Id}", new { 
            ordenId = orden.Id, 
            total = orden.Total, 
            descuento = orden.DescuentoAplicado,
            cupon = orden.CuponCodigo,
            estado = orden.Estado, 
            redirectUrl = whatsappUrl 
        });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: CrearOrden\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al procesar la orden.", detalle = ex.Message }, statusCode: 500);
    }
});

// 4b. VALIDAR CUPÓN DE DESCUENTO
app.MapPost("/api/cupones/validar", async (ValidarCuponDto dto, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Codigo))
        {
            return Results.BadRequest(new { mensaje = "Ingrese un código de cupón." });
        }

        var codigo = dto.Codigo.Trim().ToUpper();
        var cupon = await db.Cupones.FirstOrDefaultAsync(c => c.Codigo == codigo);

        if (cupon == null || !cupon.Activo)
        {
            return Results.BadRequest(new { mensaje = "El cupón ingresado no existe o no está activo." });
        }

        if (cupon.UsosActuales >= cupon.UsosMaximos)
        {
            return Results.BadRequest(new { mensaje = "Este cupón ha alcanzado el límite máximo de usos." });
        }

        if (cupon.FechaExpiracion.HasValue && cupon.FechaExpiracion.Value < DateTime.UtcNow)
        {
            return Results.BadRequest(new { mensaje = "El cupón ingresado ha expirado." });
        }

        return Results.Ok(new
        {
            valido = true,
            codigo = cupon.Codigo,
            porcentajeDescuento = cupon.PorcentajeDescuento,
            montoDescuentoFijo = cupon.MontoDescuentoFijo,
            esPorcentaje = cupon.EsPorcentaje
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al validar cupón: {ex.Message}");
        return Results.Json(new { mensaje = "Error al validar el cupón.", detalle = ex.Message }, statusCode: 500);
    }
});

// 4c. OBTENER LICENCIAS PRÓXIMAS A VENCER PARA ALERTAS DE CLIENTE
app.MapGet("/api/licencias/renovaciones/{usuarioId}", async (int usuarioId, ApplicationDbContext db) =>
{
    try
    {
        var hoy = DateTime.UtcNow.Date;
        var limite7Dias = hoy.AddDays(7);

        var licenciasPorVencer = await db.DetalleOrdenes
            .Include(d => d.Producto)
            .Include(d => d.Orden)
            .Where(d => d.Orden != null 
                     && d.Orden.UsuarioId == usuarioId 
                     && d.Orden.Estado == "Completada"
                     && d.FechaVencimiento != null 
                     && d.FechaVencimiento.Value.Date <= limite7Dias)
            .Select(d => new
            {
                detalleId = d.Id,
                productoId = d.ProductoId,
                productoNombre = d.Producto != null ? d.Producto.Nombre : "Licencia",
                fechaVencimiento = d.FechaVencimiento,
                diasRestantes = (d.FechaVencimiento.Value.Date - hoy).Days,
                clave = d.ClaveEntregada
            })
            .ToListAsync();

        return Results.Ok(licenciasPorVencer);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al obtener licencias por vencer: {ex.Message}");
        return Results.Json(new { mensaje = "Error al consultar renovaciones.", detalle = ex.Message }, statusCode: 500);
    }
});

// 4d. GESTIÓN DE CUPONES (ADMIN) - LISTAR
app.MapGet("/api/cupones", async (ApplicationDbContext db) =>
{
    try
    {
        var cupones = await db.Cupones.OrderByDescending(c => c.Id).ToListAsync();
        return Results.Ok(cupones);
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al listar cupones.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 4e. GESTIÓN DE CUPONES (ADMIN) - CREAR
app.MapPost("/api/cupones", async (Cupon cupon, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(cupon.Codigo))
        {
            return Results.BadRequest(new { mensaje = "El código de cupón es requerido." });
        }

        cupon.Codigo = cupon.Codigo.Trim().ToUpper();

        if (await db.Cupones.AnyAsync(c => c.Codigo == cupon.Codigo))
        {
            return Results.BadRequest(new { mensaje = "Ya existe un cupón registrado con este código." });
        }

        db.Cupones.Add(cupon);
        await db.SaveChangesAsync();

        return Results.Created($"/api/cupones/{cupon.Id}", cupon);
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al crear el cupón.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 4f. GESTIÓN DE CUPONES (ADMIN) - CAMBIAR ESTADO
app.MapPut("/api/cupones/{id}/estado", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var cupon = await db.Cupones.FindAsync(id);
        if (cupon == null)
        {
            return Results.NotFound(new { mensaje = "Cupón no encontrado." });
        }

        cupon.Activo = !cupon.Activo;
        await db.SaveChangesAsync();

        return Results.Ok(cupon);
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al actualizar estado del cupón.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

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

// 9. CRUD PRODUCTOS - LISTAR TODOS (RETORNA TODOS PARA CONTROL ADMINISTRATIVO)
app.MapGet("/api/admin/productos", async (ApplicationDbContext db) =>
{
    try
    {
        var productos = await db.Productos.OrderBy(p => p.Nombre).ToListAsync();
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

// 10b. CRUD PRODUCTOS - SUBIR IMAGEN (SUPABASE STORAGE CON FALLBACK LOCAL)
app.MapPost("/api/admin/productos/upload", async (IFormFile file, IConfiguration config, IWebHostEnvironment env) =>
{
    try
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { mensaje = "No se ha seleccionado ningún archivo." });
        }

        var extension = Path.GetExtension(file.FileName);
        var safeFileName = Path.GetFileNameWithoutExtension(file.FileName)
            .Replace(" ", "_")
            .Replace("-", "_");
        
        safeFileName = System.Text.RegularExpressions.Regex.Replace(safeFileName, @"[^a-zA-Z0-9_]", "");
        var fileName = $"{DateTime.UtcNow.Ticks}_{safeFileName}{extension}";

        var supabaseUrl = config["Supabase:Url"];
        var supabaseApiKey = config["Supabase:ApiKey"];
        var supabaseBucket = config["Supabase:Bucket"] ?? "productos";

        if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(supabaseApiKey))
        {
            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseApiKey}");
                client.DefaultRequestHeaders.Add("apikey", supabaseApiKey);

                var baseUrl = supabaseUrl.TrimEnd('/');
                var requestUrl = $"{baseUrl}/storage/v1/object/{supabaseBucket}/{fileName}";

                using var content = new StreamContent(file.OpenReadStream());
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "image/png");

                var response = await client.PostAsync(requestUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    var publicUrl = $"{baseUrl}/storage/v1/object/public/{supabaseBucket}/{fileName}";
                    return Results.Ok(new { url = publicUrl });
                }
                else
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[Supabase Upload Error] Status: {response.StatusCode}, Detalle: {errorMsg}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Supabase Upload Exception] {ex.Message}");
            }
        }

        // --- FALLBACK LOCAL ---
        var uploadsFolder = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var filePath = Path.Combine(uploadsFolder, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var localUrl = $"/uploads/{fileName}";
        return Results.Ok(new { url = localUrl });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminUploadProducto\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al subir la imagen.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole().DisableAntiforgery();

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

// 12b. CRUD PRODUCTOS - INTERRUPTOR DE VISIBILIDAD RÁPIDA (ACTIVO / OCULTO EN GESTIÓN)
app.MapPut("/api/admin/productos/{id}/toggle-visibilidad", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var product = await db.Productos.FindAsync(id);
        if (product == null)
        {
            return Results.NotFound(new { mensaje = "Producto no encontrado." });
        }

        product.Activo = !product.Activo;
        await db.SaveChangesAsync();

        return Results.Ok(new { 
            id = product.Id, 
            activo = product.Activo, 
            mensaje = product.Activo ? "Producto ahora es VISIBLE en la tienda pública." : "Producto ahora está OCULTO en modo gestión/borrador." 
        });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminToggleVisibilidad\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al alternar visibilidad del producto.", detalle = ex.Message }, statusCode: 500);
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

// =========================================================================
// 19. ANALÍTICA Y TRÁFICO WEB EN VIVO - REGISTRAR VISITA PÚBLICA
// =========================================================================
app.MapPost("/api/visitas/registrar", async (RegistrarVisitaDto dto, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.SessionId) || string.IsNullOrWhiteSpace(dto.Ruta))
        {
            return Results.BadRequest(new { mensaje = "SessionId y Ruta son requeridos." });
        }

        var visita = new Visita
        {
            SessionId = dto.SessionId.Length > 100 ? dto.SessionId.Substring(0, 100) : dto.SessionId,
            Ruta = dto.Ruta.Length > 255 ? dto.Ruta.Substring(0, 255) : dto.Ruta,
            TituloPagina = string.IsNullOrWhiteSpace(dto.TituloPagina) ? null : (dto.TituloPagina.Length > 255 ? dto.TituloPagina.Substring(0, 255) : dto.TituloPagina),
            Dispositivo = string.IsNullOrWhiteSpace(dto.Dispositivo) ? "Escritorio" : dto.Dispositivo,
            Navegador = string.IsNullOrWhiteSpace(dto.Navegador) ? "Desconocido" : dto.Navegador,
            SistemaOperativo = string.IsNullOrWhiteSpace(dto.SistemaOperativo) ? "Desconocido" : dto.SistemaOperativo,
            Referrer = string.IsNullOrWhiteSpace(dto.Referrer) ? "Directo" : (dto.Referrer.Length > 255 ? dto.Referrer.Substring(0, 255) : dto.Referrer),
            Pais = "Perú",
            UsuarioId = dto.UsuarioId,
            UsuarioNombre = dto.UsuarioNombre,
            UsuarioEmail = dto.UsuarioEmail,
            FechaCreacion = DateTime.UtcNow
        };

        db.Visitas.Add(visita);
        await db.SaveChangesAsync();

        return Results.Ok(new { ok = true, id = visita.Id });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al registrar visita: {ex.Message}");
        return Results.Ok(new { ok = false });
    }
});

// =========================================================================
// 20. ANALÍTICA Y TRÁFICO WEB EN VIVO - CONSULTA PARA PANEL DE ADMINISTRACIÓN
// =========================================================================
app.MapGet("/api/admin/visitas", async (ApplicationDbContext db) =>
{
    try
    {
        var hace10Minutos = DateTime.UtcNow.AddMinutes(-10);
        var inicioHoy = DateTime.UtcNow.Date;

        var totalVisitas = await db.Visitas.CountAsync();
        var visitasHoy = await db.Visitas.CountAsync(v => v.FechaCreacion >= inicioHoy);
        var visitantesUnicos = await db.Visitas.Select(v => v.SessionId).Distinct().CountAsync();
        
        // Sesiones activas en los últimos 10 minutos
        var sesionesActivas = await db.Visitas
            .Where(v => v.FechaCreacion >= hace10Minutos)
            .Select(v => v.SessionId)
            .Distinct()
            .CountAsync();

        // Últimas 50 visitas detalladas
        var ultimasVisitas = await db.Visitas
            .OrderByDescending(v => v.FechaCreacion)
            .Take(50)
            .Select(v => new
            {
                v.Id,
                v.SessionId,
                v.Ruta,
                v.TituloPagina,
                v.Dispositivo,
                v.Navegador,
                v.SistemaOperativo,
                v.Referrer,
                v.Pais,
                v.UsuarioNombre,
                v.UsuarioEmail,
                v.FechaCreacion,
                enLinea = v.FechaCreacion >= hace10Minutos
            })
            .ToListAsync();

        // Páginas más visitadas (Top 10)
        var paginasMasVistas = await db.Visitas
            .GroupBy(v => v.Ruta)
            .Select(g => new
            {
                ruta = g.Key,
                total = g.Count()
            })
            .OrderByDescending(p => p.total)
            .Take(10)
            .ToListAsync();

        // Desglose por dispositivo
        var porDispositivo = await db.Visitas
            .GroupBy(v => v.Dispositivo)
            .Select(g => new
            {
                dispositivo = g.Key,
                total = g.Count()
            })
            .OrderByDescending(d => d.total)
            .ToListAsync();

        // Desglose por origen / Referrer
        var porOrigen = await db.Visitas
            .GroupBy(v => v.Referrer ?? "Directo")
            .Select(g => new
            {
                origen = g.Key,
                total = g.Count()
            })
            .OrderByDescending(o => o.total)
            .Take(6)
            .ToListAsync();

        // Detección de Carritos Abandonados (Visitas a /carrito en las últimas 24h sin orden posterior)
        var hace24Horas = DateTime.UtcNow.AddHours(-24);
        var visitasCarrito = await db.Visitas
            .Where(v => v.FechaCreacion >= hace24Horas && v.Ruta.ToLower().Contains("/carrito"))
            .OrderByDescending(v => v.FechaCreacion)
            .ToListAsync();

        var usuariosConOrden = await db.Ordenes
            .Where(o => o.FechaCreacion >= hace24Horas)
            .Select(o => o.UsuarioId)
            .Distinct()
            .ToListAsync();

        var carritosAbandonados = visitasCarrito
            .GroupBy(v => v.SessionId)
            .Select(g =>
            {
                var primera = g.First();
                bool completoOrden = primera.UsuarioId.HasValue && usuariosConOrden.Contains(primera.UsuarioId.Value);
                return new
                {
                    sessionId = g.Key,
                    usuarioId = primera.UsuarioId,
                    usuarioNombre = primera.UsuarioNombre,
                    usuarioEmail = primera.UsuarioEmail,
                    dispositivo = primera.Dispositivo,
                    navegador = primera.Navegador,
                    fecha = primera.FechaCreacion,
                    totalVisitas = g.Count(),
                    completoOrden
                };
            })
            .Where(c => !c.completoOrden)
            .Take(20)
            .ToList();

        return Results.Ok(new
        {
            totalVisitas,
            visitasHoy,
            visitantesUnicos,
            enLineaAhora = sesionesActivas,
            ultimasVisitas,
            paginasMasVistas,
            porDispositivo,
            porOrigen,
            carritosAbandonados
        });
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetVisitas\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al obtener analítica de visitas.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// =========================================================================
// 21. SOCIAL PROOF EN TIEMPO REAL - COMPRAS Y ACTIVIDAD RECIENTE
// =========================================================================
app.MapGet("/api/social-proof/recientes", async (ApplicationDbContext db) =>
{
    try
    {
        var ciudades = new[] { "Lima", "Arequipa", "Trujillo", "Cusco", "Chiclayo", "Piura", "Huancayo", "Tacna" };
        var random = new Random();

        var ultimasOrdenes = await db.Ordenes
            .Include(o => o.Usuario)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(o => o.Estado == "Completada")
            .OrderByDescending(o => o.FechaCreacion)
            .Take(10)
            .ToListAsync();

        var lista = new List<object>();

        foreach (var orden in ultimasOrdenes)
        {
            var detalle = orden.Detalles.FirstOrDefault();
            if (detalle?.Producto == null) continue;

            string nombreAnonimo = "Cliente";
            if (!string.IsNullOrWhiteSpace(orden.Usuario?.Nombre))
            {
                var partes = orden.Usuario.Nombre.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (partes.Length > 1)
                {
                    nombreAnonimo = $"{partes[0]} {partes[1][0]}.";
                }
                else if (partes.Length == 1)
                {
                    nombreAnonimo = partes[0];
                }
            }

            var ciudad = ciudades[random.Next(ciudades.Length)];
            var diffMinutos = Math.Max(2, (int)(DateTime.UtcNow - orden.FechaCreacion).TotalMinutes);
            string tiempoStr = diffMinutos < 60 ? $"Hace {diffMinutos} min" : (diffMinutos < 1440 ? $"Hace {diffMinutos / 60} h" : "Hace 1 día");

            lista.Add(new
            {
                id = orden.Id,
                cliente = nombreAnonimo,
                ciudad = ciudad,
                producto = detalle.Producto.Nombre,
                categoria = detalle.Producto.Categoria,
                imagenUrl = detalle.Producto.ImagenUrl,
                tiempo = tiempoStr
            });
        }

        // Si hay menos de 5 órdenes en BD (ej. en desarrollo o nueva tienda), complementar con actividad realista
        if (lista.Count < 5)
        {
            var fallback = new[]
            {
                new { id = 991, cliente = "Carlos M.", ciudad = "Lima", producto = "Canva Pro (12 Meses)", categoria = "Software", imagenUrl = "canva.png", tiempo = "Hace 3 min" },
                new { id = 992, cliente = "Lucía R.", ciudad = "Arequipa", producto = "ChatGPT Plus (1 Mes)", categoria = "IA", imagenUrl = "chatgpt.png", tiempo = "Hace 11 min" },
                new { id = 993, cliente = "Alejandro V.", ciudad = "Trujillo", producto = "Spotify Premium (1 Mes)", categoria = "Streaming", imagenUrl = "spotify.png", tiempo = "Hace 19 min" },
                new { id = 994, cliente = "Mariana S.", ciudad = "Cusco", producto = "Adobe Creative Cloud", categoria = "Software", imagenUrl = "adobe.png", tiempo = "Hace 32 min" },
                new { id = 995, cliente = "David P.", ciudad = "Lima", producto = "Netflix Premium 4K", categoria = "Streaming", imagenUrl = "netflix.png", tiempo = "Hace 45 min" }
            };
            lista.AddRange(fallback.Take(5 - lista.Count));
        }

        return Results.Ok(lista);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al obtener social proof: {ex.Message}");
        return Results.Ok(new List<object>());
    }
});

// =========================================================================
// 22. PACKS & COMBOS PRO DE AHORRO - ENDPOINTS PÚBLICOS Y ADMINISTRATIVOS
// =========================================================================

// A. Obtener Combos Activos para el Catálogo Público
app.MapGet("/api/combos", async (ApplicationDbContext db) =>
{
    try
    {
        var combos = await db.Combos
            .Where(c => c.Activo)
            .OrderBy(c => c.OrdenVisual)
            .ThenBy(c => c.Id)
            .ToListAsync();

        var resultado = combos.Select(c => new
        {
            id = c.Id,
            nombre = c.Nombre,
            subtitulo = c.Subtitulo,
            descripcion = c.Descripcion,
            precioOriginal = c.PrecioOriginal,
            precioCombo = c.PrecioCombo,
            ahorro = c.Ahorro > 0 ? c.Ahorro : Math.Max(0, c.PrecioOriginal - c.PrecioCombo),
            badge = c.Badge,
            items = ParseComboItems(c.ItemsJson),
            activo = c.Activo,
            ordenVisual = c.OrdenVisual
        });

        return Results.Ok(resultado);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: GetCombosPublico\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al obtener packs y combos.", detalle = ex.Message }, statusCode: 500);
    }
});

// B. Obtener Todos los Combos (Modo Administración - Incluye Inactivos)
app.MapGet("/api/admin/combos", async (ApplicationDbContext db) =>
{
    try
    {
        var combos = await db.Combos
            .OrderBy(c => c.OrdenVisual)
            .ThenBy(c => c.Id)
            .ToListAsync();

        var resultado = combos.Select(c => new
        {
            id = c.Id,
            nombre = c.Nombre,
            subtitulo = c.Subtitulo,
            descripcion = c.Descripcion,
            precioOriginal = c.PrecioOriginal,
            precioCombo = c.PrecioCombo,
            ahorro = c.Ahorro > 0 ? c.Ahorro : Math.Max(0, c.PrecioOriginal - c.PrecioCombo),
            badge = c.Badge,
            items = ParseComboItems(c.ItemsJson),
            itemsJson = c.ItemsJson,
            activo = c.Activo,
            ordenVisual = c.OrdenVisual,
            fechaCreacion = c.FechaCreacion
        });

        return Results.Ok(resultado);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminGetCombos\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al listar combos administrativos.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// C. Crear Nuevo Combo
app.MapPost("/api/admin/combos", async (ComboDto dto, ApplicationDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return Results.BadRequest(new { mensaje = "El nombre del combo es obligatorio." });
        }

        var itemsList = dto.Items ?? new List<string>();
        decimal ahorroCalc = (dto.Ahorro.HasValue && dto.Ahorro.Value > 0)
            ? dto.Ahorro.Value
            : Math.Max(0, dto.PrecioOriginal - dto.PrecioCombo);

        var combo = new Combo
        {
            Nombre = dto.Nombre.Trim(),
            Subtitulo = dto.Subtitulo?.Trim() ?? string.Empty,
            Descripcion = dto.Descripcion?.Trim() ?? string.Empty,
            PrecioOriginal = dto.PrecioOriginal,
            PrecioCombo = dto.PrecioCombo,
            Ahorro = ahorroCalc,
            Badge = string.IsNullOrWhiteSpace(dto.Badge) ? "Oferta Especial" : dto.Badge.Trim(),
            ItemsJson = JsonSerializer.Serialize(itemsList),
            Activo = dto.Activo,
            OrdenVisual = dto.OrdenVisual,
            FechaCreacion = DateTime.UtcNow
        };

        db.Combos.Add(combo);
        await db.SaveChangesAsync();

        return Results.Created($"/api/admin/combos/{combo.Id}", combo);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminCreateCombo\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al registrar el combo.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// D. Actualizar Combo Existente
app.MapPut("/api/admin/combos/{id}", async (int id, ComboDto dto, ApplicationDbContext db) =>
{
    try
    {
        var combo = await db.Combos.FindAsync(id);
        if (combo == null)
        {
            return Results.NotFound(new { mensaje = "Combo no encontrado." });
        }

        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return Results.BadRequest(new { mensaje = "El nombre del combo es obligatorio." });
        }

        var itemsList = dto.Items ?? new List<string>();
        decimal ahorroCalc = (dto.Ahorro.HasValue && dto.Ahorro.Value > 0)
            ? dto.Ahorro.Value
            : Math.Max(0, dto.PrecioOriginal - dto.PrecioCombo);

        combo.Nombre = dto.Nombre.Trim();
        combo.Subtitulo = dto.Subtitulo?.Trim() ?? string.Empty;
        combo.Descripcion = dto.Descripcion?.Trim() ?? string.Empty;
        combo.PrecioOriginal = dto.PrecioOriginal;
        combo.PrecioCombo = dto.PrecioCombo;
        combo.Ahorro = ahorroCalc;
        combo.Badge = string.IsNullOrWhiteSpace(dto.Badge) ? "Oferta Especial" : dto.Badge.Trim();
        combo.ItemsJson = JsonSerializer.Serialize(itemsList);
        combo.Activo = dto.Activo;
        combo.OrdenVisual = dto.OrdenVisual;

        await db.SaveChangesAsync();

        return Results.Ok(combo);
    }
    catch (Exception ex)
    {
        var log = $"Fecha: {DateTime.UtcNow}\nComponente: AdminUpdateCombo\nMensaje: {ex.Message}\nTraza: {ex.StackTrace}";
        Console.WriteLine(log);
        return Results.Json(new { mensaje = "Error al actualizar el combo.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// E. Interruptor Rápido de Visibilidad (Activar / Ocultar)
app.MapPut("/api/admin/combos/{id}/toggle-visibilidad", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var combo = await db.Combos.FindAsync(id);
        if (combo == null)
        {
            return Results.NotFound(new { mensaje = "Combo no encontrado." });
        }

        combo.Activo = !combo.Activo;
        await db.SaveChangesAsync();

        return Results.Ok(new 
        { 
            id = combo.Id, 
            activo = combo.Activo, 
            mensaje = combo.Activo ? "Combo activado y visible en la tienda." : "Combo ocultado de la tienda pública." 
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al alternar visibilidad del combo.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// F. Eliminar Combo
app.MapDelete("/api/admin/combos/{id}", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var combo = await db.Combos.FindAsync(id);
        if (combo == null)
        {
            return Results.NotFound(new { mensaje = "Combo no encontrado." });
        }

        db.Combos.Remove(combo);
        await db.SaveChangesAsync();

        return Results.Ok(new { mensaje = "Combo eliminado con éxito." });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al eliminar el combo.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// ==========================================
// MÓDULO: RADAR DE PROVEEDORES & PRECIOS (ADMIN)
// ==========================================

// 1. Obtener todos los productos monitoreados con métricas de margen y tienda
app.MapGet("/api/admin/radar", async (ApplicationDbContext db) =>
{
    try
    {
        var trackings = await db.ProveedorTrackings.OrderBy(t => t.Id).ToListAsync();
        var productos = await db.Productos.ToListAsync();

        var resultado = trackings.Select(t =>
        {
            var prod = t.ProductoId.HasValue ? productos.FirstOrDefault(p => p.Id == t.ProductoId.Value) : productos.FirstOrDefault(p => p.Nombre.ToLower() == t.ProductoNombre.ToLower());
            
            decimal tasa = t.Moneda == "USD" ? 3.75m : 1.00m;
            decimal precioProveedorSoles = Math.Round(t.PrecioProveedor * tasa, 2);
            decimal tiendaPrecio = prod?.Precio ?? 0m;
            decimal tiendaCosto = prod?.CostoProveedor ?? 0m;
            decimal gananciaNetaSoles = tiendaPrecio > 0 && precioProveedorSoles > 0 ? Math.Round(tiendaPrecio - precioProveedorSoles, 2) : 0m;
            decimal margenPorcentaje = tiendaPrecio > 0 && precioProveedorSoles > 0 ? Math.Round(((tiendaPrecio - precioProveedorSoles) / tiendaPrecio) * 100, 1) : 0m;

            string estadoMargen = "sin_vinculo";
            if (prod != null && precioProveedorSoles > 0)
            {
                if (gananciaNetaSoles <= 0) estadoMargen = "perdida";
                else if (margenPorcentaje < 25) estadoMargen = "ajustado";
                else if (margenPorcentaje >= 50) estadoMargen = "optimo";
                else estadoMargen = "bueno";
            }

            return new
            {
                id = t.Id,
                productoId = prod?.Id ?? t.ProductoId,
                productoNombre = t.ProductoNombre,
                proveedorNombre = t.ProveedorNombre,
                proveedorUrl = t.ProveedorUrl,
                precioProveedor = t.PrecioProveedor,
                moneda = t.Moneda,
                precioProveedorSoles = precioProveedorSoles,
                stockProveedor = t.StockProveedor,
                disponible = t.Disponible,
                costoAnterior = t.CostoAnterior,
                variacionPrecio = t.VariacionPrecio,
                notas = t.Notas,
                autoActualizarCosto = t.AutoActualizarCosto,
                ultimaActualizacion = t.UltimaActualizacion,
                tiendaPrecio = tiendaPrecio,
                tiendaCostoActual = tiendaCosto,
                tiendaImagenUrl = prod?.ImagenUrl ?? "",
                tiendaCategoria = prod?.Categoria ?? "General",
                tiendaActivo = prod?.Activo ?? false,
                gananciaNetaSoles = gananciaNetaSoles,
                margenPorcentaje = margenPorcentaje,
                estadoMargen = estadoMargen
            };
        });

        return Results.Ok(resultado);
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al obtener lista del radar de proveedores.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 2. Catálogo en vivo de Compufarma (45 productos directo desde Firestore REST)
app.MapGet("/api/admin/radar/compufarma-catalogo", async (Backend.Services.RadarProveedoresService radarService) =>
{
    try
    {
        var catalogo = await radarService.ObtenerCatalogoCompufarmaAsync(forzar: false);
        return Results.Ok(catalogo);
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al obtener catálogo de Compufarma.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 3. Crear / Vincular nuevo proveedor a monitorear
app.MapPost("/api/admin/radar", async (CrearProveedorTrackingDto dto, ApplicationDbContext db, Backend.Services.RadarProveedoresService radarService) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.ProveedorUrl) || string.IsNullOrWhiteSpace(dto.ProveedorNombre))
        {
            return Results.BadRequest(new { mensaje = "La URL y el Nombre del proveedor son obligatorios." });
        }

        string nombreProducto = dto.ProductoNombre?.Trim() ?? "";
        if (dto.ProductoId.HasValue && string.IsNullOrWhiteSpace(nombreProducto))
        {
            var prod = await db.Productos.FindAsync(dto.ProductoId.Value);
            if (prod != null) nombreProducto = prod.Nombre;
        }

        if (string.IsNullOrWhiteSpace(nombreProducto))
        {
            nombreProducto = "Producto Monitoreado";
        }

        var tracking = new ProveedorTracking
        {
            ProductoId = dto.ProductoId,
            ProductoNombre = nombreProducto,
            ProveedorNombre = dto.ProveedorNombre.Trim(),
            ProveedorUrl = dto.ProveedorUrl.Trim(),
            Moneda = string.IsNullOrWhiteSpace(dto.Moneda) ? "PEN" : dto.Moneda.ToUpper(),
            Notas = dto.Notas,
            AutoActualizarCosto = dto.AutoActualizarCosto ?? false,
            UltimaActualizacion = DateTime.UtcNow,
            PrecioProveedor = dto.PrecioProveedor ?? 0m,
            StockProveedor = dto.StockProveedor,
            Disponible = true
        };

        if (tracking.PrecioProveedor == 0)
        {
            var resultadoScan = await radarService.EscanearProveedorAsync(tracking.ProveedorUrl, tracking.ProveedorNombre, tracking.ProductoNombre);
            if (resultadoScan.Exitoso && resultadoScan.Precio > 0)
            {
                tracking.PrecioProveedor = resultadoScan.Precio;
                tracking.Moneda = resultadoScan.Moneda;
                tracking.StockProveedor = resultadoScan.Stock;
                tracking.Disponible = resultadoScan.Disponible;
                if (!string.IsNullOrWhiteSpace(resultadoScan.Mensaje))
                {
                    tracking.Notas = string.IsNullOrWhiteSpace(tracking.Notas) ? resultadoScan.Mensaje : $"{tracking.Notas} | {resultadoScan.Mensaje}";
                }
            }
        }

        db.ProveedorTrackings.Add(tracking);
        await db.SaveChangesAsync();

        return Results.Created($"/api/admin/radar/{tracking.Id}", tracking);
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al crear monitoreo de proveedor.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 4. Editar proveedor monitoreado
app.MapPut("/api/admin/radar/{id}", async (int id, ActualizarProveedorTrackingDto dto, ApplicationDbContext db) =>
{
    try
    {
        var tracking = await db.ProveedorTrackings.FindAsync(id);
        if (tracking == null)
        {
            return Results.NotFound(new { mensaje = "Registro de monitoreo no encontrado." });
        }

        if (dto.ProductoId.HasValue) tracking.ProductoId = dto.ProductoId;
        if (!string.IsNullOrWhiteSpace(dto.ProductoNombre)) tracking.ProductoNombre = dto.ProductoNombre.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ProveedorNombre)) tracking.ProveedorNombre = dto.ProveedorNombre.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ProveedorUrl)) tracking.ProveedorUrl = dto.ProveedorUrl.Trim();
        if (dto.PrecioProveedor.HasValue)
        {
            if (tracking.PrecioProveedor != dto.PrecioProveedor.Value)
            {
                tracking.CostoAnterior = tracking.PrecioProveedor;
                tracking.VariacionPrecio = dto.PrecioProveedor.Value - tracking.PrecioProveedor;
            }
            tracking.PrecioProveedor = dto.PrecioProveedor.Value;
        }
        if (!string.IsNullOrWhiteSpace(dto.Moneda)) tracking.Moneda = dto.Moneda.ToUpper();
        if (dto.StockProveedor.HasValue) tracking.StockProveedor = dto.StockProveedor.Value;
        if (dto.Disponible.HasValue) tracking.Disponible = dto.Disponible.Value;
        if (dto.Notas != null) tracking.Notas = dto.Notas;
        if (dto.AutoActualizarCosto.HasValue) tracking.AutoActualizarCosto = dto.AutoActualizarCosto.Value;

        tracking.UltimaActualizacion = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(new { mensaje = "Registro actualizado con éxito.", tracking });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al actualizar registro de monitoreo.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 5. Eliminar proveedor monitoreado
app.MapDelete("/api/admin/radar/{id}", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var tracking = await db.ProveedorTrackings.FindAsync(id);
        if (tracking == null)
        {
            return Results.NotFound(new { mensaje = "Registro de monitoreo no encontrado." });
        }

        db.ProveedorTrackings.Remove(tracking);
        await db.SaveChangesAsync();

        return Results.Ok(new { mensaje = "Monitoreo eliminado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al eliminar monitoreo.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 6. Escaneo individual de un proveedor
app.MapPost("/api/admin/radar/{id}/scan", async (int id, ApplicationDbContext db, Backend.Services.RadarProveedoresService radarService) =>
{
    try
    {
        var tracking = await db.ProveedorTrackings.FindAsync(id);
        if (tracking == null)
        {
            return Results.NotFound(new { mensaje = "Registro de monitoreo no encontrado." });
        }

        var scan = await radarService.EscanearProveedorAsync(tracking.ProveedorUrl, tracking.ProveedorNombre, tracking.ProductoNombre);
        if (scan.Exitoso && scan.Precio > 0)
        {
            if (tracking.PrecioProveedor > 0 && tracking.PrecioProveedor != scan.Precio)
            {
                tracking.CostoAnterior = tracking.PrecioProveedor;
                tracking.VariacionPrecio = scan.Precio - tracking.PrecioProveedor;
            }
            tracking.PrecioProveedor = scan.Precio;
            tracking.Moneda = scan.Moneda;
            tracking.StockProveedor = scan.Stock;
            tracking.Disponible = scan.Disponible;
            tracking.UltimaActualizacion = DateTime.UtcNow;

            if (tracking.AutoActualizarCosto && tracking.ProductoId.HasValue)
            {
                var prod = await db.Productos.FindAsync(tracking.ProductoId.Value);
                if (prod != null)
                {
                    decimal tasa = tracking.Moneda == "USD" ? 3.75m : 1.00m;
                    prod.CostoProveedor = Math.Round(tracking.PrecioProveedor * tasa, 2);
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { exitoso = true, scan, tracking, mensaje = $"Precio actualizado a {tracking.Moneda} {tracking.PrecioProveedor:F2}" });
        }

        return Results.Ok(new { exitoso = false, scan, mensaje = scan.Mensaje });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error durante el escaneo del proveedor.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 7. Escaneo masivo en paralelo de todos los proveedores activos
app.MapPost("/api/admin/radar/scan", async (ApplicationDbContext db, Backend.Services.RadarProveedoresService radarService) =>
{
    try
    {
        var trackings = await db.ProveedorTrackings.ToListAsync();
        var productos = await db.Productos.ToListAsync();

        int exitosos = 0;
        int fallidos = 0;

        var scanTasks = trackings.Select(async t =>
        {
            try
            {
                var scan = await radarService.EscanearProveedorAsync(t.ProveedorUrl, t.ProveedorNombre, t.ProductoNombre);
                if (scan.Exitoso && scan.Precio > 0)
                {
                    if (t.PrecioProveedor > 0 && t.PrecioProveedor != scan.Precio)
                    {
                        t.CostoAnterior = t.PrecioProveedor;
                        t.VariacionPrecio = scan.Precio - t.PrecioProveedor;
                    }
                    t.PrecioProveedor = scan.Precio;
                    t.Moneda = scan.Moneda;
                    t.StockProveedor = scan.Stock;
                    t.Disponible = scan.Disponible;
                    t.UltimaActualizacion = DateTime.UtcNow;

                    if (t.AutoActualizarCosto && t.ProductoId.HasValue)
                    {
                        var prod = productos.FirstOrDefault(p => p.Id == t.ProductoId.Value);
                        if (prod != null)
                        {
                            decimal tasa = t.Moneda == "USD" ? 3.75m : 1.00m;
                            prod.CostoProveedor = Math.Round(t.PrecioProveedor * tasa, 2);
                        }
                    }

                    Interlocked.Increment(ref exitosos);
                }
                else
                {
                    Interlocked.Increment(ref fallidos);
                }
            }
            catch
            {
                Interlocked.Increment(ref fallidos);
            }
        });

        await Task.WhenAll(scanTasks);
        await db.SaveChangesAsync();

        return Results.Ok(new 
        { 
            mensaje = $"Escaneo completado: {exitosos} actualizados con éxito, {fallidos} sin cambios.",
            total = trackings.Count,
            exitosos,
            fallidos,
            fecha = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error en escaneo masivo de proveedores.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

// 8. Aplicar precio del proveedor como CostoProveedor en la tienda (1-Click Sync)
app.MapPost("/api/admin/radar/{id}/aplicar-costo", async (int id, ApplicationDbContext db) =>
{
    try
    {
        var tracking = await db.ProveedorTrackings.FindAsync(id);
        if (tracking == null)
        {
            return Results.NotFound(new { mensaje = "Registro de monitoreo no encontrado." });
        }

        if (!tracking.ProductoId.HasValue)
        {
            return Results.BadRequest(new { mensaje = "Este registro no está vinculado a un producto de la tienda." });
        }

        var producto = await db.Productos.FindAsync(tracking.ProductoId.Value);
        if (producto == null)
        {
            return Results.NotFound(new { mensaje = "El producto vinculado no existe en la tienda." });
        }

        decimal tasa = tracking.Moneda == "USD" ? 3.75m : 1.00m;
        decimal nuevoCostoSoles = Math.Round(tracking.PrecioProveedor * tasa, 2);

        decimal costoAnterior = producto.CostoProveedor;
        producto.CostoProveedor = nuevoCostoSoles;
        await db.SaveChangesAsync();

        return Results.Ok(new 
        { 
            mensaje = $"Costo del producto '{producto.Nombre}' actualizado a S/ {nuevoCostoSoles:F2} (antes: S/ {costoAnterior:F2}).",
            productoId = producto.Id,
            costoAnterior = costoAnterior,
            nuevoCosto = nuevoCostoSoles
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { mensaje = "Error al sincronizar costo con el producto.", detalle = ex.Message }, statusCode: 500);
    }
}).RequireAdminRole();

static List<string> ParseComboItems(string? json)
{
    if (string.IsNullOrWhiteSpace(json)) return new List<string>();
    try
    {
        return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
    }
    catch
    {
        return new List<string>();
    }
}

app.Run();

// --- DATA TRANSFER OBJECTS (DTOs) ---
public record LoginDto(string Email, string Password);
public record RegisterDto(string Nombre, string Email, string PasswordHash, string WhatsApp);
public record ItemOrdenDto(int ProductoId, int Cantidad);
public record CrearOrdenDto(int UsuarioId, List<ItemOrdenDto> Items, string? CuponCodigo = null);
public record ValidarCuponDto(string Codigo);
public record CompletarOrdenDto(Dictionary<int, string>? ClavesPorDetalle);
public record EditarOrdenDto(List<ItemOrdenDto> Items);
public record RegistrarClienteDto(string Nombre, string Email, string? Dni, string? Telefono, string PasswordInicial);
public record EditarClienteDto(string Nombre, string Email, string? Dni, string? Telefono, string? AsignarNuevaContrasena);
public record ProductoExternoDto(int Id, string Nombre, string Descripcion, decimal Precio, int DuracionMeses, string Categoria, string ImagenUrl, bool Activo);
public record RegistrarVisitaDto(string SessionId, string Ruta, string? TituloPagina, string? Dispositivo, string? Navegador, string? SistemaOperativo, string? Referrer, int? UsuarioId, string? UsuarioNombre, string? UsuarioEmail);
public record ComboDto(string Nombre, string? Subtitulo, string? Descripcion, decimal PrecioOriginal, decimal PrecioCombo, decimal? Ahorro, string? Badge, List<string>? Items, bool Activo, int OrdenVisual);
public record CrearProveedorTrackingDto(int? ProductoId, string? ProductoNombre, string ProveedorNombre, string ProveedorUrl, decimal? PrecioProveedor, string? Moneda, int? StockProveedor, string? Notas, bool? AutoActualizarCosto);
public record ActualizarProveedorTrackingDto(int? ProductoId, string? ProductoNombre, string? ProveedorNombre, string? ProveedorUrl, decimal? PrecioProveedor, string? Moneda, int? StockProveedor, bool? Disponible, string? Notas, bool? AutoActualizarCosto);


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
            { "exp", DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeSeconds() }
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