const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-consultas-actuales', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-consultas-antiguos', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-consulta', (event, datos) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    
    const transaction = db.transaction(() => {
        // 1. Insertamos la consulta base
        const stmt = db.prepare('INSERT INTO participacion_consultas (empresa, fecha, tipo_consulta, descripcion, acuerdos) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(appState.empresaId, datos.fecha, datos.tipo_consulta, datos.descripcion, datos.acuerdos);
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
    if (!appState.empresaId){
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
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    return db.prepare('UPDATE participacion_consultas SET activo = 0 WHERE id = ?').run(id).changes;
  });

  // Botón rápido: añade una persona a la consulta evitando duplicados por la PRIMARY KEY
  ipcMain.handle('add-consulta-participante-rapido', (event, datos) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    try {
        return db.prepare('INSERT INTO participacion_participantes (consulta, persona) VALUES (?, ?)').run(datos.consulta, datos.persona).changes;
    } catch(e) { 
        return false; 
    }
  });
}