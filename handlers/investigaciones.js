const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-investigaciones-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT I.*, P.nombre as trabajador_nombre, P.dni 
        FROM investigaciones I
        JOIN trabajadores T ON I.trabajador = T.id
        JOIN personas P ON T.persona = P.id
        WHERE T.empresa = ? AND I.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-investigaciones-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT I.*, P.nombre as trabajador_nombre, P.dni 
        FROM investigaciones I
        JOIN trabajadores T ON I.trabajador = T.id
        JOIN personas P ON T.persona = P.id
        WHERE T.empresa = ? AND I.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-investigacion', (event, inv) => {
    if (!appState.empresaId){
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
    if (!appState.empresaId){
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
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE investigaciones SET activo = 0 WHERE id = ?').run(id).changes;
  });
}