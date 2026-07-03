using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Orden
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = "Pendiente"; // "Pendiente", "Completada", "Cancelada"

    [Required]
    [Range(0.00, 100000.00)]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    public ICollection<DetalleOrden> Detalles { get; set; } = new List<DetalleOrden>();
}
