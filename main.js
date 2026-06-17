const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('gestion_prl.db');

let empresaActivaId = null;

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

  CREATE TABLE IF NOT EXISTS insepcciones (
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
      contextIsolation:true
    }
  })
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

// Empresa Handlers

ipcMain.handle('get-empresas', () => {
  const stmt = db.prepare('SELECT * FROM empresas WHERE activo = 1');
  return stmt.all();
});

ipcMain.handle('add-empresa', (event, empresa) => {
  const stmt = db.prepare('INSERT INTO empresas (cif, nombre, direccion, telefono, email) values (?, ?, ?, ?, ?)');
  const info = stmt.run(empresa.cif, empresa.nombre, empresa.direccion, empresa.telefono, empresa.email);
  return info.changes;
});

ipcMain.handle('set-empresa-activa', (event, id) => {
  empresaActivaId = id;
  return db.prepare('SELECT * FROM empresas WHERE id = ?').get(id);
});

ipcMain.handle('update-empresa', (event, empresa) => {
  const stmt = db.prepare('UPDATE empresas SET cif = ?, nombre = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?');
  const info = stmt.run(empresa.cif, empresa.nombre, empresa.direccion, empresa.telefono, empresa.email, empresa.id);
  return info.changes;
});

ipcMain.handle('delete-empresa', (event, id) => {
  // Borrado lógico: la ocultamos en lugar de destruirla
  const stmt = db.prepare('UPDATE empresas SET activo = 0 WHERE id = ?');
  const info = stmt.run(id);
  
  // Opcional pero recomendado: Limpiamos la variable global del backend por seguridad
  if (empresaActivaId === id) empresaActivaId = null; 
  
  return info.changes;
});

//Secciones Handlers

ipcMain.handle('get-secciones-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  return db.prepare('SELECT * FROM secciones WHERE empresa = ? AND activo = 1').all(empresaActivaId);
});

ipcMain.handle('get-secciones-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  return db.prepare('SELECT * FROM secciones WHERE empresa = ? AND activo = 0').all(empresaActivaId);
});

ipcMain.handle('add-seccion', (event, seccion) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare('INSERT INTO secciones (empresa, nombre) VALUES (?, ?)');
  const info = stmt.run(empresaActivaId, seccion.nombre);
  return info.lastInsertRowid;
});

ipcMain.handle('update-seccion', (event, seccion) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare('UPDATE secciones SET nombre = ? WHERE id = ? AND empresa = ?');
  const info = stmt.run(seccion.nombre, seccion.id, empresaActivaId);
  return info.changes;
});

ipcMain.handle('delete-seccion', (event, id) => {
  // Al hacer DELETE aquí, SQLite borrará automáticamente los puestos asociados 
  // gracias al ON DELETE CASCADE que le pusimos en la creación de la tabla.
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const info = db.prepare('UPDATE secciones SET activo = 0 WHERE id = ? AND empresa = ?').run(id, empresaActivaId);
  return info.changes;
});

//Puestos Handlers

ipcMain.handle('get-puestos-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  return db.prepare(`
      SELECT P.*, S.nombre as seccion_nombre 
      FROM puestos_trabajo P
      JOIN secciones S ON P.seccion = S.id
      WHERE S.empresa = ? AND P.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-puestos-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  return db.prepare(`
      SELECT P.*, S.nombre as seccion_nombre 
      FROM puestos_trabajo P
      JOIN secciones S ON P.seccion = S.id
      WHERE S.empresa = ? AND P.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-puesto', (event, puesto) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare(`
        INSERT INTO puestos_trabajo (seccion, nombre, descripcion, riesgos_asociados) 
        VALUES (?, ?, ?, ?)
    `);
  const info = stmt.run(
      puesto.seccion, 
      puesto.nombre, 
      puesto.descripcion || null, 
      puesto.riesgos_asociados || null
  );
  return info.lastInsertRowid;
});

ipcMain.handle('update-puesto', (event, puesto) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }  

  const stmt = db.prepare(`
      UPDATE puestos_trabajo 
      SET seccion = ?, nombre = ?, descripcion = ?, riesgos_asociados = ? 
      WHERE id = ?
  `);
  const info = stmt.run(
      puesto.seccion, 
      puesto.nombre, 
      puesto.descripcion || null, 
      puesto.riesgos_asociados || null, 
      puesto.id
  );
  return info.changes;
});

ipcMain.handle('delete-puesto', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  
  // Borrado lógico del puesto
  const stmt = db.prepare('UPDATE puestos_trabajo SET activo = 0 WHERE id = ?');
  const info = stmt.run(id);
  return info.changes;
});

//Personas Handlers

ipcMain.handle('get-personas-actuales', () => {
  return db.prepare('SELECT * FROM personas WHERE activo = 1').all();
});

ipcMain.handle('get-personas-antiguas', () => {
  return db.prepare('SELECT * FROM personas WHERE activo = 0').all();
});

ipcMain.handle('add-persona', (event, p) => {
  const stmt = db.prepare('INSERT INTO personas (dni, nombre, fecha_nacimiento, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(p.dni, p.nombre, p.fecha_nacimiento || null, p.direccion || null, p.telefono || null, p.email || null);
  return info.lastInsertRowid;
});

ipcMain.handle('update-persona', (event, p) => {
  const stmt = db.prepare('UPDATE personas SET dni=?, nombre=?, fecha_nacimiento=?, direccion=?, telefono=?, email=? WHERE id=?');
  const info = stmt.run(p.dni, p.nombre, p.fecha_nacimiento || null, p.direccion || null, p.telefono || null, p.email || null, p.id);
  return info.changes;
});

ipcMain.handle('delete-persona', (event, id) => {
  return db.prepare('UPDATE personas SET activo = 0 WHERE id = ?').run(id).changes;
});

//Trabajadores Handlers

ipcMain.handle('get-trabajadores-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  const stmt = db.prepare(
    `SELECT DISTINCT P.nombre, P.dni, PT.nombre as puesto_trabajo, T.fecha_alta, T.fecha_baja, T.activo, T.observaciones, T.id 
    FROM trabajadores as T 
    JOIN personas as P ON T.persona = P.id 
    JOIN puestos_trabajo as PT ON T.puesto_trabajo = PT.id
    WHERE T.empresa = ? AND T.fecha_baja IS NULL`
  );
  return stmt.all(empresaActivaId);
});

ipcMain.handle('get-trabajadores-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  const stmt = db.prepare(
    `SELECT DISTINCT P.nombre, P.dni, PT.nombre as puesto_trabajo, T.fecha_alta, T.fecha_baja, T.activo, T.observaciones, T.id 
    FROM trabajadores as T 
    JOIN personas as P ON T.persona = P.id 
    JOIN puestos_trabajo as PT ON T.puesto_trabajo = PT.id
    WHERE T.empresa = ? AND T.fecha_baja IS NOT NULL`
  );
  return stmt.all(empresaActivaId);
});

ipcMain.handle('add-trabajador', (event, trabajador) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const transaction = db.transaction(()=> {
    let personaId;

    const personaExiste = db.prepare('SELECT id FROM personas WHERE dni = ?').get(trabajador.dni);
    
    if(personaExiste){
      personaId = personaExiste.id;
    } else {
      const stmtPersona = db.prepare('INSERT INTO personas (dni, nombre) VALUES (?, ?)');
      const infoPersona = stmtPersona.run(trabajador.dni, trabajador.nombre);

      personaId = infoPersona.lastInsertRowid;
    }

    const stmtTrabajador = db.prepare(
      `INSERT INTO trabajadores
      (empresa, persona, puesto_trabajo, fecha_alta, fecha_baja, activo, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const infoTrabajador = stmtTrabajador.run(
      empresaActivaId,
      personaId,
      trabajador.puesto_trabajo,
      trabajador.fecha_alta,
      trabajador.fecha_baja,
      trabajador.activo,
      trabajador.observaciones
    );
    
    return infoTrabajador.lastInsertRowid;
  });  
  return transaction();
});

ipcMain.handle('update-trabajador', (event, trabajador) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const transaction = db.transaction(() => {
    const row = db.prepare('SELECT persona FROM trabajadores WHERE id = ?').get(trabajador.id);
    const personaId = row.persona;

    db.prepare(
      `UPDATE personas
      SET dni = ?, nombre = ?
      WHERE id = ?`
    ).run(trabajador.dni, trabajador.nombre, personaId);

    const stmtTrabajador = db.prepare(
      `UPDATE trabajadores
      SET puesto_trabajo = ?, fecha_alta = ?, fecha_baja = ?, activo = ?, observaciones = ?
      WHERE id = ?`      
    );

    const info = stmtTrabajador.run(
      trabajador.puesto_trabajo,
      trabajador.fecha_alta,
      trabajador.fecha_baja,
      trabajador.activo,
      trabajador.observaciones,
      trabajador.id
    );
    return info.changes;
  });
  return transaction();
});

ipcMain.handle('delete-trabajador', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare(
    `UPDATE trabajadores
    SET activo = 0, fecha_baja = date('now')
    WHERE id = ?`
  );
  
  const info = stmt.run(id);
  return info.changes;
});

//Salud Handlers

ipcMain.handle('get-vigilancia-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  return db.prepare(`
      SELECT v.*, p.nombre as trabajador_nombre, p.dni 
      FROM salud v
      JOIN trabajadores t ON v.trabajador = t.id
      JOIN personas p ON t.persona = p.id
      WHERE t.empresa = ? AND v.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-vigilancia-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT v.*, p.nombre as trabajador_nombre, p.dni 
      FROM salud v
      JOIN trabajadores t ON v.trabajador = t.id
      JOIN personas p ON t.persona = p.id
      WHERE t.empresa = ? AND v.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('add-vigilancia', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare(`
      INSERT INTO salud (trabajador, fecha_examen, tipo, resultado, proxima_fecha, observaciones, apto) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  // Añadimos datos.apto al final
  const info = stmt.run(datos.trabajador, datos.fecha_examen, datos.tipo, datos.resultado, datos.proxima_fecha, datos.observaciones, datos.apto);
  return info.lastInsertRowid;
});

ipcMain.handle('update-vigilancia', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare(`
      UPDATE salud 
      SET trabajador = ?, fecha_examen = ?, tipo = ?, resultado = ?, proxima_fecha = ?, observaciones = ?, apto = ? 
      WHERE id = ?
  `);
  // Añadimos datos.apto antes de datos.id
  const info = stmt.run(datos.trabajador, datos.fecha_examen, datos.tipo, datos.resultado, datos.proxima_fecha, datos.observaciones, datos.apto, datos.id);
  return info.changes;
});

ipcMain.handle('delete-vigilancia', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  return db.prepare('UPDATE salud SET activo = 0 WHERE id = ?').run(id).changes;
});

//TiposFormacion Handlers

ipcMain.handle('get-tipos-formacion-actuales', () => {
  return db.prepare('SELECT * FROM tipos_formacion WHERE activo = 1').all();
});

ipcMain.handle('get-tipos-formacion-antiguos', () => {
  return db.prepare('SELECT * FROM tipos_formacion WHERE activo = 0').all();
});

ipcMain.handle('add-tipo-formacion', (event, tipo) => {
  const stmt = db.prepare('INSERT INTO tipos_formacion (nombre, descripcion, anos_validez, entidad) VALUES (?, ?, ?, ?)');
  const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.anos_validez, tipo.entidad);
  return info.lastInsertRowid;
});

ipcMain.handle('update-tipo-formacion', (event, tipo) => {
  const stmt = db.prepare('UPDATE tipos_formacion SET nombre=?, descripcion=?, anos_validez=?, entidad=? WHERE id=?');
  const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.anos_validez, tipo.entidad, tipo.id);
  return info.changes;
});

ipcMain.handle('delete-tipo-formacion', (event, id) => {
  return db.prepare('UPDATE tipos_formacion SET activo = 0 WHERE id = ?').run(id).changes;
});

//Formaciones Handlers

ipcMain.handle('get-formaciones-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT F.*, TF.nombre as curso_nombre, TF.anos_validez, P.nombre as trabajador_nombre, P.dni 
      FROM formacion F
      JOIN tipos_formacion TF ON F.tipo_formacion = TF.id
      JOIN trabajadores T ON F.trabajador = T.id
      JOIN personas P ON T.persona = P.id
      WHERE T.empresa = ? AND F.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-formaciones-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT F.*, TF.nombre as curso_nombre, TF.anos_validez, P.nombre as trabajador_nombre, P.dni 
      FROM formacion F
      JOIN tipos_formacion TF ON F.tipo_formacion = TF.id
      JOIN trabajadores T ON F.trabajador = T.id
      JOIN personas P ON T.persona = P.id
      WHERE T.empresa = ? AND F.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-formacion', (event, formacion) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('INSERT INTO formacion (tipo_formacion, trabajador, fecha_realizacion, fecha_validez) VALUES (?, ?, ?, ?)');
  const info = stmt.run(formacion.tipo_formacion, formacion.trabajador, formacion.fecha_realizacion, formacion.fecha_validez);
  return info.lastInsertRowid;
});

ipcMain.handle('update-formacion', (event, formacion) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('UPDATE formacion SET tipo_formacion=?, trabajador=?, fecha_realizacion=?, fecha_validez=? WHERE id=?');
  const info = stmt.run(formacion.tipo_formacion, formacion.trabajador, formacion.fecha_realizacion, formacion.fecha_validez, formacion.id);
  return info.changes;
});

ipcMain.handle('delete-formacion', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE formacion SET activo = 0 WHERE id = ?').run(id).changes;
});

//Riesgos Handlers

ipcMain.handle('get-riesgos-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  // Hacemos JOIN para obtener el nombre del puesto y verificar que pertenece a la empresa activa
  return db.prepare(`
      SELECT R.*, P.nombre as puesto_nombre 
      FROM riesgos_evaluacion R
      JOIN puestos_trabajo P ON R.puesto_trabajo = P.id
      JOIN secciones S ON P.seccion = S.id
      WHERE S.empresa = ? AND R.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-riesgos-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }

  // Hacemos JOIN para obtener el nombre del puesto y verificar que pertenece a la empresa activa
  return db.prepare(`
      SELECT R.*, P.nombre as puesto_nombre 
      FROM riesgos_evaluacion R
      JOIN puestos_trabajo P ON R.puesto_trabajo = P.id
      JOIN secciones S ON P.seccion = S.id
      WHERE S.empresa = ? AND R.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-riesgo', (event, riesgo) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare(`
      INSERT INTO riesgos_evaluacion (puesto_trabajo, codigo, descripcion, tipo, probabilidad, severidad, medidas, estado, nivel_riesgo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(riesgo.puesto_trabajo, riesgo.codigo, riesgo.descripcion, riesgo.tipo, riesgo.probabilidad, riesgo.severidad, riesgo.medidas, riesgo.estado, riesgo.nivel_riesgo);
  return info.lastInsertRowid;
});

ipcMain.handle('update-riesgo', (event, riesgo) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const stmt = db.prepare(`
      UPDATE riesgos_evaluacion 
      SET puesto_trabajo = ?, codigo = ?, descripcion = ?, tipo = ?, probabilidad = ?, severidad = ?, medidas = ?, estado = ?, nivel_riesgo = ?
      WHERE id = ?
  `);
  const info = stmt.run(riesgo.puesto_trabajo, riesgo.codigo, riesgo.descripcion, riesgo.tipo, riesgo.probabilidad, riesgo.severidad, riesgo.medidas, riesgo.estado, riesgo.nivel_riesgo, riesgo.id);
  return info.changes;
});

ipcMain.handle('delete-riesgo', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  const info = db.prepare('UPDATE riesgos_evaluacion SET activo = 0 WHERE id = ?').run(id);
  return info.changes;
});

//Planes Handlers

ipcMain.handle('get-planes-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT PL.*, R.codigo as riesgo_codigo 
      FROM plan_prevencion PL
      JOIN riesgos_evaluacion R ON PL.riesgo = R.id
      JOIN puestos_trabajo P ON r.puesto_trabajo = P.id
      JOIN secciones S ON p.seccion = S.id
      WHERE S.empresa = ? AND PL.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-planes-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT PL.*, R.codigo as riesgo_codigo 
      FROM plan_prevencion PL
      JOIN riesgos_evaluacion R ON PL.riesgo = R.id
      JOIN puestos_trabajo P ON r.puesto_trabajo = P.id
      JOIN secciones S ON p.seccion = S.id
      WHERE S.empresa = ? AND PL.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-plan', (event, plan) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('INSERT INTO plan_prevencion (riesgo, codigo, contenido, version) VALUES (?, ?, ?, ?)');
  const info = stmt.run(plan.riesgo, plan.codigo, plan.contenido, plan.version);
  return info.lastInsertRowid;
});

ipcMain.handle('update-plan', (event, plan) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('UPDATE plan_prevencion SET riesgo = ?, codigo = ?, contenido = ?, version = ? WHERE id = ?');
  const info = stmt.run(plan.riesgo, plan.codigo, plan.contenido, plan.version, plan.id);
  return info.changes;
});

ipcMain.handle('delete-plan', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const info = db.prepare('UPDATE plan_prevencion SET activo = 0 WHERE id = ?').run(id);
  return info.changes;
});

//TiposEpis Handlers

ipcMain.handle('get-tipos-epi-actuales', () => {
  return db.prepare('SELECT * FROM tipos_epis WHERE activo = 1').all();
});

ipcMain.handle('get-tipos-epi-antiguos', () => {
  return db.prepare('SELECT * FROM tipos_epis WHERE activo = 0').all();
});

ipcMain.handle('add-tipo-epi', (event, tipo) => {
  const stmt = db.prepare('INSERT INTO tipos_epis (nombre, descripcion, normativa) VALUES (?, ?, ?)');
  const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.normativa);
  return info.lastInsertRowid;
});

ipcMain.handle('update-tipo-epi', (event, tipo) => {
  const stmt = db.prepare('UPDATE tipos_epis SET nombre=?, descripcion=?, normativa=? WHERE id=?');
  const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.normativa, tipo.id);
  return info.changes;
});

ipcMain.handle('delete-tipo-epi', (event, id) => {
  return db.prepare('UPDATE tipos_epis SET activo = 0 WHERE id = ?').run(id).changes;
});

//Epis Handlers

ipcMain.handle('get-epis-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT E.*, te.nombre as epi_nombre, P.nombre as trabajador_nombre, P.dni 
      FROM epis E
      JOIN tipos_epis TE ON E.tipo = TE.id
      JOIN trabajadores T ON E.trabajador = T.id
      JOIN personas P ON T.persona = P.id
      WHERE T.empresa = ? AND E.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-epis-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT E.*, te.nombre as epi_nombre, P.nombre as trabajador_nombre, P.dni 
      FROM epis E
      JOIN tipos_epis TE ON E.tipo = TE.id
      JOIN trabajadores T ON E.trabajador = T.id
      JOIN personas P ON T.persona = P.id
      WHERE T.empresa = ? AND E.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-epi', (event, epi) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('INSERT INTO epis (trabajador, tipo, marca_modelo, fecha_entrega, fecha_caducidad) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(epi.trabajador, epi.tipo, epi.marca_modelo, epi.fecha_entrega, epi.fecha_caducidad);
  return info.lastInsertRowid;
});

ipcMain.handle('update-epi', (event, epi) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('UPDATE epis SET trabajador=?, tipo=?, marca_modelo=?, fecha_entrega=?, fecha_caducidad=? WHERE id=?');
  const info = stmt.run(epi.trabajador, epi.tipo, epi.marca_modelo, epi.fecha_entrega, epi.fecha_caducidad, epi.id);
  return info.changes;
});

ipcMain.handle('delete-epi', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE epis SET activo = 0 WHERE id = ?').run(id).changes;
});

//Investigaciones Handlers

ipcMain.handle('get-investigaciones-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT I.*, P.nombre as trabajador_nombre, P.dni 
      FROM investigaciones I
      JOIN trabajadores T ON I.trabajador = T.id
      JOIN personas P ON T.persona = P.id
      WHERE T.empresa = ? AND I.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-investigaciones-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT I.*, P.nombre as trabajador_nombre, P.dni 
      FROM investigaciones I
      JOIN trabajadores T ON I.trabajador = T.id
      JOIN personas P ON T.persona = P.id
      WHERE T.empresa = ? AND I.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-investigacion', (event, inv) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      INSERT INTO investigaciones (trabajador, codigo, tipo, fecha, descripcion, causas, medidas_correctivas, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(inv.trabajador, inv.codigo, inv.tipo, inv.fecha, inv.descripcion, inv.causas, inv.medidas_correctivas, inv.estado);
  return info.lastInsertRowid;
});

ipcMain.handle('update-investigacion', (event, inv) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      UPDATE investigaciones 
      SET trabajador=?, codigo=?, tipo=?, fecha=?, descripcion=?, causas=?, medidas_correctivas=?, estado=? 
      WHERE id=?
  `);
  const info = stmt.run(inv.trabajador, inv.codigo, inv.tipo, inv.fecha, inv.descripcion, inv.causas, inv.medidas_correctivas, inv.estado, inv.id);
  return info.changes;
});

ipcMain.handle('delete-investigacion', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE investigaciones SET activo = 0 WHERE id = ?').run(id).changes;
});

//Equipos Handlers

ipcMain.handle('get-equipos-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare('SELECT * FROM equipos WHERE empresa = ? AND activo = 1').all(empresaActivaId);
});

ipcMain.handle('get-equipos-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare('SELECT * FROM equipos WHERE empresa = ? AND activo = 0').all(empresaActivaId);
});

ipcMain.handle('add-equipo', (event, eq) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('INSERT INTO equipos (empresa, codigo, nombre, ubicacion, fecha_compra) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(empresaActivaId, eq.codigo, eq.nombre, eq.ubicacion, eq.fecha_compra);
  return info.lastInsertRowid;
});

ipcMain.handle('update-equipo', (event, eq) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('UPDATE equipos SET codigo=?, nombre=?, ubicacion=?, fecha_compra=? WHERE id=? AND empresa=?');
  const info = stmt.run(eq.codigo, eq.nombre, eq.ubicacion, eq.fecha_compra, eq.id, empresaActivaId);
  return info.changes;
});

ipcMain.handle('delete-equipo', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE equipos SET activo = 0 WHERE id = ? AND empresa = ?').run(id, empresaActivaId).changes;
});

//Mantenimientos Handlers

ipcMain.handle('get-mantenimientos-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT M.*, E.nombre as equipo_nombre, E.codigo as equipo_codigo, P.nombre as responsable_nombre 
      FROM mantenimientos M
      JOIN equipos E ON M.equipo = E.id
      LEFT JOIN personas P ON M.responsable = E.id
      WHERE E.empresa = ? AND M.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-mantenimientos-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT M.*, E.nombre as equipo_nombre, E.codigo as equipo_codigo, P.nombre as responsable_nombre 
      FROM mantenimientos M
      JOIN equipos E ON M.equipo = E.id
      LEFT JOIN personas P ON M.responsable = E.id
      WHERE E.empresa = ? AND M.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-mantenimiento', (event, mant) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      INSERT INTO mantenimientos (equipo, tipo, fecha_programada, fecha_realizada, responsable, observaciones) 
      VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(mant.equipo, mant.tipo, mant.fecha_programada, mant.fecha_realizada, mant.responsable, mant.observaciones);
  return info.lastInsertRowid;
});

ipcMain.handle('update-mantenimiento', (event, mant) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      UPDATE mantenimientos 
      SET equipo=?, tipo=?, fecha_programada=?, fecha_realizada=?, responsable=?, observaciones=? 
      WHERE id=?
  `);
  const info = stmt.run(mant.equipo, mant.tipo, mant.fecha_programada, mant.fecha_realizada, mant.responsable, mant.observaciones, mant.id);
  return info.changes;
});

ipcMain.handle('delete-mantenimiento', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE mantenimientos SET activo = 0 WHERE id = ?').run(id).changes;
});

// Emergencias Handlers

ipcMain.handle('get-simulacros-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  
  // Usamos GROUP_CONCAT para juntar los nombres y los IDs en un solo texto separado por comas
  return db.prepare(`
      SELECT ES.*, 
             p.nombre as responsable_nombre,
             GROUP_CONCAT(P2.nombre, ', ') as participantes_nombres,
             GROUP_CONCAT(T.id, ',') as participantes_ids
      FROM emergencias_simulacros ES
      LEFT JOIN personas P ON ES.responsable = P.id
      LEFT JOIN emergencias_participantes EP ON ES.id = EP.simulacro
      LEFT JOIN trabajadores T ON EP.trabajador = T.id
      LEFT JOIN personas P2 ON T.persona = P2.id
      WHERE ES.empresa = ? AND ES.activo = 1
      GROUP BY ES.id
  `).all(empresaActivaId);
});

ipcMain.handle('get-simulacros-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  
  // Usamos GROUP_CONCAT para juntar los nombres y los IDs en un solo texto separado por comas
  return db.prepare(`
      SELECT ES.*, 
             p.nombre as responsable_nombre,
             GROUP_CONCAT(P2.nombre, ', ') as participantes_nombres,
             GROUP_CONCAT(T.id, ',') as participantes_ids
      FROM emergencias_simulacros ES
      LEFT JOIN personas P ON ES.responsable = P.id
      LEFT JOIN emergencias_participantes EP ON ES.id = EP.simulacro
      LEFT JOIN trabajadores T ON EP.trabajador = T.id
      LEFT JOIN personas P2 ON T.persona = P2.id
      WHERE ES.empresa = ? AND ES.activo = 0
      GROUP BY ES.id
  `).all(empresaActivaId);
});

ipcMain.handle('add-simulacro', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  
  const transaction = db.transaction(() => {
      // 1. Insertamos el simulacro base
      const stmt = db.prepare('INSERT INTO emergencias_simulacros (empresa, tipo, descripcion, fecha_simulacro, responsable) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(empresaActivaId, datos.tipo, datos.descripcion, datos.fecha_simulacro, datos.responsable);
      const simulacroId = info.lastInsertRowid;
      
      // 2. Insertamos a todos los participantes seleccionados
      if (datos.participantes && datos.participantes.length > 0) {
          const stmtPart = db.prepare('INSERT INTO emergencias_participantes (simulacro, trabajador) VALUES (?, ?)');
          for (const trabId of datos.participantes) {
              stmtPart.run(simulacroId, trabId);
          }
      }
      return simulacroId;
  });
  return transaction();
});

ipcMain.handle('update-simulacro', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  
  const transaction = db.transaction(() => {
      // 1. Actualizamos los datos base
      db.prepare('UPDATE emergencias_simulacros SET tipo=?, descripcion=?, fecha_simulacro=?, responsable=? WHERE id=?').run(datos.tipo, datos.descripcion, datos.fecha_simulacro, datos.responsable, datos.id);
      
      // 2. Borramos los participantes antiguos y metemos los nuevos (es la forma más limpia en BBDD)
      db.prepare('DELETE FROM emergencias_participantes WHERE simulacro = ?').run(datos.id);
      
      if (datos.participantes && datos.participantes.length > 0) {
          const stmtPart = db.prepare('INSERT INTO emergencias_participantes (simulacro, trabajador) VALUES (?, ?)');
          for (const trabId of datos.participantes) {
              stmtPart.run(datos.id, trabId);
          }
      }
      return true;
  });
  return transaction();
});

ipcMain.handle('delete-simulacro', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  return db.prepare('UPDATE emergencias_simulacros SET activo = 0 WHERE id = ?').run(id).changes;
});

// Handler especial para el botón rápido de añadir un solo participante
ipcMain.handle('add-participante-rapido', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  try {
      return db.prepare('INSERT INTO emergencias_participantes (simulacro, trabajador) VALUES (?, ?)').run(datos.simulacro, datos.trabajador).changes;
  } catch(e) { 
      return false; // Por si intentas añadir a alguien que ya estaba (evita el petardeo del PRIMARY KEY)
  }
});

//Inspecciones Handlers

ipcMain.handle('get-inspecciones-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT I.*, S.nombre as seccion_nombre, P.nombre as responsable_nombre 
      FROM insepcciones I
      LEFT JOIN secciones S ON I.seccion = S.id
      LEFT JOIN personas P ON I.responsable = P.id
      WHERE I.empresa = ? AND I.activo = 1
  `).all(empresaActivaId);
});

ipcMain.handle('get-inspecciones-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT I.*, S.nombre as seccion_nombre, P.nombre as responsable_nombre 
      FROM insepcciones I
      LEFT JOIN secciones S ON I.seccion = S.id
      LEFT JOIN personas P ON I.responsable = P.id
      WHERE I.empresa = ? AND I.activo = 0
  `).all(empresaActivaId);
});

ipcMain.handle('add-inspeccion', (event, insp) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      INSERT INTO insepcciones (empresa, seccion, ubicacion_exacta, tipo_inspeccion, fecha, resultado, medidas_correctivas, responsable, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(empresaActivaId, insp.seccion, insp.ubicacion_exacta, insp.tipo_inspeccion, insp.fecha, insp.resultado, insp.medidas_correctivas, insp.responsable, insp.estado);
  return info.lastInsertRowid;
});

ipcMain.handle('update-inspeccion', (event, insp) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      UPDATE insepcciones 
      SET seccion=?, ubicacion_exacta=?, tipo_inspeccion=?, fecha=?, resultado=?, medidas_correctivas=?, responsable=?, estado=? 
      WHERE id=? AND empresa=?
  `);
  const info = stmt.run(insp.seccion, insp.ubicacion_exacta, insp.tipo_inspeccion, insp.fecha, insp.resultado, insp.medidas_correctivas, insp.responsable, insp.estado, insp.id, empresaActivaId);
  return info.changes;
});

ipcMain.handle('delete-inspeccion', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE insepcciones SET activo = 0 WHERE id = ? AND empresa = ?').run(id, empresaActivaId).changes;
});

//Participaciones Handlers

ipcMain.handle('get-consultas-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  
  // Agrupamos por ID de consulta y concatenamos nombres e IDs de las PERSONAS participantes
  return db.prepare(`
      SELECT PC.*, 
             GROUP_CONCAT(P.nombre, ', ') as participantes_nombres,
             GROUP_CONCAT(P.id, ',') as participantes_ids
      FROM participacion_consultas PC
      LEFT JOIN participacion_participantes PP ON PC.id = PP.consulta
      LEFT JOIN personas P ON PP.persona = P.id
      WHERE PC.empresa = ? AND PC.activo = 1
      GROUP BY PC.id
  `).all(empresaActivaId);
});

ipcMain.handle('get-consultas-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  
  // Agrupamos por ID de consulta y concatenamos nombres e IDs de las PERSONAS participantes
  return db.prepare(`
      SELECT PC.*, 
             GROUP_CONCAT(P.nombre, ', ') as participantes_nombres,
             GROUP_CONCAT(P.id, ',') as participantes_ids
      FROM participacion_consultas PC
      LEFT JOIN participacion_participantes PP ON PC.id = PP.consulta
      LEFT JOIN personas P ON PP.persona = P.id
      WHERE PC.empresa = ? AND PC.activo = 0
      GROUP BY PC.id
  `).all(empresaActivaId);
});

ipcMain.handle('add-consulta', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  
  const transaction = db.transaction(() => {
      // 1. Insertamos la consulta base
      const stmt = db.prepare('INSERT INTO participacion_consultas (empresa, fecha, tipo_consulta, descripcion, acuerdos) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(empresaActivaId, datos.fecha, datos.tipo_consulta, datos.descripcion, datos.acuerdos);
      const consultaId = info.lastInsertRowid;
      
      // 2. Insertamos las personas asociadas en la tabla puente
      if (datos.participantes && datos.participantes.length > 0) {
          const stmtPart = db.prepare('INSERT INTO participacion_participantes (consulta, persona) VALUES (?, ?)');
          for (const personaId of datos.participantes) {
              stmtPart.run(consultaId, personaId);
          }
      }
      return consultaId;
  });
  return transaction();
});

ipcMain.handle('update-consulta', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  
  const transaction = db.transaction(() => {
      // 1. Actualizamos el registro principal
      db.prepare('UPDATE participacion_consultas SET fecha=?, tipo_consulta=?, descripcion=?, acuerdos=? WHERE id=?').run(datos.fecha, datos.tipo_consulta, datos.descripcion, datos.acuerdos, datos.id);
      
      // 2. Limpiamos y re-insertamos los participantes en la intermedia
      db.prepare('DELETE FROM participacion_participantes WHERE consulta = ?').run(datos.id);
      
      if (datos.participantes && datos.participantes.length > 0) {
          const stmtPart = db.prepare('INSERT INTO participacion_participantes (consulta, persona) VALUES (?, ?)');
          for (const personaId of datos.participantes) {
              stmtPart.run(datos.id, personaId);
          }
      }
      return true;
  });
  return transaction();
});

ipcMain.handle('delete-consulta', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  return db.prepare('UPDATE participacion_consultas SET activo = 0 WHERE id = ?').run(id).changes;
});

// Botón rápido: añade una persona a la consulta evitando duplicados por la PRIMARY KEY
ipcMain.handle('add-consulta-participante-rapido', (event, datos) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }

  try {
      return db.prepare('INSERT INTO participacion_participantes (consulta, persona) VALUES (?, ?)').run(datos.consulta, datos.persona).changes;
  } catch(e) { 
      return false; 
  }
});

//Documentos Handlers

ipcMain.handle('get-documentos-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare('SELECT * FROM documentos_catalogo WHERE empresa = ? AND activo = 1').all(empresaActivaId);
});

ipcMain.handle('get-documentos-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare('SELECT * FROM documentos_catalogo WHERE empresa = ? AND activo = 0').all(empresaActivaId);
});


ipcMain.handle('add-documento', (event, doc) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('INSERT INTO documentos_catalogo (empresa, codigo, nombre, tipo) VALUES (?, ?, ?, ?)');
  const info = stmt.run(empresaActivaId, doc.codigo, doc.nombre, doc.tipo);
  return info.lastInsertRowid;
});

ipcMain.handle('update-documento', (event, doc) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare('UPDATE documentos_catalogo SET codigo=?, nombre=?, tipo=? WHERE id=? AND empresa=?');
  const info = stmt.run(doc.codigo, doc.nombre, doc.tipo, doc.id, empresaActivaId);
  return info.changes;
});

ipcMain.handle('delete-documento', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE documentos_catalogo SET activo = 0 WHERE id = ? AND empresa = ?').run(id, empresaActivaId).changes;
});

//DocVersiones Handlers
ipcMain.handle('get-versiones-actuales', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT DV.*, DC.codigo as doc_codigo, DC.nombre as doc_nombre, P.nombre as aprobado_nombre 
      FROM documentos_versiones DV
      JOIN documentos_catalogo DC ON DV.documento = DC.id
      LEFT JOIN personas P ON DV.aprobado_por = P.id
      WHERE DC.empresa = ? AND DV.activo = 1
      ORDER BY DV.fecha DESC
  `).all(empresaActivaId);
});

ipcMain.handle('get-versiones-antiguos', () => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return [];
  }
  return db.prepare(`
      SELECT DV.*, DC.codigo as doc_codigo, DC.nombre as doc_nombre, P.nombre as aprobado_nombre 
      FROM documentos_versiones DV
      JOIN documentos_catalogo DC ON DV.documento = DC.id
      LEFT JOIN personas P ON DV.aprobado_por = P.id
      WHERE DC.empresa = ? AND DV.activo = 0
      ORDER BY DV.fecha DESC
  `).all(empresaActivaId);
});

ipcMain.handle('add-version', (event, ver) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      INSERT INTO documentos_versiones (documento, version, fecha, cambios, aprobado_por) 
      VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(ver.documento, ver.version, ver.fecha, ver.cambios, ver.aprobado_por);
  return info.lastInsertRowid;
});

ipcMain.handle('update-version', (event, ver) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  const stmt = db.prepare(`
      UPDATE documentos_versiones 
      SET documento=?, version=?, fecha=?, cambios=?, aprobado_por=? 
      WHERE id=?
  `);
  const info = stmt.run(ver.documento, ver.version, ver.fecha, ver.cambios, ver.aprobado_por, ver.id);
  return info.changes;
});

ipcMain.handle('delete-version', (event, id) => {
  if (!empresaActivaId){
    dispararNotificacion("No hay una empresa seleccionada", "error");
    return false;
  }
  return db.prepare('UPDATE documentos_versiones SET activo = 0 WHERE id = ?').run(id).changes;
});