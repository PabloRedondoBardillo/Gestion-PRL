const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-riesgos-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    // Hacemos JOIN para obtener el nombre del puesto y verificar que pertenece a la empresa activa
    return db.prepare(`
        SELECT R.*, P.nombre as puesto_nombre 
        FROM riesgos_evaluacion R
        JOIN puestos_trabajo P ON R.puesto_trabajo = P.id
        JOIN secciones S ON P.seccion = S.id
        WHERE S.empresa = ? AND R.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-riesgos-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    // Hacemos JOIN para obtener el nombre del puesto y verificar que pertenece a la empresa activa
    return db.prepare(`
        SELECT R.*, P.nombre as puesto_nombre 
        FROM riesgos_evaluacion R
        JOIN puestos_trabajo P ON R.puesto_trabajo = P.id
        JOIN secciones S ON P.seccion = S.id
        WHERE S.empresa = ? AND R.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-riesgo', (event, riesgo) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare(`
        INSERT INTO riesgos_evaluacion (puesto_trabajo, codigo, descripcion, tipo, probabilidad, severidad, medidas, estado, nivel_riesgo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(riesgo.puesto_trabajo, riesgo.codigo, riesgo.descripcion, riesgo.tipo, riesgo.probabilidad, riesgo.severidad, riesgo.medidas, riesgo.estado, riesgo.nivel_riesgo);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-riesgo', (event, riesgo) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare(`
        UPDATE riesgos_evaluacion 
        SET puesto_trabajo = ?, codigo = ?, descripcion = ?, tipo = ?, probabilidad = ?, severidad = ?, medidas = ?, estado = ?, nivel_riesgo = ?
        WHERE id = ?
    `);
    const info = stmt.run(riesgo.puesto_trabajo, riesgo.codigo, riesgo.descripcion, riesgo.tipo, riesgo.probabilidad, riesgo.severidad, riesgo.medidas, riesgo.estado, riesgo.nivel_riesgo, riesgo.id);
    return info.changes;
  });

  ipcMain.handle('delete-riesgo', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const info = db.prepare('UPDATE riesgos_evaluacion SET activo = 0 WHERE id = ?').run(id);
    return info.changes;
  });
}