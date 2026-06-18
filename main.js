const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let dbPath;

if (app.isPackaged) {
    if (process.env.APPIMAGE) {
        dbPath = path.join(path.dirname(process.env.APPIMAGE), 'gestion_prl.db');
    } else {
        dbPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'gestion_prl.db');
    }
} else {
    dbPath = path.join(app.getAppPath(), 'gestion_prl.db');
}

const db = new Database(dbPath);

const appState = {empresaId: null};

db.pragma('foreign_keys = ON');

db.exec(
  `
  CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cif TEXT UNIQUE NOT NULL,
      activo INTEGER DEFAULT 1,
      nombre TEXT NOT NULL,
      direccion TEXT,
      telefono TEXT,
      email TEXT
  );

  CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dni TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      fecha_nacimiento DATE,
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS secciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE,
      UNIQUE(empresa, nombre)
  );

  CREATE TABLE IF NOT EXISTS puestos_trabajo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      riesgos_asociados TEXT,
      activo INTEGER DEFAULT 1,
      seccion INTEGER NOT NULL,
      FOREIGN KEY(seccion) references secciones(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trabajadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      persona INTEGER NOT NULL,
      puesto_trabajo INTEGER,
      fecha_alta DATE,
      fecha_baja DATE,
      activo INTEGER DEFAULT 1,
      observaciones TEXT,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE,
      FOREIGN KEY(persona) references personas(id) ON DELETE CASCADE,
      FOREIGN KEY(puesto_trabajo) references puestos_trabajo(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS tipos_epis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      normativa TEXT,
      activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS epis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trabajador INTEGER NOT NULL,
      tipo INTEGER,
      marca_modelo TEXT,
      fecha_entrega DATE,
      fecha_caducidad DATE,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(tipo) references tipos_epis(id) ON DELETE SET NULL
      FOREIGN KEY(trabajador) references trabajadores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS salud (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trabajador INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      fecha_examen DATE NOT NULL,
      resultado TEXT NOT NULL,
      proxima_fecha DATE,
      apto BOOLEAN,
      observaciones TEXT,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(trabajador) references trabajadores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS riesgos_evaluacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      puesto_trabajo INTEGER NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      tipo TEXT,
      probabilidad INTEGER CHECK(probabilidad BETWEEN 1 AND 5),
      severidad INTEGER CHECK(severidad BETWEEN 1 AND 5),
      medidas TEXT,
      responsable integer,
      nivel_riesgo TEXT,
      estado TEXT DEFAULT 'pendiente',
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(puesto_trabajo) references puestos_trabajo(id) ON DELETE CASCADE
      FOREIGN KEY(responsable) references personas(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS plan_prevencion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      riesgo INTEGER NOT NULL,
      codigo TEXT UNIQUE,
      contenido TEXT,
      fecha_creacion DATE DEFAULT (date('now')),
      version TEXT DEFAULT '1.0',
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(riesgo) references riesgos_evaluacion(id) ON DELETE CASCADE
  );
  
  CREATE TABLE IF NOT EXISTS tipos_formacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      anos_validez INTEGER NOT NULL,
      entidad TEXT,
      activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS formacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_formacion INTEGER NOT NULL,
      trabajador INTEGER NOT NULL,
      fecha_realizacion DATE,
      fecha_validez DATE,  
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(tipo_formacion) references tipos_formacion(id) ON DELETE CASCADE
      FOREIGN KEY(trabajador) references trabajadores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS investigaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trabajador INTEGER NOT NULL,
      codigo TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL,
      fecha DATE NOT NULL,
      descripcion TEXT,
      causas TEXT,
      medidas_correctivas TEXT,
      estado TEXT DEFAULT 'pendiente',
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(trabajador) references trabajadores(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS equipos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      codigo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      ubicacion TEXT,
      fecha_compra DATE,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE
      UNIQUE(empresa, codigo)
  );

  CREATE TABLE IF NOT EXISTS mantenimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipo INTEGER NOT NULL,
      tipo TEXT CHECK(tipo IN ('preventivo', 'correctivo')),
      fecha_programada DATE NOT NULL,
      fecha_realizada DATE,
      responsable INTEGER NOT NULL,
      observaciones TEXT,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(equipo) references equipos(id) ON DELETE CASCADE
      FOREIGN KEY(responsable) references personas(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS emergencias_simulacros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      fecha_simulacro DATE NOT NULL,
      responsable INTEGER,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE
      FOREIGN KEY(responsable) references personas(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS emergencias_participantes (
      simulacro INTEGER NOT NULL,
      trabajador INTEGER NOT NULL,
      PRIMARY KEY (simulacro, trabajador),
      FOREIGN KEY(simulacro) references emergencias_simulacros(id) ON DELETE CASCADE,
      FOREIGN KEY(trabajador) references trabajadores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inspecciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      seccion INTEGER,
      ubicacion_exacta TEXT NOT NULL,
      tipo_inspeccion TEXT NOT NULL,
      fecha DATE NOT NULL,
      resultado TEXT NOT NULL,
      medidas_correctivas TEXT,
      responsable INTEGER,
      estado TEXT DEFAULT 'pendiente',
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE,
      FOREIGN KEY(seccion) references secciones(id) ON DELETE SET NULL,
      FOREIGN KEY(responsable) references personas(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS participacion_consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      fecha DATE NOT NULL,
      tipo_consulta TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      acuerdos TEXT,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE  
  );

  CREATE TABLE IF NOT EXISTS participacion_participantes (
      consulta INTEGER NOT NULL,
      persona INTEGER NOT NULL,
      PRIMARY KEY (consulta, persona),
      FOREIGN KEY(consulta) references participacion_consultas(id) ON DELETE CASCADE,
      FOREIGN KEY(persona) references personas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documentos_catalogo ( 
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa INTEGER NOT NULL,
      codigo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(empresa) references empresas(id) ON DELETE CASCADE,
      UNIQUE(empresa, codigo)
  );

  CREATE TABLE IF NOT EXISTS documentos_versiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documento INTEGER NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      fecha DATE NOT NULL DEFAULT (date('now')),
      cambios TEXT NOT NULL,
      aprobado_por INTEGER,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY(documento) references documentos_catalogo(id) ON DELETE CASCADE,
      FOREIGN KEY(aprobado_por) references personas(id) ON DELETE SET NULL 
  );
  `
);

function createWindow(){
  const win = new BrowserWindow({
    width:1200,
    height:800,
    webPreferences: {
      preload:path.join(__dirname, 'preload.js'),
      nodeIntegration:false,
      contextIsolation:true,
      devTools:false,
      webSecurity:true
    }
  })
  win.removeMenu();
  win.loadFile('src/index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Función global para enviar Toasts desde el backend al frontend
function dispararNotificacion(mensaje, tipo = 'error') {
    // Buscamos la ventana principal abierta
    const ventanas = BrowserWindow.getAllWindows();
    if (ventanas.length > 0) {
        // Enviamos el mensaje por el canal 'mostrar-notificacion'
        ventanas[0].webContents.send('mostrar-notificacion', { mensaje, tipo });
    }
}

ipcMain.handle('set-empresa-activa', (event, id) => {
    appState.empresaId = id;
    return db.prepare('SELECT * FROM empresas WHERE id = ?').get(id);
});

require('./handlers/empresas')(db, appState, dispararNotificacion);
require('./handlers/inicio')(db, appState, dispararNotificacion);
require('./handlers/secciones')(db, appState, dispararNotificacion);
require('./handlers/puestos')(db, appState, dispararNotificacion);
require('./handlers/personas')(db, appState, dispararNotificacion);
require('./handlers/trabajadores')(db, appState, dispararNotificacion);
require('./handlers/salud')(db, appState, dispararNotificacion);
require('./handlers/tiposFormacion')(db, appState, dispararNotificacion);
require('./handlers/formaciones')(db, appState, dispararNotificacion);
require('./handlers/riesgos')(db, appState, dispararNotificacion);
require('./handlers/planes')(db, appState, dispararNotificacion);
require('./handlers/tiposEpis')(db, appState, dispararNotificacion);
require('./handlers/epis')(db, appState, dispararNotificacion);
require('./handlers/investigaciones')(db, appState, dispararNotificacion);
require('./handlers/equipos')(db, appState, dispararNotificacion);
require('./handlers/mantenimientos')(db, appState, dispararNotificacion);
require('./handlers/emergencias')(db, appState, dispararNotificacion);
require('./handlers/inspecciones')(db, appState, dispararNotificacion);
require('./handlers/participaciones')(db, appState, dispararNotificacion);
require('./handlers/documentos')(db, appState, dispararNotificacion);
require('./handlers/documentosVersiones')(db, appState, dispararNotificacion);
