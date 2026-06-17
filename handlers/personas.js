const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-personas-actuales', () => {
    return db.prepare('SELECT * FROM personas WHERE activo = 1').all();
  });

  ipcMain.handle('get-personas-antiguas', () => {
    return db.prepare('SELECT * FROM personas WHERE activo = 0').all();
  });

  ipcMain.handle('add-persona', (event, p) => {
    const stmt = db.prepare('INSERT INTO personas (dni, nombre, fecha_nacimiento, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(p.dni, p.nombre, p.fecha_nacimiento || null, p.direccion || null, p.telefono || null, p.email || null);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-persona', (event, p) => {
    const stmt = db.prepare('UPDATE personas SET dni=?, nombre=?, fecha_nacimiento=?, direccion=?, telefono=?, email=? WHERE id=?');
    const info = stmt.run(p.dni, p.nombre, p.fecha_nacimiento || null, p.direccion || null, p.telefono || null, p.email || null, p.id);
    return info.changes;
  });

  ipcMain.handle('delete-persona', (event, id) => {
    return db.prepare('UPDATE personas SET activo = 0 WHERE id = ?').run(id).changes;
  });
}