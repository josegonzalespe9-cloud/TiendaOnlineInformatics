using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("Visitas")]
public class Visita
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string SessionId { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Ruta { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? TituloPagina { get; set; }

    [MaxLength(50)]
    public string Dispositivo { get; set; } = "Escritorio"; // Escritorio, Móvil, Tablet

    [MaxLength(50)]
    public string Navegador { get; set; } = "Desconocido"; // Chrome, Edge, Safari, Firefox, etc.

    [MaxLength(50)]
    public string SistemaOperativo { get; set; } = "Desconocido"; // Windows, Android, iOS, MacOS, Linux

    [MaxLength(255)]
    public string? Referrer { get; set; } = "Directo"; // WhatsApp, Google, Facebook, Directo, etc.

    [MaxLength(100)]
    public string? Pais { get; set; } = "Perú";

    public int? UsuarioId { get; set; }

    [MaxLength(150)]
    public string? UsuarioNombre { get; set; }

    [MaxLength(150)]
    public string? UsuarioEmail { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
