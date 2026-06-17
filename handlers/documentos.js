const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-documentos-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare('SELECT * FROM documentos_catalogo WHERE empresa = ? AND activo = 1').all(appState.empresaId);
  });

  ipcMain.handle('get-documentos-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare('SELECT * FROM documentos_catalogo WHERE empresa = ? AND activo = 0').all(appState.empresaId);
  });


  ipcMain.handle('add-documento', (event, doc) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('INSERT INTO documentos_catalogo (empresa, codigo, nombre, tipo) VALUES (?, ?, ?, ?)');
    const info = stmt.run(appState.empresaId, doc.codigo, doc.nombre, doc.tipo);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-documento', (event, doc) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('UPDATE documentos_catalogo SET codigo=?, nombre=?, tipo=? WHERE id=? AND empresa=?');
    const info = stmt.run(doc.codigo, doc.nombre, doc.tipo, doc.id, appState.empresaId);
    return info.changes;
  });

  ipcMain.handle('delete-documento', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE documentos_catalogo SET activo = 0 WHERE id = ? AND empresa = ?').run(id, appState.empresaId).changes;
  });
}