const { ipcMain } = require('electron')

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-puestos-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    return db.prepare(`
        SELECT P.*, S.nombre as seccion_nombre 
        FROM puestos_trabajo P
        JOIN secciones S ON P.seccion = S.id
        WHERE S.empresa = ? AND P.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-puestos-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    return db.prepare(`
        SELECT P.*, S.nombre as seccion_nombre 
        FROM puestos_trabajo P
        JOIN secciones S ON P.seccion = S.id
        WHERE S.empresa = ? AND P.activo = 0
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-puesto', (event, puesto) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare(`
          INSERT INTO puestos_trabajo (seccion, nombre, descripcion, riesgos_asociados) 
          VALUES (?, ?, ?, ?)
      `);
    const info = stmt.run(
        puesto.seccion, 
        puesto.nombre, 
        puesto.descripcion || null, 
        puesto.riesgos_asociados || null
    );
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-puesto', (event, puesto) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }  

    const stmt = db.prepare(`
        UPDATE puestos_trabajo 
        SET seccion = ?, nombre = ?, descripcion = ?, riesgos_asociados = ? 
        WHERE id = ?
    `);
    const info = stmt.run(
        puesto.seccion, 
        puesto.nombre, 
        puesto.descripcion || null, 
        puesto.riesgos_asociados || null, 
        puesto.id
    );
    return info.changes;
  });

  ipcMain.handle('delete-puesto', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }
    
    // Borrado lógico del puesto
    const stmt = db.prepare('UPDATE puestos_trabajo SET activo = 0 WHERE id = ?');
    const info = stmt.run(id);
    return info.changes;
  });
}