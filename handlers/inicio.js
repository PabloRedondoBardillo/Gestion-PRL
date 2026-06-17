const { ipcMain } = require('electron');

module.exports = function(db, appState, dispararNotificacion) {
    ipcMain.handle('get-estadisticas', () => {
        if (!appState.empresaId){
        dispararNotificacion("No hay una empresa seleccionada", "error");
        return null;
    }

        const stats = {
            trabajadores: 0,
            medico: 0,
            epis: 0,
            mantenimientos: 0,
            inspecciones: 0
        };

        try {
            // 1. Total Trabajadores (Activos y no dados de baja)
            stats.trabajadores = db.prepare(`
                SELECT COUNT(*) as total FROM trabajadores 
                WHERE empresa = ? AND fecha_baja IS NULL AND activo = 1
            `).get(appState.empresaId).total;

            // 2. Riesgos Críticos (Nivel 'Alto')
            stats.riesgos = db.prepare(`
                SELECT COUNT(*) as total FROM riesgos_evaluacion r
                JOIN puestos_trabajo p ON r.puesto_trabajo = p.id
                JOIN secciones s ON p.seccion = s.id
                WHERE s.empresa = ? AND r.nivel_riesgo = 'Alto' AND r.activo = 1
            `).get(appState.empresaId).total;

            // 3. Investigaciones Abiertas (Cualquier estado que no sea 'cerrada')
            stats.investigaciones = db.prepare(`
                SELECT COUNT(*) as total FROM investigaciones i
                JOIN trabajadores t ON i.trabajador = t.id
                WHERE t.empresa = ? AND i.estado != 'cerrada' AND i.activo = 1
            `).get(appState.empresaId).total;

            // 4. Formaciones Vencidas (Fecha de validez anterior a hoy)
            stats.formaciones = db.prepare(`
                SELECT COUNT(*) as total FROM formacion f
                JOIN trabajadores t ON f.trabajador = t.id
                WHERE t.empresa = ? AND f.activo = 1
                AND f.fecha_validez < date('now')
            `).get(appState.empresaId).total;

            // 5. EPIs Vencidas (Fecha de caducidad anterior a hoy)
            stats.epis = db.prepare(`
                SELECT COUNT(*) as total FROM epis e
                JOIN trabajadores t ON e.trabajador = t.id
                WHERE t.empresa = ? AND e.activo = 1
                AND e.fecha_caducidad < date('now')
            `).get(appState.empresaId).total;

        } catch (error) {
            console.error("Error calculando estadísticas:", error);
        }

        return stats;
    });
}