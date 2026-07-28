namespace Backend.Models;

public class Cupon
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public decimal PorcentajeDescuento { get; set; } = 0m;
    public decimal MontoDescuentoFijo { get; set; } = 0m;
    public bool EsPorcentaje { get; set; } = true;
    public bool Activo { get; set; } = true;
    public int UsosMaximos { get; set; } = 100;
    public int UsosActuales { get; set; } = 0;
    public DateTime? FechaExpiracion { get; set; }
}
