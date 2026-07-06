using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class Usuario
{
    [Key]
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido")]
    [MaxLength(150, ErrorMessage = "El correo electrónico no puede superar los 150 caracteres")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MaxLength(255)]
    [JsonIgnore] // No exponer el hash de la contraseña en las respuestas de la API
    public string PasswordHash { get; set; } = string.Empty;

    [Required(ErrorMessage = "El número de WhatsApp es obligatorio")]
    [MaxLength(20, ErrorMessage = "El número de WhatsApp no puede superar los 20 caracteres")]
    [Phone(ErrorMessage = "El formato de número telefónico no es válido")]
    public string WhatsApp { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Rol { get; set; } = "Cliente"; // "Cliente" o "Admin"

    [MaxLength(20)]
    public string? Dni { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefono { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    [JsonIgnore]
    public ICollection<Orden> Ordenes { get; set; } = new List<Orden>();
}
