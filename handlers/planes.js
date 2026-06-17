const { ipcMain } = require('electron')

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-planes-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT PL.*, R.codigo as riesgo_codigo 
        FROM plan_prevencion PL
        JOIN riesgos_evaluacion R ON PL.riesgo = R.id
        JOIN puestos_trabajo P ON r.puesto_trabajo = P.id
        JOIN secciones S ON p.seccion = S.id
        WHERE S.empresa = ? AND PL.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-planes-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT PL.*, R.codigo as riesgo_codigo 
        FROM plan_prevencion PL
        JOIN riesgos_evaluacion R ON PL.riesgo = R.id
        JOIN puestos_trabajo P ON r.puesto_trabajo = P.id
        JOIN secciones S ON p.seccion = S.id
        WHERE S.empresa = ? AND PL.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-plan', (event, plan) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('INSERT INTO plan_prevencion (riesgo, codigo, contenido, version) VALUES (?, ?, ?, ?)');
    const info = stmt.run(plan.riesgo, plan.codigo, plan.contenido, plan.version);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-plan', (event, plan) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const stmt = db.prepare('UPDATE plan_prevencion SET riesgo = ?, codigo = ?, contenido = ?, version = ? WHERE id = ?');
    const info = stmt.run(plan.riesgo, plan.codigo, plan.contenido, plan.version, plan.id);
    return info.changes;
  });

  ipcMain.handle('delete-plan', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    const info = db.prepare('UPDATE plan_prevencion SET activo = 0 WHERE id = ?').run(id);
    return info.changes;
  });
}