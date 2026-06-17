const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-inspecciones-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT I.*, S.nombre as seccion_nombre, P.nombre as responsable_nombre 
        FROM inspecciones I
        LEFT JOIN secciones S ON I.seccion = S.id
        LEFT JOIN personas P ON I.responsable = P.id
        WHERE I.empresa = ? AND I.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-inspecciones-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT I.*, S.nombre as seccion_nombre, P.nombre as responsable_nombre 
        FROM inspecciones I
        LEFT JOIN secciones S ON I.seccion = S.id
        LEFT JOIN personas P ON I.responsable = P.id
        WHERE I.empresa = ? AND I.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-inspeccion', (event, insp) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare(`
        INSERT INTO inspecciones (empresa, seccion, ubicacion_exacta, tipo_inspeccion, fecha, resultado, medidas_correctivas, responsable, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(appState.empresaId, insp.seccion, insp.ubicacion_exacta, insp.tipo_inspeccion, insp.fecha, insp.resultado, insp.medidas_correctivas, insp.responsable, insp.estado);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-inspeccion', (event, insp) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare(`
        UPDATE inspecciones 
        SET seccion=?, ubicacion_exacta=?, tipo_inspeccion=?, fecha=?, resultado=?, medidas_correctivas=?, responsable=?, estado=? 
        WHERE id=? AND empresa=?
    `);
    const info = stmt.run(insp.seccion, insp.ubicacion_exacta, insp.tipo_inspeccion, insp.fecha, insp.resultado, insp.medidas_correctivas, insp.responsable, insp.estado, insp.id, appState.empresaId);
    return info.changes;
  });

  ipcMain.handle('delete-inspeccion', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    return db.prepare('UPDATE inspecciones SET activo = 0 WHERE id = ? AND empresa = ?').run(id, appState.empresaId).changes;
  });
}