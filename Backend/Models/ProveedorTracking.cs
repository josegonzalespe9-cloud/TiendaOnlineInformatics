using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("ProveedorTrackings")]
public class ProveedorTracking
{
    [Key]
    public int Id { get; set; }

    public int? ProductoId { get; set; }

    [Required]
    [MaxLength(150)]
    public string ProductoNombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ProveedorNombre { get; set; } = string.Empty; // "Compufarma", "SkyStreaming", "G2A", "Otro"

    [Required]
    [MaxLength(500)]
    public string ProveedorUrl { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioProveedor { get; set; } = 0.00m;

    [MaxLength(10)]
    public string Moneda { get; set; } = "PEN"; // "PEN" o "USD"

    public int? StockProveedor { get; set; }

    public bool Disponible { get; set; } = true;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CostoAnterior { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal VariacionPrecio { get; set; } = 0.00m;

    [MaxLength(255)]
    public string? Notas { get; set; }

    public bool AutoActualizarCosto { get; set; } = false;

    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
}
