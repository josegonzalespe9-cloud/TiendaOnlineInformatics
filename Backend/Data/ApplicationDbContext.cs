using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Orden> Ordenes => Set<Orden>();
    public DbSet<DetalleOrden> DetalleOrdenes => Set<DetalleOrden>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración de índice único para el Email de Usuario
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Configurar la relación uno a muchos entre Usuario y Ordenes
        modelBuilder.Entity<Orden>()
            .HasOne(o => o.Usuario)
            .WithMany(u => u.Ordenes)
            .HasForeignKey(o => o.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configurar relaciones de DetalleOrden
        modelBuilder.Entity<DetalleOrden>()
            .HasOne(d => d.Orden)
            .WithMany(o => o.Detalles)
            .HasForeignKey(d => d.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DetalleOrden>()
            .HasOne(d => d.Producto)
            .WithMany()
            .HasForeignKey(d => d.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
