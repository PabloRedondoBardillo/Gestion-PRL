const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-simulacros-actuales', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-simulacros-antiguos', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-simulacro', (event, datos) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    
    const transaction = db.transaction(() => {
        // 1. Insertamos el simulacro base
        const stmt = db.prepare('INSERT INTO emergencias_simulacros (empresa, tipo, descripcion, fecha_simulacro, responsable) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(appState.empresaId, datos.tipo, datos.descripcion, datos.fecha_simulacro, datos.responsable);
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
    if (!appState.empresaId){
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
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    return db.prepare('UPDATE emergencias_simulacros SET activo = 0 WHERE id = ?').run(id).changes;
  });

  // Handler especial para el botón rápido de añadir un solo participante
  ipcMain.handle('add-participante-rapido', (event, datos) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    try {
        return db.prepare('INSERT INTO emergencias_participantes (simulacro, trabajador) VALUES (?, ?)').run(datos.simulacro, datos.trabajador).changes;
    } catch(e) { 
        return false; // Por si intentas añadir a alguien que ya estaba (evita el petardeo del PRIMARY KEY)
    }
  });
}