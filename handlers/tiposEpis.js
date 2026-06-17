const { ipcMain } = require('electron');

module.exports = function(db, appSate, dispararNotificacion) {
  ipcMain.handle('get-tipos-epi-actuales', () => {
    return db.prepare('SELECT * FROM tipos_epis WHERE activo = 1').all();
  });

  ipcMain.handle('get-tipos-epi-antiguos', () => {
    return db.prepare('SELECT * FROM tipos_epis WHERE activo = 0').all();
  });

  ipcMain.handle('add-tipo-epi', (event, tipo) => {
    const stmt = db.prepare('INSERT INTO tipos_epis (nombre, descripcion, normativa) VALUES (?, ?, ?)');
    const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.normativa);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-tipo-epi', (event, tipo) => {
    const stmt = db.prepare('UPDATE tipos_epis SET nombre=?, descripcion=?, normativa=? WHERE id=?');
    const info = stmt.run(tipo.nombre, tipo.descripcion, tipo.normativa, tipo.id);
    return info.changes;
  });

  ipcMain.handle('delete-tipo-epi', (event, id) => {
    return db.prepare('UPDATE tipos_epis SET activo = 0 WHERE id = ?').run(id).changes;
  });
}