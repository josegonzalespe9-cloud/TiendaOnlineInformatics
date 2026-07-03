using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Services;

public class WorkerRenovaciones : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WorkerRenovaciones> _logger;
    private static readonly TimeSpan RunInterval = TimeSpan.FromHours(24);

    public WorkerRenovaciones(IServiceProvider serviceProvider, ILogger<WorkerRenovaciones> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WorkerRenovaciones iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarAlertasRenovacionAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                // Telemetría de errores blindada según especificaciones
                string logMessage = $"[TELEMETRIA_ERROR] \n" +
                                    $"Fecha_Hora: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
                                    $"Componente: WorkerRenovaciones\n" +
                                    $"Mensaje_Técnico: {ex.Message}\n" +
                                    $"Traza_Código: {ex.StackTrace}";
                
                _logger.LogError(ex, "{LogMessage}", logMessage);
            }

            try
            {
                // Esperar 24 horas o hasta cancelación
                await Task.Delay(RunInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                _logger.LogInformation("WorkerRenovaciones se está deteniendo.");
            }
        }
    }

    private async Task ProcesarAlertasRenovacionAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // La fecha objetivo es exactamente 5 días en el futuro (comparación a nivel de fecha sin hora)
        DateTime targetDate = DateTime.UtcNow.Date.AddDays(5);
        _logger.LogInformation("Buscando licencias con vencimiento para el día: {TargetDate:yyyy-MM-dd}", targetDate);

        // Obtener detalles de orden expirando en exactamente 5 días
        var detallesPorExpirar = await dbContext.DetalleOrdenes
            .Include(d => d.Producto)
            .Include(d => d.Orden)
                .ThenInclude(o => o!.Usuario)
            .Where(d => d.FechaVencimiento != null 
                     && !d.AlertaEnviada 
                     && d.FechaVencimiento.Value.Date == targetDate)
            .ToListAsync(stoppingToken);

        if (detallesPorExpirar.Count == 0)
        {
            _logger.LogInformation("No se encontraron licencias que venzan en exactamente 5 días.");
            return;
        }

        foreach (var detalle in detallesPorExpirar)
        {
            try
            {
                var usuario = detalle.Orden?.Usuario;
                var producto = detalle.Producto;

                if (usuario != null && producto != null)
                {
                    // Registro de la alerta en el log administrativo
                    string alertaLog = $"La cuenta/licencia de '{producto.Nombre}' para el cliente '{usuario.Nombre}' (WhatsApp: {usuario.WhatsApp}) vence en 5 días ({detalle.FechaVencimiento:yyyy-MM-dd}). Prepara el stock con el proveedor.";
                    _logger.LogWarning("[ALERTA_RENOVACION] {AlertaLog}", alertaLog);

                    // Simulación del envío de correo de alerta
                    _logger.LogInformation("Enviando correo automático a {Email} para renovar {Producto}.", usuario.Email, producto.Nombre);

                    // Marcar como alerta enviada para no repetir
                    detalle.AlertaEnviada = true;
                }
            }
            catch (Exception ex)
            {
                // Error individual por registro no detiene el procesamiento de los demás
                string logMessage = $"[TELEMETRIA_ERROR] \n" +
                                    $"Fecha_Hora: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
                                    $"Componente: WorkerRenovaciones (Procesamiento Detalle {detalle.Id})\n" +
                                    $"Mensaje_Técnico: {ex.Message}\n" +
                                    $"Traza_Código: {ex.StackTrace}";
                
                _logger.LogError(ex, "{LogMessage}", logMessage);
            }
        }

        // Guardar cambios de las banderas actualizadas
        await dbContext.SaveChangesAsync(stoppingToken);
        _logger.LogInformation("Procesamiento de alertas de renovación completado.");
    }
}
