const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-versiones-actuales', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-versiones-antiguos', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-version', (event, ver) => {
    if (!appState.empresaId){
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
    if (!appState.empresaId){
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
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE documentos_versiones SET activo = 0 WHERE id = ?').run(id).changes;
  });
}