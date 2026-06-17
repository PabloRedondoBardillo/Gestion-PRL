const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-mantenimientos-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT M.*, E.nombre as equipo_nombre, E.codigo as equipo_codigo, P.nombre as responsable_nombre 
        FROM mantenimientos M
        JOIN equipos E ON M.equipo = E.id
        LEFT JOIN personas P ON M.responsable = P.id
        WHERE E.empresa = ? AND M.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-mantenimientos-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT M.*, E.nombre as equipo_nombre, E.codigo as equipo_codigo, P.nombre as responsable_nombre 
        FROM mantenimientos M
        JOIN equipos E ON M.equipo = E.id
        LEFT JOIN personas P ON M.responsable = P.id
        WHERE E.empresa = ? AND M.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-mantenimiento', (event, mant) => {
    if (!appState.empresaId){
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
    if (!appState.empresaId){
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
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE mantenimientos SET activo = 0 WHERE id = ?').run(id).changes;
  });
}