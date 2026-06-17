const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion){
  ipcMain.handle('get-equipos-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare('SELECT * FROM equipos WHERE empresa = ? AND activo = 1').all(appState.empresaId);
  });

  ipcMain.handle('get-equipos-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare('SELECT * FROM equipos WHERE empresa = ? AND activo = 0').all(appState.empresaId);
  });

  ipcMain.handle('add-equipo', (event, eq) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('INSERT INTO equipos (empresa, codigo, nombre, ubicacion, fecha_compra) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(appState.empresaId, eq.codigo, eq.nombre, eq.ubicacion, eq.fecha_compra);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-equipo', (event, eq) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('UPDATE equipos SET codigo=?, nombre=?, ubicacion=?, fecha_compra=? WHERE id=? AND empresa=?');
    const info = stmt.run(eq.codigo, eq.nombre, eq.ubicacion, eq.fecha_compra, eq.id, appState.empresaId);
    return info.changes;
  });

  ipcMain.handle('delete-equipo', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE equipos SET activo = 0 WHERE id = ? AND empresa = ?').run(id, appState.empresaId).changes;
  });
}