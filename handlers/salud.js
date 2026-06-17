const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-vigilancia-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    return db.prepare(`
        SELECT v.*, p.nombre as trabajador_nombre, p.dni 
        FROM salud v
        JOIN trabajadores t ON v.trabajador = t.id
        JOIN personas p ON t.persona = p.id
        WHERE t.empresa = ? AND v.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('get-vigilancia-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }
    return db.prepare(`
        SELECT v.*, p.nombre as trabajador_nombre, p.dni 
        FROM salud v
        JOIN trabajadores t ON v.trabajador = t.id
        JOIN personas p ON t.persona = p.id
        WHERE t.empresa = ? AND v.activo = 1
    `).all(appState.empresaId);
  });

  ipcMain.handle('add-vigilancia', (event, datos) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare(`
        INSERT INTO salud (trabajador, fecha_examen, tipo, resultado, proxima_fecha, observaciones, apto) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Añadimos datos.apto al final
    const info = stmt.run(datos.trabajador, datos.fecha_examen, datos.tipo, datos.resultado, datos.proxima_fecha, datos.observaciones, datos.apto);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-vigilancia', (event, datos) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare(`
        UPDATE salud 
        SET trabajador = ?, fecha_examen = ?, tipo = ?, resultado = ?, proxima_fecha = ?, observaciones = ?, apto = ? 
        WHERE id = ?
    `);
    // Añadimos datos.apto antes de datos.id
    const info = stmt.run(datos.trabajador, datos.fecha_examen, datos.tipo, datos.resultado, datos.proxima_fecha, datos.observaciones, datos.apto, datos.id);
    return info.changes;
  });

  ipcMain.handle('delete-vigilancia', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    return db.prepare('UPDATE salud SET activo = 0 WHERE id = ?').run(id).changes;
  });
}