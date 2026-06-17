const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-epis-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT E.*, te.nombre as epi_nombre, P.nombre as trabajador_nombre, P.dni 
        FROM epis E
        LEFT JOIN tipos_epis TE ON E.tipo = TE.id
        JOIN trabajadores T ON E.trabajador = T.id
        JOIN personas P ON T.persona = P.id
        WHERE T.empresa = ? AND E.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-epis-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT E.*, te.nombre as epi_nombre, P.nombre as trabajador_nombre, P.dni 
        FROM epis E
        LEFT JOIN tipos_epis TE ON E.tipo = TE.id
        JOIN trabajadores T ON E.trabajador = T.id
        JOIN personas P ON T.persona = P.id
        WHERE T.empresa = ? AND E.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-epi', (event, epi) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('INSERT INTO epis (trabajador, tipo, marca_modelo, fecha_entrega, fecha_caducidad) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(epi.trabajador, epi.tipo, epi.marca_modelo, epi.fecha_entrega, epi.fecha_caducidad);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-epi', (event, epi) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('UPDATE epis SET trabajador=?, tipo=?, marca_modelo=?, fecha_entrega=?, fecha_caducidad=? WHERE id=?');
    const info = stmt.run(epi.trabajador, epi.tipo, epi.marca_modelo, epi.fecha_entrega, epi.fecha_caducidad, epi.id);
    return info.changes;
  });

  ipcMain.handle('delete-epi', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE epis SET activo = 0 WHERE id = ?').run(id).changes;
  });
}