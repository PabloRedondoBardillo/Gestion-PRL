const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
  ipcMain.handle('get-trabajadores-actuales', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    const stmt = db.prepare(
      `SELECT DISTINCT P.nombre, P.dni, PT.nombre as puesto_trabajo, T.fecha_alta, T.fecha_baja, T.activo, T.observaciones, T.id 
      FROM trabajadores as T 
      JOIN personas as P ON T.persona = P.id 
      LEFT JOIN puestos_trabajo as PT ON T.puesto_trabajo = PT.id
      WHERE T.empresa = ? AND T.fecha_baja IS NULL`
    );
    return stmt.all(appState.empresaId);
  });

  ipcMain.handle('get-trabajadores-antiguos', () => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return [];
    }

    const stmt = db.prepare(
      `SELECT DISTINCT P.nombre, P.dni, PT.nombre as puesto_trabajo, T.fecha_alta, T.fecha_baja, T.activo, T.observaciones, T.id 
      FROM trabajadores as T 
      JOIN personas as P ON T.persona = P.id 
      LEFT JOIN puestos_trabajo as PT ON T.puesto_trabajo = PT.id
      WHERE T.empresa = ? AND T.fecha_baja IS NOT NULL`
    );
    return stmt.all(appState.empresaId);
  });

  ipcMain.handle('add-trabajador', (event, trabajador) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const transaction = db.transaction(()=> {
      let personaId;

      const personaExiste = db.prepare('SELECT id FROM personas WHERE dni = ?').get(trabajador.dni);
      
      if(personaExiste){
        personaId = personaExiste.id;
      } else {
        const stmtPersona = db.prepare('INSERT INTO personas (dni, nombre) VALUES (?, ?)');
        const infoPersona = stmtPersona.run(trabajador.dni, trabajador.nombre);

        personaId = infoPersona.lastInsertRowid;
      }

      const stmtTrabajador = db.prepare(
        `INSERT INTO trabajadores
        (empresa, persona, puesto_trabajo, fecha_alta, fecha_baja, activo, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      const infoTrabajador = stmtTrabajador.run(
        appState.empresaId,
        personaId,
        trabajador.puesto_trabajo,
        trabajador.fecha_alta,
        trabajador.fecha_baja,
        trabajador.activo,
        trabajador.observaciones
      );
      
      return infoTrabajador.lastInsertRowid;
    });  
    return transaction();
  });

  ipcMain.handle('update-trabajador', (event, trabajador) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const transaction = db.transaction(() => {
      const row = db.prepare('SELECT persona FROM trabajadores WHERE id = ?').get(trabajador.id);
      const personaId = row.persona;

      db.prepare(
        `UPDATE personas
        SET dni = ?, nombre = ?
        WHERE id = ?`
      ).run(trabajador.dni, trabajador.nombre, personaId);

      const stmtTrabajador = db.prepare(
        `UPDATE trabajadores
        SET puesto_trabajo = ?, fecha_alta = ?, fecha_baja = ?, activo = ?, observaciones = ?
        WHERE id = ?`      
      );

      const info = stmtTrabajador.run(
        trabajador.puesto_trabajo,
        trabajador.fecha_alta,
        trabajador.fecha_baja,
        trabajador.activo,
        trabajador.observaciones,
        trabajador.id
      );
      return info.changes;
    });
    return transaction();
  });

  ipcMain.handle('delete-trabajador', (event, id) => {
    if (!appState.empresaId){
      dispararNotificacion("No hay una empresa seleccionada", "error");
      return false;
    }

    const stmt = db.prepare(
      `UPDATE trabajadores
      SET activo = 0, fecha_baja = date('now')
      WHERE id = ?`
    );
    
    const info = stmt.run(id);
    return info.changes;
  });
}