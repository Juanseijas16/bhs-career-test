# Gestión de vacantes (versión simple)

La web lee las vacantes desde una **Google Sheet** publicada como CSV.
Para agregar/editar una vacante, RRHH solo edita la hoja. No se toca código.

Los **contactos** salen **automáticamente según la ubicación**:
- Ubicación de **India** (Pune, o que incluya `IN`) → contactos **Mihika Shirodkar** y **Rivka**.
- **Cualquier otra** ubicación → contacto **Julia Müller**.

Los **beneficios** se eligen con la columna `benefits` (ver abajo). Si la dejas vacía,
se eligen solos por la ubicación (India → pack india; resto → pack de 4).

---

## Columnas de la hoja

| Columna | Qué poner |
|---|---|
| `id` | Identificador único sin espacios (ej. `IT-179950`). Aparece en la URL de la vacante. |
| `active` | `TRUE` para mostrar, `FALSE` para ocultar sin borrar. |
| `location` | Ubicación (ej. `Weiherhammer, DE, 92729` o `Pune, IN, 411001`). **Define beneficios y contactos.** |
| `email` | Correo al que llega la candidatura (ej. `recruiting@bhs-world.com`). |
| `benefits` | Pack de beneficios a mostrar: `4` (pack estándar de 4), `6` (los 4 + Übernahme + Schulungszentrum), `india` (pack de India con iconos). Si se deja vacío, se elige por la ubicación. |
| `contacts` | Set de contactos a mostrar: `standard` (Julia Müller), `india` (Mihika Shirodkar + Rivka), `trainees` (Lisa Gebert-Hofmann). Si se deja vacío, se elige por la ubicación. |
| `title_de` / `title_en` | Título en alemán / inglés. Si dejas `title_en` vacío, no aparece en la web en inglés (y viceversa). |
| `level_de` / `level_en` | Nivel (ej. `Berufserfahrene` / `Experienced Professionals`). *(opcional, para filtros)* |
| `time_de` / `time_en` | `Vollzeit`/`Teilzeit` — `Full-time`/`Part-time`. *(opcional)* |
| `contract_de` / `contract_en` | `Befristet`/`Unbefristet` — `Temporary`/`Unlimited`. *(opcional)* |
| `dept_de` / `dept_en` | Área (ej. `IT`, `Vertrieb`/`Sales`, `Finance`). *(opcional, para filtros)* |
| `intro_de` / `intro_en` | Texto de introducción. Un párrafo por línea (**Alt + Enter**). |
| `tasks_de` / `tasks_en` | Responsabilidades: un punto por línea. |
| `profile_de` / `profile_en` | Perfil / requisitos: un punto por línea. |
| `offer_de` / `offer_en` | Qué ofrecemos: un punto por línea. |

Para viñetas y párrafos: dentro de la celda usa **Alt + Enter** para separar líneas.

---

## Cómo publicar / actualizar la hoja (sin romper el enlace)

- Para **agregar/editar vacantes**: escribe directamente en las celdas de la hoja. No hace falta nada más; la web se actualiza sola en ~1–5 min.
- Si necesitas **reemplazar toda la hoja con un CSV**: Archivo → Importar → subir el CSV → elegir **"Reemplazar la hoja actual"** (NO "insertar hojas nuevas"). Así el enlace de publicación no cambia.
- La hoja debe seguir **Publicada en la web** (Archivo → Compartir → Publicar en la web → CSV).

> Si el enlace de publicación llegara a cambiar (por importar mal), hay que actualizar la URL en el archivo `careers-config.js` del sitio.

---

## Contactos desde la hoja (opcional, recomendado)

Puedes manejar los contactos (nombre, cargo, correo, teléfono, foto) desde una
**segunda pestaña** de tu Google Sheet, sin volver a subir archivos:

1. En tu Google Sheet crea una pestaña nueva llamada **Contactos** e impórtale el
   archivo `contactos-plantilla.csv` (columnas: `set,name,title,email,phone,photo`).
2. Publica esa pestaña como CSV (Archivo → Compartir → Publicar en la web → pestaña
   "Contactos" → CSV) y copia su URL.
3. Pega esa URL en `careers-config.js` en `contactsCsvUrl`.
4. Sube **una vez** `careers.js` y `careers-config.js`. **A partir de ahí, editar un
   contacto es solo cambiar la pestaña Contactos** — sin subir nada más.

Cada fila = una persona. El valor de `set` (`standard`, `india`, `trainees`) debe
coincidir con el de la columna `contacts` de las vacantes. Puede haber varias filas
con el mismo `set` (varias personas). La `photo` es el nombre del archivo dentro de
`images/` (una foto nueva sí hay que subirla a `images/` una vez).

Mientras `contactsCsvUrl` esté vacío, se usan los contactos por defecto del código.

## Beneficios desde la hoja (opcional)

Igual que los contactos, los beneficios se pueden editar desde una pestaña
**"Beneficios"**:
1. Crea la pestaña **Beneficios** e impórtale `beneficios-plantilla.csv`
   (columnas: `set, icon, text_de, text_en`). Cada fila = un beneficio; `set` es
   el pack (`4`, `6`, `india` o el que definas), y coincide con la columna
   `benefits` de las vacantes.
2. Publícala como CSV y pega su URL en `careers-config.js` → `benefitsCsvUrl`.
3. `icon` = nombre de archivo en `images/` **o** una URL completa.

Mientras `benefitsCsvUrl` esté vacío, se usan los packs por defecto del código.

## Fotos de contacto desde la hoja

En la pestaña **Contactos**, la columna `photo` admite el nombre de un archivo en
`images/` (p. ej. `contact-rivka.png`) **o una URL completa** (p. ej. un enlace de
imagen). Con una URL puedes cambiar la foto sin subir nada al servidor.

## Todas las vacantes en la hoja

Ya no hay vacantes fijas en el código: **todas** viven en la hoja de Vacantes,
así que cualquier vacante se puede agregar, ocultar (`active=FALSE`) o borrar
desde Google Sheets.

## Archivos del sitio (no tocar)
- `careers-config.js` — URL de la hoja (lo único configurable).
- `careers.js` — motor + beneficios/contactos por región (India / estándar).
- `index.html` / `index-en.html` — portada (lista de vacantes).
- `job.html` / `job-en.html` — página de detalle (se arma desde la hoja).
- `styles.css`, `logo.svg`, carpetas `images/` y `jobs/`.
