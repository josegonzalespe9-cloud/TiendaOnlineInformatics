using System.Text.RegularExpressions;
using System.Text.Json;
using System.Globalization;

namespace Backend.Services;

public record ResultadoScraping(
    bool Exitoso, 
    decimal Precio, 
    string Moneda, 
    int? Stock, 
    bool Disponible, 
    string Mensaje, 
    string? ProveedorDetectado
);

public class CompufarmaItem
{
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal PrecioVenta { get; set; }
    public int Stock { get; set; }
    public string Moneda { get; set; } = "PEN";
    public string ImagenUrl { get; set; } = string.Empty;
}

public class RadarProveedoresService
{
    private static readonly HttpClient _httpClient = new HttpClient
    {
        Timeout = TimeSpan.FromSeconds(15)
    };

    static RadarProveedoresService()
    {
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
        _httpClient.DefaultRequestHeaders.Accept.ParseAdd("text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        _httpClient.DefaultRequestHeaders.AcceptLanguage.ParseAdd("es-PE,es;q=0.9,en;q=0.8");
    }

    private static List<CompufarmaItem>? _cacheCompufarma = null;
    private static DateTime _cacheCompufarmaExpira = DateTime.MinValue;

    public async Task<List<CompufarmaItem>> ObtenerCatalogoCompufarmaAsync(bool forzar = false)
    {
        if (!forzar && _cacheCompufarma != null && DateTime.UtcNow < _cacheCompufarmaExpira)
        {
            return _cacheCompufarma;
        }

        try
        {
            var url = "https://firestore.googleapis.com/v1/projects/rnfirebaseinventory/databases/(default)/documents/business/FahM4DQOhJHTpRSgh5UB/products?pageSize=100";
            var response = await _httpClient.GetStringAsync(url);
            using var doc = JsonDocument.Parse(response);
            
            var items = new List<CompufarmaItem>();
            if (doc.RootElement.TryGetProperty("documents", out var docsElement))
            {
                foreach (var d in docsElement.EnumerateArray())
                {
                    if (!d.TryGetProperty("fields", out var fields)) continue;

                    string name = "";
                    if (fields.TryGetProperty("originalName", out var origName) && origName.TryGetProperty("stringValue", out var on))
                        name = on.GetString() ?? "";
                    else if (fields.TryGetProperty("name", out var n) && n.TryGetProperty("stringValue", out var nv))
                        name = nv.GetString() ?? "";

                    decimal precio = 0m;
                    if (fields.TryGetProperty("price", out var p))
                    {
                        if (p.TryGetProperty("integerValue", out var iv) && decimal.TryParse(iv.GetString(), out var piv))
                            precio = piv;
                        else if (p.TryGetProperty("doubleValue", out var dv))
                            precio = Convert.ToDecimal(dv.GetDouble());
                    }

                    decimal salePrice = precio;
                    if (fields.TryGetProperty("salePrice", out var sp))
                    {
                        if (sp.TryGetProperty("integerValue", out var spiv) && decimal.TryParse(spiv.GetString(), out var spval))
                            salePrice = spval;
                        else if (sp.TryGetProperty("doubleValue", out var spdv))
                            salePrice = Convert.ToDecimal(spdv.GetDouble());
                    }

                    int stock = 0;
                    if (fields.TryGetProperty("stock", out var st) && st.TryGetProperty("integerValue", out var stiv) && int.TryParse(stiv.GetString(), out var stVal))
                        stock = stVal;

                    string currency = "PEN";
                    if (fields.TryGetProperty("currencyType", out var ct) && ct.TryGetProperty("stringValue", out var ctsv))
                        currency = ctsv.GetString() ?? "PEN";

                    string img = "";
                    if (fields.TryGetProperty("images", out var imgs) && imgs.TryGetProperty("arrayValue", out var av) && av.TryGetProperty("values", out var vals))
                    {
                        foreach (var v in vals.EnumerateArray())
                        {
                            if (v.TryGetProperty("stringValue", out var imgStr))
                            {
                                img = imgStr.GetString() ?? "";
                                break;
                            }
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        items.Add(new CompufarmaItem
                        {
                            Nombre = name,
                            Precio = precio,
                            PrecioVenta = salePrice,
                            Stock = stock,
                            Moneda = currency,
                            ImagenUrl = img
                        });
                    }
                }
            }

            _cacheCompufarma = items;
            _cacheCompufarmaExpira = DateTime.UtcNow.AddMinutes(5);
            return items;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al consultar Compufarma: {ex.Message}");
            return _cacheCompufarma ?? new List<CompufarmaItem>();
        }
    }

    public async Task<ResultadoScraping> EscanearProveedorAsync(string url, string proveedorNombre, string productoNombre)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return new ResultadoScraping(false, 0, "PEN", null, false, "URL no especificada", proveedorNombre);
        }

        var urlLower = url.ToLower();
        var provLower = proveedorNombre.ToLower();

        // 1. COMPUFARMA / GANVENT
        if (urlLower.Contains("compufarma") || urlLower.Contains("ganvent") || provLower.Contains("compufarma"))
        {
            var catalogo = await ObtenerCatalogoCompufarmaAsync();
            var item = catalogo.FirstOrDefault(c => 
                urlLower.Contains(c.Nombre.ToLower()) || 
                c.Nombre.ToLower().Contains(productoNombre.ToLower()) ||
                productoNombre.ToLower().Contains(c.Nombre.ToLower())
            );

            if (item != null)
            {
                return new ResultadoScraping(
                    Exitoso: true,
                    Precio: item.Precio,
                    Moneda: item.Moneda,
                    Stock: item.Stock,
                    Disponible: item.Stock > 0,
                    Mensaje: $"Sincronizado vía Compufarma API ({item.Nombre})",
                    ProveedorDetectado: "Ganvent (Compufarma)"
                );
            }

            // Fallback si no hay match por nombre exacto, buscar palabras clave
            var palabras = productoNombre.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var itemAprox = catalogo.FirstOrDefault(c => palabras.Any(pal => pal.Length > 3 && c.Nombre.ToLower().Contains(pal)));
            if (itemAprox != null)
            {
                return new ResultadoScraping(
                    Exitoso: true,
                    Precio: itemAprox.Precio,
                    Moneda: itemAprox.Moneda,
                    Stock: itemAprox.Stock,
                    Disponible: itemAprox.Stock > 0,
                    Mensaje: $"Coincidencia aproximada en Compufarma ({itemAprox.Nombre})",
                    ProveedorDetectado: "Ganvent (Compufarma)"
                );
            }

            return new ResultadoScraping(false, 0, "PEN", null, false, "Producto no encontrado en catálogo de Compufarma", "Ganvent (Compufarma)");
        }

        // 2. SKYSTREAMING PERU
        if (urlLower.Contains("skystreaming") || provLower.Contains("skystreaming"))
        {
            try
            {
                var targetUrl = url.StartsWith("http") ? url : $"https://skystreaming.com.pe/{url.TrimStart('/')}";
                var html = await _httpClient.GetStringAsync(targetUrl);

                // Buscar precio en Soles (ej: S/ 5.27 o S/ 15.00)
                var matchSoles = Regex.Match(html, @"art-precio-moneda-local[^>]*>[\s\S]*?<span>[\s\S]*?(S/\s*[\d,.]+)[\s\S]*?</span>", RegexOptions.IgnoreCase);
                decimal precioDetectado = 0m;
                string moneda = "PEN";

                if (matchSoles.Success)
                {
                    var raw = matchSoles.Groups[1].Value.Replace("S/", "").Replace(" ", "").Trim();
                    if (decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
                    {
                        precioDetectado = parsed;
                    }
                }

                // Si no encontró S/, buscar en Dólares $
                if (precioDetectado == 0m)
                {
                    var matchDolares = Regex.Match(html, @"art-price-value[^>]*>[\s\S]*?\$([\d,.]+)[\s\S]*?</span>", RegexOptions.IgnoreCase);
                    if (matchDolares.Success)
                    {
                        var raw = matchDolares.Groups[1].Value.Trim();
                        if (decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedUsd))
                        {
                            precioDetectado = parsedUsd;
                            moneda = "USD";
                        }
                    }
                }

                // Buscar stock
                int? stockDetectado = null;
                var matchStock = Regex.Match(html, @"producto-stock[^>]*>(\d+)</strong>", RegexOptions.IgnoreCase);
                if (matchStock.Success && int.TryParse(matchStock.Groups[1].Value, out var stVal))
                {
                    stockDetectado = stVal;
                }

                if (precioDetectado > 0m)
                {
                    return new ResultadoScraping(
                        Exitoso: true,
                        Precio: precioDetectado,
                        Moneda: moneda,
                        Stock: stockDetectado,
                        Disponible: stockDetectado == null || stockDetectado > 0,
                        Mensaje: $"Leído de SkyStreaming ({moneda} {precioDetectado:F2})",
                        ProveedorDetectado: "SkyStreaming Perú"
                    );
                }

                return new ResultadoScraping(false, 0, "PEN", null, false, "No se pudo extraer el precio del HTML de SkyStreaming", "SkyStreaming Perú");
            }
            catch (Exception ex)
            {
                return new ResultadoScraping(false, 0, "PEN", null, false, $"Error al conectar con SkyStreaming: {ex.Message}", "SkyStreaming Perú");
            }
        }

        // 3. G2A MARKETPLACE
        if (urlLower.Contains("g2a.com") || provLower.Contains("g2a"))
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var html = await response.Content.ReadAsStringAsync();
                    var matchPrice = Regex.Match(html, @"\""price\"":\s*\""?([\d.]+)\""?", RegexOptions.IgnoreCase);
                    if (matchPrice.Success && decimal.TryParse(matchPrice.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var pG2A))
                    {
                        return new ResultadoScraping(true, pG2A, "USD", 10, true, "Precio extraído de G2A", "G2A Marketplace");
                    }
                }

                return new ResultadoScraping(
                    Exitoso: true,
                    Precio: 0m,
                    Moneda: "USD",
                    Stock: null,
                    Disponible: true,
                    Mensaje: "G2A activo (Cloudflare detectado - consultar enlace directo o API)",
                    ProveedorDetectado: "G2A Marketplace"
                );
            }
            catch (Exception ex)
            {
                return new ResultadoScraping(false, 0, "USD", null, false, $"G2A: {ex.Message}", "G2A Marketplace");
            }
        }

        // 4. OTRO PROVEEDOR GENÉRICO
        try
        {
            var targetUrl = url.StartsWith("http") ? url : $"https://{url}";
            var html = await _httpClient.GetStringAsync(targetUrl);
            var matchSoles = Regex.Match(html, @"S/\.?\s*([\d,.]+)", RegexOptions.IgnoreCase);
            if (matchSoles.Success)
            {
                var raw = matchSoles.Groups[1].Value.Trim();
                if (decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
                {
                    return new ResultadoScraping(true, parsed, "PEN", null, true, "Precio genérico detectado", proveedorNombre);
                }
            }

            return new ResultadoScraping(false, 0, "PEN", null, false, "No se encontró precio visible en el enlace", proveedorNombre);
        }
        catch (Exception ex)
        {
            return new ResultadoScraping(false, 0, "PEN", null, false, $"Error al consultar URL: {ex.Message}", proveedorNombre);
        }
    }
}
