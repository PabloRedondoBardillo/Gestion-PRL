# Sistema de Gestión PRL

Una aplicación de escritorio robusta, portátil y de alto rendimiento diseñada para la gestión integral de la Prevención de Riesgos Laborales (PRL). 

Permite a los técnicos y responsables de seguridad controlar de forma centralizada la documentación, equipos, personal y procedimientos de múltiples empresas desde una única interfaz unificada de ejecución local.

---

## Módulos y Funcionalidades Core

El sistema está dividido en módulos independientes, garantizando la trazabilidad y la integridad legal de los registros mediante restricciones de base de datos y borrado lógico.

### 1. Estructura y Personal
* Gestión Multi-Empresa: Aislamiento estricto de datos por empresa activa. Cada sesión carga dinámicamente el contexto de la empresa seleccionada.
* Censo Global de Personas: Base de datos global de individuos (DNI, datos de contacto) que se vinculan como trabajadores a diferentes empresas, evitando la duplicidad de datos.
* Organigramas: Definición de Secciones y Puestos de Trabajo específicos por empresa, con descripción de riesgos inherentes.

### 2. Prevención Operativa
* Equipos de Protección Individual (EPIs): Catálogo maestro de equipos homologados y control nominal de entregas con alertas de caducidad.
* Vigilancia de la Salud: Registro de exámenes médicos, control de aptitudes (Apto, No Apto, Apto con restricciones) y programación de próximas revisiones.
* Formación e Información: Catálogo de cursos corporativos y registro de asistencia técnica de los trabajadores, incluyendo validez y reciclaje.

### 3. Seguridad e Instalaciones
* Evaluación de Riesgos: Matriz de probabilidad y severidad por puesto de trabajo para el cálculo automático del nivel de riesgo.
* Mantenimiento de Equipos: Inventario de maquinaria y programación de revisiones preventivas y correctivas con asignación de responsables.
* Inspecciones de Seguridad: Planificación de rutas de inspección por sección, evaluación de condiciones y seguimiento de subsanaciones.

### 4. Gestión de Crisis y Participación
* Investigación de Daños: Protocolo de registro de accidentes e incidentes, análisis de causas y establecimiento de medidas correctivas.
* Emergencias y Simulacros: Planificación de escenarios de evacuación y control dinámico del censo de participantes.
* Comités y Consultas: Registro de actas, reuniones con delegados de prevención y seguimiento de acuerdos adoptados.

### 5. Control Documental
* Sistema de Calidad: Repositorio estructurado de procedimientos, manuales e instrucciones.
* Control de Versiones: Historial inmutable de modificaciones, fechas de entrada en vigor y trazabilidad de los responsables de aprobación.

---

## Arquitectura Técnica y Stack

Desarrollado priorizando el rendimiento, la privacidad de los datos (100% local/offline) y la ejecución nativa sin depender de frameworks de frontend pesados.

* Core & Backend: Node.js encapsulado en Electron.js.
* Frontend: Vanilla JavaScript, HTML5 y CSS3. 
  * Arquitectura SPA (Single Page Application) nativa: Las vistas se inyectan dinámicamente en el DOM mediante la API fetch, controladas por un enrutador propio.
  * Estilizado mantenible basado en variables CSS nativas, sin preprocesadores.
* Seguridad (IPC): Comunicación estricta entre el proceso de renderizado (UI) y el proceso principal a través de preload.js utilizando contextIsolation.
* Base de Datos: SQLite3 (módulo better-sqlite3).
  * Consultas síncronas de alta velocidad.
  * Diseño relacional estricto con Foreign Keys (ON DELETE RESTRICT) para evitar la orfandad de registros.
  * Estrategia de portabilidad: La base de datos se genera y viaja automáticamente junto al ejecutable final.

---

## Desarrollo e Instalación

### Requisitos previos
* Node.js (v20 LTS o v22 LTS recomendado para compilación de módulos C++).
* Herramientas de compilación de C++ (requeridas por better-sqlite3):
  * Windows: Visual Studio Build Tools.
  * Linux: build-essential, python3.

### Configuración del entorno

1. Clonar el repositorio:
```bash
   git clone git@github.com:TuUsuario/tu-repo.git
   cd tu-repo
   ```

2. Instalar las dependencias:
```bash
   npm install
   ```
   (Nota: Si cambias de sistema operativo, ejecuta `npm rebuild better-sqlite3` para adaptar los binarios de SQLite a tu arquitectura local).

3. Levantar el entorno de desarrollo:
```bash
   npm start
   ```

---

## Compilación y Empaquetado (Producción)

El proyecto está configurado para exportarse como una aplicación totalmente portable. Los datos se guardan en el mismo directorio desde donde se ejecuta la aplicación, lo que permite llevar el programa y su información en un dispositivo USB.

Para generar los binarios finales:

Para Windows (Genera .exe portable):
```bash
npm run build:win
```

Para Linux (Genera .AppImage portable):
```bash
npm run build:linux
```

Los ejecutables generados se encontrarán en la carpeta dist/ (o la configurada en electron-builder).

---


## Estructura del Proyecto

```text
├── build/                # Recursos de compilación (Iconos .ico, .png)
├── handlers/             # Controladores Backend (Lógica SQL por módulo)
│   ├── documentos.js
│   ├── documentosVersiones.js
│   ├── emergencias.js
│   ├── empresas.js
│   ├── epis.js
│   ├── equipos.js
│   ├── formaciones.js
│   ├── inicio.js
│   ├── inspecciones.js
│   ├── investigaciones.js
│   ├── mantenimientos.js
│   ├── participaciones.js
│   ├── personas.js
│   ├── planes.js
│   ├── puestos.js
│   ├── riesgos.js
│   ├── salud.js
│   ├── secciones.js
│   ├── tiposEpis.js
│   ├── tiposFormacion.js
│   └── trabajadores.js
├── src/                  # Frontend
│   ├── fonts/            # Tipografías locales
│   ├── vistas/           # HTMLs modulares de cada vista
│   ├── index.html        # Estructura principal
│   ├── renderer.js       # Lógica del frontend y enrutador
│   └── style.css         # Estilos globales
├── main.js               # Proceso principal y gestión de DB
├── preload.js            # Puente IPC
└── package.json          # Configuración del proyecto
```