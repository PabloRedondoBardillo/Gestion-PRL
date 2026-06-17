# Sistema de Gestión PRL (Prevención de Riesgos Laborales) 🛡️

Una aplicación de escritorio robusta y eficiente diseñada para la gestión integral de la seguridad y salud en el trabajo. Permite controlar de forma centralizada la documentación, equipos, personal y procedimientos de múltiples empresas desde una única interfaz unificada.

## 🚀 Características Principales

El sistema está dividido en módulos independientes y escalables, todos operando bajo el principio de **borrado lógico** en base de datos para garantizar la integridad legal de los registros.

* **🏢 Gestión Multi-Empresa:** Aislamiento de datos por empresa activa, garantizando que los registros, equipos y trabajadores se mantengan en su contexto.
* **🦺 Control de EPIs:** Catálogo global homologado y registro de entregas a trabajadores con control de caducidades.
* **🩺 Investigación de Daños:** Registro detallado de accidentes, incidentes y enfermedades profesionales.
* **⚙️ Equipos y Mantenimientos:** Inventario de maquinaria y programación de revisiones (preventivas y correctivas).
* **🚨 Emergencias y Simulacros:** Planificación de evacuaciones y control dinámico de asistentes.
* **🤝 Participación y Consultas:** Registro de actas del Comité de Seguridad y reuniones con delegados.
* **📋 Condiciones de Trabajo:** Planificación y seguimiento de inspecciones de seguridad en instalaciones.
* **📁 Control Documental:** Gestión maestra de procedimientos y manuales, incluyendo historial completo de control de versiones y aprobaciones.

## 🛠️ Stack Tecnológico

Desarrollado priorizando el rendimiento, la ligereza y la ejecución nativa sin depender de frameworks pesados de frontend:

* **Frontend:** Vanilla JS, HTML5, CSS3 (Diseño responsivo con CSS Grid/Flexbox y variables nativas).
* **Backend / Core:** [Electron.js](https://www.electronjs.org/) y Node.js.
* **Base de Datos:** [SQLite3](https://www.sqlite.org/) (Consultas transaccionales, constraints legales estrictos como `ON DELETE RESTRICT` y arquitecturas M:N).

## 📦 Instalación y Despliegue

### Requisitos previos
* [Node.js](https://nodejs.org/) (v16 o superior recomendado)
* Git

### Pasos de instalación

1. Clonar el repositorio:
   ```bash
   git clone git@github.com:TuUsuario/tu-repo.git
   ```

2. Acceder al directorio del proyecto:
    ```bash
   cd tu-repo
   ```

3. Instalar las dependencias de Node:
    ```bash
   npm install
   ```

4. Ejecutar la aplicación en entorno de desarrollo:
    ```bash
   npm start
   ```

### Estructura del proyecto

├── main.js               # Proceso principal de Electron (Controlador de BBDD)
├── preload.js            # Puente de comunicación segura (IPC)
├── renderer.js           # Lógica del frontend y controladores de vista
├── style.css             # Estilos globales y componentes UI
├── vistas/               # Vistas HTML modulares por cada funcionalidad
└── package.json          # Configuración y dependencias