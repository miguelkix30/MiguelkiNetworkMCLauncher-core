# Documentación de Emits - MiguelkiNetworkMCLauncher-core

Este documento proporciona una descripción detallada de todos los eventos (emits) que emite el módulo Minecraft Launcher Core, incluyendo cuándo se emiten, qué datos contienen y cómo utilizarlos.

## Índice

1. [Eventos de Debug y Log](#eventos-de-debug-y-log)
2. [Eventos de Progreso](#eventos-de-progreso)
3. [Eventos de Descarga](#eventos-de-descarga)
4. [Eventos de Error](#eventos-de-error)
5. [Eventos de Minecraft](#eventos-de-minecraft)
6. [Eventos de Lanzamiento](#eventos-de-lanzamiento)
7. [Eventos Especiales](#eventos-especiales)

---

## Eventos de Debug y Log

### `debug`

**Descripción**: Emite mensajes de debug con información detallada sobre el proceso de lanzamiento.

**Cuándo se emite**: Durante todo el proceso de lanzamiento para proporcionar información de diagnóstico.

**Datos emitidos**: `string`

**Ejemplo**:
```javascript
launcher.on('debug', (message) => {
  console.log('[DEBUG]', message);
});
```

**Mensajes comunes**:
- `[MCLC]: Iniciando proceso de lanzamiento de Minecraft`
- `[MCLC]: Java verificado correctamente`
- `[MCLC]: Assets descargados correctamente`
- `[MCLC]: Iniciando proceso de Minecraft`

---

## Eventos de Progreso

### `progress`

**Descripción**: Emite información sobre el progreso de diferentes tareas durante el lanzamiento.

**Cuándo se emite**: Durante descargas, extracciones y otras operaciones que requieren tiempo.

**Estructura de datos**:
```typescript
{
  type: string,        // Tipo de tarea
  task: string,        // Subtarea específica
  current: number,     // Progreso actual
  total: number,       // Total a completar
  message: string      // Mensaje descriptivo
}
```

**Tipos de progreso**:

#### `type: 'launch'`
Progreso general del lanzamiento del juego.

**Tareas**:
- `'initialization'`: Inicializando launcher
- `'java-check'`: Verificando instalación de Java
- `'directory-setup'`: Configurando directorios
- `'package-extraction'`: Extrayendo paquetes del cliente
- `'version-setup'`: Configurando archivos de versión
- `'jar-download'`: Descargando JAR de Minecraft
- `'mod-processing'`: Procesando modificaciones (Forge/Custom)
- `'jvm-setup'`: Configurando argumentos de JVM
- `'assets-download'`: Descargando recursos del juego
- `'launch-options'`: Configurando opciones de lanzamiento
- `'final-preparation'`: Preparando lanzamiento final
- `'starting-minecraft'`: Iniciando Minecraft...

#### `type: 'assets'`
Progreso de descarga de assets del juego.

**Tareas**:
- `'downloading'`: Descargando assets del juego

#### `type: 'assets-copy'`
Progreso de copia de assets para versiones legacy.

**Tareas**:
- `'copying'`: Copiando assets a formato legacy

#### `type: 'natives'`
Progreso de descarga de librerías nativas.

**Tareas**:
- `'downloading'`: Descargando librerías nativas

#### `type: 'classes'`, `type: 'classes-custom'`, `type: 'classes-maven-custom'`
Progreso de descarga de librerías de clases.

**Tareas**:
- `'downloading'`: Descargando librerías

**Ejemplo de uso**:
```javascript
launcher.on('progress', (progress) => {
  console.log(`[${progress.type}] ${progress.message}`);
  console.log(`Progreso: ${progress.current}/${progress.total} (${Math.round((progress.current/progress.total)*100)}%)`);
  
  // Actualizar barra de progreso UI
  updateProgressBar(progress.current, progress.total, progress.message);
});
```

---

## Eventos de Descarga

### `download-status`

**Descripción**: Emite información sobre el estado de descarga de archivos individuales.

**Cuándo se emite**: Durante la descarga de cada archivo.

**Estructura de datos**:
```typescript
{
  name: string,        // Nombre del archivo
  type: string,        // Tipo de descarga
  current: number,     // Bytes descargados
  total: number,       // Tamaño total del archivo
  percentage: number   // Porcentaje de descarga (0-100)
}
```

**Ejemplo**:
```javascript
launcher.on('download-status', (status) => {
  console.log(`Descargando ${status.name}: ${status.percentage}% (${status.current}/${status.total} bytes)`);
});
```

### `download-start`

**Descripción**: Se emite cuando comienza la descarga de un archivo.

**Estructura de datos**:
```typescript
{
  url: string,         // URL de descarga
  file: string,        // Nombre del archivo
  type: string,        // Tipo de descarga
  totalBytes: number   // Tamaño total del archivo
}
```

### `download-complete`

**Descripción**: Se emite cuando se completa la descarga de un archivo.

**Estructura de datos**:
```typescript
{
  file: string,        // Nombre del archivo
  type: string,        // Tipo de descarga
  url: string          // URL de descarga
}
```

### `download`

**Descripción**: Evento legacy que se emite cuando se completa una descarga.

**Datos emitidos**: `string` (nombre del archivo)

### `download-error`

**Descripción**: Se emite cuando ocurre un error durante la descarga.

**Estructura de datos**:
```typescript
{
  url: string,         // URL que falló
  file: string,        // Nombre del archivo
  type: string,        // Tipo de descarga
  error: string,       // Mensaje de error
  retry?: boolean      // Si se va a reintentar
}
```

**Ejemplo**:
```javascript
launcher.on('download-error', (error) => {
  console.error(`Error descargando ${error.file}: ${error.error}`);
  if (error.retry) {
    console.log('Reintentando descarga...');
  }
});
```

---

## Eventos de Error

### `error`

**Descripción**: Emite información detallada sobre errores durante el proceso de lanzamiento.

**Cuándo se emite**: Cuando ocurre cualquier error durante el proceso.

**Estructura de datos**:
```typescript
{
  type: string,        // Tipo de error
  error: string,       // Mensaje de error
  message: string,     // Descripción del error
  stack?: string       // Stack trace (si está disponible)
}
```

**Tipos de error**:
- `'java-error'`: Problemas con Java
- `'launch-error'`: Error durante el lanzamiento
- `'spawn-error'`: Error al crear el proceso
- `'minecraft-process-error'`: Error en el proceso de Minecraft

**Ejemplo**:
```javascript
launcher.on('error', (error) => {
  console.error(`[ERROR-${error.type}] ${error.message}`);
  console.error('Detalles:', error.error);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
});
```

---

## Eventos de Minecraft

### `minecraft-started`

**Descripción**: Se emite cuando el proceso de Minecraft se ha iniciado exitosamente.

**Estructura de datos**:
```typescript
{
  pid: number,         // ID del proceso
  arguments: string[], // Argumentos de lanzamiento
  cwd: string         // Directorio de trabajo
}
```

**Ejemplo**:
```javascript
launcher.on('minecraft-started', (info) => {
  console.log(`Minecraft iniciado con PID: ${info.pid}`);
  console.log(`Directorio de trabajo: ${info.cwd}`);
});
```

### `minecraft-log`

**Descripción**: Emite logs del proceso de Minecraft en tiempo real.

**Estructura de datos**:
```typescript
{
  type: 'stdout' | 'stderr',  // Tipo de output
  message: string             // Mensaje del log
}
```

**Ejemplo**:
```javascript
launcher.on('minecraft-log', (log) => {
  const prefix = log.type === 'stderr' ? '[ERROR]' : '[INFO]';
  console.log(`${prefix} ${log.message}`);
});
```

### `minecraft-closed`

**Descripción**: Se emite cuando el proceso de Minecraft se cierra.

**Estructura de datos**:
```typescript
{
  code: number,        // Código de salida
  signal: string       // Señal de cierre (si aplica)
}
```

### `data`

**Descripción**: Evento legacy que emite output directo de Minecraft.

**Datos emitidos**: `string` (output crudo)

---

## Eventos de Lanzamiento

### `arguments`

**Descripción**: Emite los argumentos finales que se utilizarán para lanzar Minecraft.

**Datos emitidos**: `string[]` (array de argumentos)

**Ejemplo**:
```javascript
launcher.on('arguments', (args) => {
  console.log('Argumentos de lanzamiento:', args.join(' '));
});
```

### `close`

**Descripción**: Se emite cuando el proceso de lanzamiento termina.

**Datos emitidos**: `number` (código de salida)

**Códigos comunes**:
- `0`: Éxito
- `1`: Error general

---

## Eventos Especiales

### `package-extract`

**Descripción**: Se emite cuando se completa la extracción de un paquete cliente.

**Datos emitidos**: `boolean` (siempre `true`)

---

## Ejemplo de Implementación Completa

```javascript
const { Client } = require('minecraft-launcher-core');

const launcher = new Client();

// Eventos de progreso
launcher.on('progress', (progress) => {
  console.log(`[${progress.type.toUpperCase()}] ${progress.message}`);
  updateProgressUI(progress.current, progress.total, progress.message);
});

// Eventos de debug
launcher.on('debug', (message) => {
  console.log(`[DEBUG] ${message}`);
});

// Eventos de error
launcher.on('error', (error) => {
  console.error(`[ERROR] ${error.message}`);
  showErrorDialog(error);
});

// Eventos de descarga
launcher.on('download-status', (status) => {
  updateDownloadUI(status.name, status.percentage);
});

launcher.on('download-error', (error) => {
  console.error(`Error descargando ${error.file}: ${error.error}`);
});

// Eventos de Minecraft
launcher.on('minecraft-started', (info) => {
  console.log(`¡Minecraft iniciado! PID: ${info.pid}`);
  hideProgressUI();
});

launcher.on('minecraft-log', (log) => {
  appendToGameLog(`[${log.type.toUpperCase()}] ${log.message}`);
});

launcher.on('minecraft-closed', (info) => {
  console.log(`Minecraft cerrado con código: ${info.code}`);
  showGameClosedNotification(info.code);
});

// Iniciar el juego
const options = {
  authorization: Authenticator.getAuth("username", "password"),
  root: "./minecraft",
  version: {
    number: "1.19.4",
    type: "release"
  },
  memory: {
    max: "4G",
    min: "1G"
  }
};

launcher.launch(options);
```

## Consejos de Uso

1. **Siempre escucha el evento `error`** para manejar fallos inesperados.

2. **Usa `progress` para interfaces de usuario** para mostrar el progreso al usuario.

3. **Combina `debug` y `minecraft-log`** para logs completos de diagnóstico.

4. **Maneja `minecraft-closed`** para detectar cuando el juego termina.

5. **El evento `download-status`** es ideal para mostrar progreso de descargas individuales.

## Notas Importantes

- Los eventos con `message` siempre incluyen texto descriptivo en español.
- Los campos `type` y `task` nunca son `undefined` en las nuevas versiones.
- Los eventos de error incluyen información detallada para facilitar el diagnóstico.
- Los eventos de progreso proporcionan información tanto numérica como textual.
