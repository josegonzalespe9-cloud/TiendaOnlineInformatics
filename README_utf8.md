# 📄 Informatics: Especificaciones del Sistema Web Modular (.NET 10 & React)

---

## 1. Arquitectura Base y Backend (.NET 10)

El motor de **TiendaOnlineInformatics** (nombre comercial: **Informatics**) se diseña como una API REST robusta y centralizada en la nube utilizando C# con **.NET 10** y **Microsoft SQL Server** con Entity Framework Core. Su responsabilidad exclusiva es el procesamiento de datos, la seguridad criptográfica y la automatización del motor de alertas temporales.

### 🛠️ Flujo Mixto de Compra y Aprovisionamiento (MVP Mago de Oz)
Para eliminar el riesgo financiero de inventario y la necesidad de acuerdos iniciales con mayoristas (como Ingram Micro o Nexsys), se implementa un flujo semi-automatizado de cara al usuario.
* **Acción del Backend:** Al confirmar el carrito, el backend de .NET 10 registra la orden de compra con estado *"Pendiente"* y congela los precios unitarios en la tabla `DetalleOrdenes`.
* **Petición HTTP y Tokenización:** Todas las transacciones de los productos (licencias de software, herramientas de IA y accesos de streaming) se validan mediante **Tokens JWT**.
* **Redirección Automatizada:** Al procesar la orden con éxito (código 201), el sistema calcula una cadena de texto dinámica y redirige al usuario a la API de WhatsApp con el número de pedido listo para coordinar la entrega manual.
* **Recomendación de Ingeniería:** Utilizar las optimizaciones nativas de colecciones asíncronas de .NET 10 acopladas a un **Background Service (Worker Service)** que herede de `BackgroundService`. Este servicio auditará la base de datos de manera blindada cada 24 horas buscando licencias que expiren en exactamente **5 días** para disparar alertas automáticas de renovación por correo al cliente y al administrador.

### 🛡️ Código de Trastienda con Manejo de Errores Blindado
Cada endpoint crítico de la API de .NET 10 (Autenticación, Productos, Ordenes) se implementa bajo una estricta política de manejo de excepciones mediante bloques `try-catch` estructurados. Si una consulta falla o un servicio experimenta intermitencia, el sistema responderá con un código HTTP controlado, previniendo excepciones no controladas en producción.

---

## 2. Frontend Modular e Interactivo (React)

La interfaz de usuario se construye sobre **React** optimizado con **Vite** como empaquetador de velocidad extrema y **React Router DOM** para gestionar una Single Page Application (SPA) fluida y adaptativa en todos los dispositivos (móviles, tablets y computadoras).

### 🗂️ Estructura Visual de Pantallas de "Informatics"
El Frontend se divide estrictamente en secciones modulares independientes utilizando clases responsivas de **Tailwind CSS** con breakpoints estratégicos (`sm:`, `md:`, `lg:`) para asegurar una visualización óptima desde celulares:
* **Sección 1: Control de Sesión y Autenticación:** Pantalla de registro obligatorio y Login seguro mediante tokens JWT guardados localmente para identificar de forma infalible al cliente, capturando su correo y WhatsApp.
* **Sección 2: Catálogo e Inventario Dinámico:** Vista interactiva que renderiza el catálogo unificado de licencias de software (Windows 10/11, Office Permanente, Antivirus ESET, Canva Pro, ChatGPT, CapCut, etc.) y streaming (Netflix, HBO Max, Prime Video, Paramount, YouTube Premium, Spotify Premium).
* **Sección 3: Carrito de Compras (Procesamiento):** Vista que consolida los ítems seleccionados y calcula el total. Al accionar el botón de confirmación, realiza el *fetch* al backend y procesa el enlace dinámico prellenado hacia el WhatsApp corporativo.
* **Sección 4: Panel del Cliente (Control Temporal):** Panel privado donde el usuario visualiza qué compró, cuánto pagó, la fecha exacta de vencimiento de su servicio y el estado de sus suscripciones activas.

### ⚡ Sincronización de Estados y Validación Multi-Dispositivo
1. **Estrategia Mobile-First:** Debido a que el 80% de las compras de streaming provienen de smartphones, la interfaz prioriza el uso de elementos táctiles y accesibles con el pulgar en los simuladores móviles provistos por **Project IDX**.
2. **Bloqueo Visual de Estados:** Si una cuenta de streaming o licencia alcanza su fecha de vencimiento configurada en SQL Server, el Panel del Cliente altera su paleta visual mostrando una etiqueta de *"Expirado"* y habilitando un botón directo de renovación.

### 🧼 Seguridad en la Interfaz (Validaciones del Modal)
Para blindar el Frontend contra excepciones comunes del navegador como los errores de tipo *Cannot read property of undefined*, todas las ventanas emergentes (modales de soporte o alertas) implementan verificaciones lógicas estrictas del tipo `if (miModal)` antes de intentar manipular elementos del DOM que podrían no haberse renderizado a tiempo.

---

## 3. Panel de Administración y Canal de Soporte (Backoffice)

Esta sección permite controlar las operaciones comerciales y gestionar las incidencias directamente desde herramientas integradas en el ecosistema.

### 🎛️ Funcionalidades del Panel Administrativo:
* **Gestión de Órdenes Pendientes:** Pantalla en React de uso exclusivo del administrador para visualizar los pedidos entrantes provenientes de WhatsApp, cambiar el estado a *"Completada"* e ingresar opcionalmente la clave entregada.
* **Control Temporal del Catálogo:** Selector para configurar los campos de control en la tabla `Productos`: `Precio` y `DuracionMeses` (especificando si el producto es de pago mensual, anual como ESET o perpetuo como Windows).
* **Dashboard Interno de Renovaciones:** Vista que despliega alertas prioritarias notificando al administrador: *"La cuenta de streaming de [Cliente] vence en 5 días. Prepara el stock con el proveedor"*.

### 📞 Canal de Soporte Centralizado e Inmediato
* **Botón Flotante Global:** Inclusión de un componente de interfaz persistente en la esquina inferior derecha (`BotonSoporteFloat.jsx`) programado con clases adaptativas de Tailwind. Este botón detecta la sección del usuario y genera un enlace parametrizado directo a tu número de soporte técnico para resolver incidencias de accesos en segundos.

---

## 4. Protocolo de Rastreo y Diagnóstico de Errores (Telemetry & Logging)

Estrategia para identificar, aislar y resolver fallos en producción de forma remota aprovechando el entorno multinivel de Project IDX.

### 📊 Registro de Logs Centralizado (Backend)
Cada bloque `try-catch` del servidor en .NET 10 capturará las excepciones de forma obligatoria guardando la traza en el log de la aplicación:
* **Fecha_Hora:** Registro exacto del suceso temporal.
* **Componente:** Nombre del controlador o servicio de trastienda afectado (ej: `WorkerRenovaciones`).
* **Mensaje_Técnico:** Detalle capturado a través de `ex.Message`.
* **Traza_Código:** Información detallada del stack trace (`ex.StackTrace`) para ubicar la línea exacta a corregir dentro del editor en la nube.

---

## 5. Estrategia de Hosting Low-Cost y Escalabilidad Comercial

Política de optimización financiera para asegurar la rentabilidad de **Informatics** desde la fase de lanzamiento en Lima Metropolitana.

### 🛑 Fase de Arranque e Inversión Cero
* **Project IDX como Núcleo:** El entorno se configura mediante Nix utilizando el archivo `.idx/dev.nix` para compilar y previsualizar en tiempo real el frontend y la API concurrentemente sin consumir recursos locales.
* **Despliegues de Validación:** Uso de capas gratuitas en la nube para hospedar temporalmente la API y la base de datos relacional durante las pruebas con clientes reales.

### 📈 Escalabilidad y Alianzas Oficiales (Camino a Partner)
* **Paso 1 (MVP Manual):** Construcción del canal de distribución, recolección de base de datos de clientes e ingresos recurrentes con reventa manual indirecta.
* **Paso 2 (Formalización y Volumen):** Al alcanzar una masa crítica de ventas constantes en la plataforma (ej. de 50 a 100 transacciones mensuales), se procede con la constitución formal de la empresa (RUC 20).
* **Paso 3 (Automatización Total):** Con el historial de ventas y la empresa formalizada, se solicita el alta de distribuidor autorizado ante los mayoristas oficiales de Perú (**Ingram Micro**, **Nexsys**, **Intcomex**). Se compran las licencias en lote a mitad de precio comercial y se reestructura la API en .NET 10 para conectar webhooks automáticos con el API del proveedor, logrando una entrega instantánea del 100% de los productos digitales sin intervención humana.

---

## 6. Mapeo del Catálogo Oficial de Productos e Inventario

Especificación técnica de los productos administrados por el sistema, segmentados por su comportamiento temporal en base de datos para la activación de alertas automáticas.

### 💾 Bloque de Software, Diseñadores e Inteligencia Artificial
* **Lógicas de Duración Anual (DuracionMeses = 12):**
  * *Canva Pro:* Acceso administrado mediante invitaciones a equipos.
  * *Capcut:* Suscripción de edición avanzada anual.
  * *Eset Nod 32 & Eset Internet Security:* Activación mediante clave Retail de 365 días.
  * *Office 365 A3:* Cuenta institucional con vigencia de 1 año.
  * *Adobe Creative Cloud:* Licencia de suite completa anual.
  * *Autodesk Standard & Autodesk Completo:* Activaciones de ingeniería anuales.
  * *Autodesk Revit / AutoCAD:* Licencias específicas para el sector construcción.
* **Lógicas de Duración Mensual (DuracionMeses = 1):**
  * *ChatGPT Plus, Gemini Advanced & Supergrok:* Accesos administrados mediante credenciales o perfiles dedicados.
  * *YouTube Premium & Spotify Premium:* Activaciones directas mediante métodos de planes familiares compartidos.
* **Lógicas de Duración Perpetua (DuracionMeses = 0):**
  * *Nitro 14 & Filmora:* Licencias de un único pago con activación permanente.
  * *Windows 10 Pro & Windows 11 Pro:* Códigos OEM/Retail enlazados al hardware de la computadora del usuario.
  * *Office Profesional Plus (Versiones 2016, 2019, 2021, 2024):* Suites de ofimática definitivas sin caducidad.

### 📺 Bloque de Streaming y Entretenimiento Familiar
* **Lógicas de Suscripción Mensual Continua (DuracionMeses = 1):**
  * *Netflix:* Control unitario por pantalla asignada o cuenta completa.
  * *HBO Max:* Accesos mensuales de entretenimiento.
  * *Prime Video:* Gestión de perfiles de streaming.
  * *Paramount:* Control de vigencia de accesos mensuales.
