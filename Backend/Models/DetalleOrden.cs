using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class DetalleOrden
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OrdenId { get; set; }

    [ForeignKey("OrdenId")]
    [JsonIgnore] // Previene ciclos de referencia durante la serialización JSON
    public Orden? Orden { get; set; }

    [Required]
    public int ProductoId { get; set; }

    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    [Required]
    [Range(1, 1000, ErrorMessage = "La cantidad debe ser de al menos 1")]
    public int Cantidad { get; set; }

    [Required]
    [Range(0.01, 10000.00)]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; } // Precio congelado al momento del pedido

    [Column(TypeName = "nvarchar(max)")]
    public string? ClaveEntregada { get; set; } // Clave de licencia o datos de cuenta entregada manualmente

    public DateTime? FechaActivacion { get; set; } // Cuándo el administrador completó la orden

    public DateTime? FechaVencimiento { get; set; } // FechaActivacion + DuracionMeses (si DuracionMeses > 0)

    [Required]
    public bool AlertaEnviada { get; set; } = false; // Bandera para evitar alertas duplicadas
}
