using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("Combos")]
public class Combo
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Subtitulo { get; set; } = string.Empty;

    [MaxLength(600)]
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioOriginal { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioCombo { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Ahorro { get; set; }

    [MaxLength(100)]
    public string? Badge { get; set; } = "Oferta Especial";

    // Nombres o títulos de los productos incluidos en formato JSON serializado: ["Windows 11 Pro", "Office 2024"]
    public string ItemsJson { get; set; } = "[]";

    public bool Activo { get; set; } = true;

    public int OrdenVisual { get; set; } = 0;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
