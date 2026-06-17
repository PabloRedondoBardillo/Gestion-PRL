const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-secciones-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    return db.prepare('SELECT * FROM secciones WHERE empresa = ? AND activo = 1').all(appState.empresaId);
  });

  ipcMain.handle('get-secciones-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    return db.prepare('SELECT * FROM secciones WHERE empresa = ? AND activo = 0').all(appState.empresaId);
  });

  ipcMain.handle('add-seccion', (event, seccion) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare('INSERT INTO secciones (empresa, nombre) VALUES (?, ?)');
    const info = stmt.run(appState.empresaId, seccion.nombre);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-seccion', (event, seccion) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare('UPDATE secciones SET nombre = ? WHERE id = ? AND empresa = ?');
    const info = stmt.run(seccion.nombre, seccion.id, appState.empresaId);
    return info.changes;
  });

  ipcMain.handle('delete-seccion', (event, id) => {
    // Al hacer DELETE aquí, SQLite borrará automáticamente los puestos asociados 
    // gracias al ON DELETE CASCADE que le pusimos en la creación de la tabla.
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const info = db.prepare('UPDATE secciones SET activo = 0 WHERE id = ? AND empresa = ?').run(id, appState.empresaId);
    return info.changes;
  });
}