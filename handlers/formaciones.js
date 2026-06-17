const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-formaciones-actuales', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-formaciones-antiguos', () => {
    if (!appState.empresaId){
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
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-formacion', (event, formacion) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('INSERT INTO formacion (tipo_formacion, trabajador, fecha_realizacion, fecha_validez) VALUES (?, ?, ?, ?)');
    const info = stmt.run(formacion.tipo_formacion, formacion.trabajador, formacion.fecha_realizacion, formacion.fecha_validez);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-formacion', (event, formacion) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('UPDATE formacion SET tipo_formacion=?, trabajador=?, fecha_realizacion=?, fecha_validez=? WHERE id=?');
    const info = stmt.run(formacion.tipo_formacion, formacion.trabajador, formacion.fecha_realizacion, formacion.fecha_validez, formacion.id);
    return info.changes;
  });

  ipcMain.handle('delete-formacion', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE formacion SET activo = 0 WHERE id = ?').run(id).changes;
  });
}