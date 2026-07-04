using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Producto
{
    [Key]
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre del producto es obligatorio")]
    [MaxLength(150, ErrorMessage = "El nombre del producto no puede superar los 150 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres")]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El precio es obligatorio")]
    [Range(0.01, 10000.00, ErrorMessage = "El precio debe estar entre 0.01 y 10000.00")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Precio { get; set; }

    [Required(ErrorMessage = "La duración en meses es obligatoria")]
    [Range(0, 120, ErrorMessage = "La duración en meses debe estar entre 0 (perpetuo) y 120 meses")]
    public int DuracionMeses { get; set; } // 0 = Perpetuo, 1 = Mensual, 12 = Anual

    [Required(ErrorMessage = "La categoría es obligatoria")]
    [MaxLength(50)]
    public string Categoria { get; set; } = string.Empty; // "Software", "Streaming", "IA"

    [MaxLength(2048)]
    public string ImagenUrl { get; set; } = string.Empty;
}
