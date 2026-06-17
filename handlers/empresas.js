const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-empresas', () => {
    const stmt = db.prepare('SELECT * FROM empresas WHERE activo = 1');
    return stmt.all();
  });

  ipcMain.handle('add-empresa', (event, empresa) => {
    const stmt = db.prepare('INSERT INTO empresas (cif, nombre, direccion, telefono, email) values (?, ?, ?, ?, ?)');
    const info = stmt.run(empresa.cif, empresa.nombre, empresa.direccion, empresa.telefono, empresa.email);
    return info.changes;
  });

  ipcMain.handle('update-empresa', (event, empresa) => {
    const stmt = db.prepare('UPDATE empresas SET cif = ?, nombre = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?');
    const info = stmt.run(empresa.cif, empresa.nombre, empresa.direccion, empresa.telefono, empresa.email, empresa.id);
    return info.changes;
  });

  ipcMain.handle('delete-empresa', (event, id) => {
    // Borrado lógico: la ocultamos en lugar de destruirla
    const stmt = db.prepare('UPDATE empresas SET activo = 0 WHERE id = ?');
    const info = stmt.run(id);
    
    // Opcional pero recomendado: Limpiamos la variable global del backend por seguridad
    if (appState.empresaId === id) appState.empresaId = null; 
    
    return info.changes;
  });
}