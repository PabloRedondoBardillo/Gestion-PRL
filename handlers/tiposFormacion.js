const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-tipos-formacion-actuales', () => {
    return db.prepare('SELECT * FROM tipos_formacion WHERE activo = 1').all();
  });

  ipcMain.handle('get-tipos-formacion-antiguos', () => {
    return db.prepare('SELECT * FROM tipos_formacion WHERE activo = 0').all();
  });

  ipcMain.handle('add-tipo-formacion', (event, tipo) => {
    const stmt = db.prepare('INSERT INTO tipos_formacion (nombre, descripcion, anos_validez, entidad) VALUES (?, ?, ?, ?)');
    const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.anos_validez, tipo.entidad);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-tipo-formacion', (event, tipo) => {
    const stmt = db.prepare('UPDATE tipos_formacion SET nombre=?, descripcion=?, anos_validez=?, entidad=? WHERE id=?');
    const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.anos_validez, tipo.entidad, tipo.id);
    return info.changes;
  });

  ipcMain.handle('delete-tipo-formacion', (event, id) => {
    return db.prepare('UPDATE tipos_formacion SET activo = 0 WHERE id = ?').run(id).changes;
  });
}