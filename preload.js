const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiPRL', {
  getEmpresas: () => ipcRenderer.invoke('get-empresas'),
  addEmpresa: (datos) => ipcRenderer.invoke('add-empresa', datos),
  setEmpresaActiva: (id) => ipcRenderer.invoke('set-empresa-activa', id),
  updateEmpresa: (datos) => ipcRenderer.invoke('update-empresa', datos),
  deleteEmpresa: (id) => ipcRenderer.invoke('delete-empresa', id),
  
  getEstadisiticas: () => ipcRenderer.invoke('get-estadisticas'),

  getSeccionesActuales: () => ipcRenderer.invoke('get-secciones-actuales'),
  getSeccionesAntiguos: () => ipcRenderer.invoke('get-secciones-antiguos'),
  addSeccion: (datos) => ipcRenderer.invoke('add-seccion', datos),
  updateSeccion: (datos) => ipcRenderer.invoke('update-seccion', datos),
  deleteSeccion: (id) => ipcRenderer.invoke('delete-seccion', id),

  getPuestosActuales: () => ipcRenderer.invoke('get-puestos-actuales'),
  getPuestosAntiguos: () => ipcRenderer.invoke('get-puestos-antiguos'),  
  addPuesto: (datos) => ipcRenderer.invoke('add-puesto', datos),
  updatePuesto: (datos) => ipcRenderer.invoke('update-puesto', datos),
  deletePuesto: (id) => ipcRenderer.invoke('delete-puesto', id),

  getPersonasActuales: () => ipcRenderer.invoke('get-personas-actuales'),
  getPersonasAntiguos: () => ipcRenderer.invoke('get-personas-antiguos'),
  addPersona: (datos) => ipcRenderer.invoke('add-persona', datos),
  updatePersona: (datos) => ipcRenderer.invoke('update-persona', datos),
  deletePersona: (id) => ipcRenderer.invoke('delete-persona', id),

  getTrabajadoresActuales: () => ipcRenderer.invoke('get-trabajadores-actuales'),
  getTrabajadoresAntiguos: () => ipcRenderer.invoke('get-trabajadores-antiguos'),
  addTrabajador: (datos) => ipcRenderer.invoke('add-trabajador', datos),
  updateTrabajador: (datos) => ipcRenderer.invoke('update-trabajador', datos),
  deleteTrabajador: (id) => ipcRenderer.invoke('delete-trabajador', id),

  getVigilanciaActuales: () => ipcRenderer.invoke('get-vigilancia-actuales'),
  getVigilanciaAntiguos: () => ipcRenderer.invoke('get-vigilancia-antiguos'),
  addVigilancia: (datos) => ipcRenderer.invoke('add-vigilancia', datos),
  updateVigilancia: (datos) => ipcRenderer.invoke('update-vigilancia', datos),
  deleteVigilancia: (id) => ipcRenderer.invoke('delete-vigilancia', id),

  getTiposFormacionActuales: () => ipcRenderer.invoke('get-tipos-formacion-actuales'),
  getTiposFormacionAntiguos: () => ipcRenderer.invoke('get-tipos-formacion-antiguos'),
  addTipoFormacion: (datos) => ipcRenderer.invoke('add-tipo-formacion', datos),
  updateTipoFormacion: (datos) => ipcRenderer.invoke('update-tipo-formacion', datos),
  deleteTipoFormacion: (id) => ipcRenderer.invoke('delete-tipo-formacion', id),

  getFormacionesActuales: () => ipcRenderer.invoke('get-formaciones-actuales'),
  getFormacionesAntiguos: () => ipcRenderer.invoke('get-formaciones-antiguos'),
  addFormacion: (datos) => ipcRenderer.invoke('add-formacion', datos),
  updateFormacion: (datos) => ipcRenderer.invoke('update-formacion', datos),
  deleteFormacion: (id) => ipcRenderer.invoke('delete-formacion', id),

  getRiesgosActuales: () => ipcRenderer.invoke('get-riesgos-actuales'),
  getRiesgosAntiguos: () => ipcRenderer.invoke('get-riesgos-antiguos'),
  addRiesgo: (datos) => ipcRenderer.invoke('add-riesgo', datos),
  updateRiesgo: (datos) => ipcRenderer.invoke('update-riesgo', datos),
  deleteRiesgo: (id) => ipcRenderer.invoke('delete-riesgo', id),

  getPlanesActuales: () => ipcRenderer.invoke('get-planes-actuales'),
  getPlanesAntiguos: () => ipcRenderer.invoke('get-planes-antiguos'),
  addPlan: (datos) => ipcRenderer.invoke('add-plan', datos),
  updatePlan: (datos) => ipcRenderer.invoke('update-plan', datos),
  deletePlan: (id) => ipcRenderer.invoke('delete-plan', id),

  getTiposEpisActuales: () => ipcRenderer.invoke('get-tipos-epi-actuales'),
  getTiposEpisAntiguos: () => ipcRenderer.invoke('get-tipos-epi-antiguos'),
  addTipoEpi: (datos) => ipcRenderer.invoke('add-tipo-epi', datos),
  updateTipoEpi: (datos) => ipcRenderer.invoke('update-tipo-epi', datos),
  deleteTipoEpi: (id) => ipcRenderer.invoke('delete-tipo-epi', id),

  getEpisActuales: () => ipcRenderer.invoke('get-epis-actuales'),
  getEpisAntiguos: () => ipcRenderer.invoke('get-epis-antiguos'),
  addEpi: (datos) => ipcRenderer.invoke('add-epi', datos),
  updateEpi: (datos) => ipcRenderer.invoke('update-epi', datos),
  deleteEpi: (id) => ipcRenderer.invoke('delete-epi', id),

  getInvestigacionesActuales: () => ipcRenderer.invoke('get-investigaciones-actuales'),
  getInvestigacionesAntiguos: () => ipcRenderer.invoke('get-investigaciones-antiguos'),
  addInvestigacion: (datos) => ipcRenderer.invoke('add-investigacion', datos),
  updateInvestigacion: (datos) => ipcRenderer.invoke('update-investigacion', datos),
  deleteInvestigacion: (id) => ipcRenderer.invoke('delete-investigacion', id),

  getEquiposActuales: () => ipcRenderer.invoke('get-equipos-actuales'),
  getEquiposAntiguos: () => ipcRenderer.invoke('get-equipos-antiguos'),
  addEquipo: (datos) => ipcRenderer.invoke('add-equipo', datos),
  updateEquipo: (datos) => ipcRenderer.invoke('update-equipo', datos),
  deleteEquipo: (id) => ipcRenderer.invoke('delete-equipo', id),

  getMantenimientosActuales: () => ipcRenderer.invoke('get-mantenimientos-actuales'),
  getMantenimientosAntiguos: () => ipcRenderer.invoke('get-mantenimientos-antiguos'),
  addMantenimiento: (datos) => ipcRenderer.invoke('add-mantenimiento', datos),
  updateMantenimiento: (datos) => ipcRenderer.invoke('update-mantenimiento', datos),
  deleteMantenimiento: (id) => ipcRenderer.invoke('delete-mantenimiento', id),

  getSimulacrosActuales: () => ipcRenderer.invoke('get-simulacros-actuales'),
  getSimulacrosAntiguos: () => ipcRenderer.invoke('get-simulacros-antiguos'),
  addSimulacro: (datos) => ipcRenderer.invoke('add-simulacro', datos),
  updateSimulacro: (datos) => ipcRenderer.invoke('update-simulacro', datos),
  deleteSimulacro: (id) => ipcRenderer.invoke('delete-simulacro', id),
  addParticipanteRapido: (datos) => ipcRenderer.invoke('add-participante-rapido', datos),

  getInspeccionesActuales: () => ipcRenderer.invoke('get-inspecciones-actuales'),
  getInspeccionesAntiguos: () => ipcRenderer.invoke('get-inspecciones-antiguos'),
  addInspeccion: (datos) => ipcRenderer.invoke('add-inspeccion', datos),
  updateInspeccion: (datos) => ipcRenderer.invoke('update-inspeccion', datos),
  deleteInspeccion: (id) => ipcRenderer.invoke('delete-inspeccion', id),

  getConsultasActuales: () => ipcRenderer.invoke('get-consultas-actuales'),
  getConsultasAntiguas: () => ipcRenderer.invoke('get-consultas-antiguas'),
  addConsulta: (datos) => ipcRenderer.invoke('add-consulta', datos),
  updateConsulta: (datos) => ipcRenderer.invoke('update-consulta', datos),
  deleteConsulta: (id) => ipcRenderer.invoke('delete-consulta', id),
  addConsultaParticipanteRapido: (datos) => ipcRenderer.invoke('add-consulta-participante-rapido', datos),

  getDocumentosActuales: () => ipcRenderer.invoke('get-documentos-actuales'),
  getDocumentosAntiguos: () => ipcRenderer.invoke('get-documentos-antiguos'),
  addDocumento: (datos) => ipcRenderer.invoke('add-documento', datos),
  updateDocumento: (datos) => ipcRenderer.invoke('update-documento', datos),
  deleteDocumento: (id) => ipcRenderer.invoke('delete-documento', id),

  getVersionesActuales: () => ipcRenderer.invoke('get-versiones-actuales'),
  getVersionesAntiguos: () => ipcRenderer.invoke('get-versiones-antiguos'),
  addVersion: (datos) => ipcRenderer.invoke('add-version', datos),
  updateVersion: (datos) => ipcRenderer.invoke('update-version', datos),
  deleteVersion: (id) => ipcRenderer.invoke('delete-version', id),

  onNotificacion: (callback) => ipcRenderer.on('mostrar-notificacion', (event, datos) => callback(datos))
});
