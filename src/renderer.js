/**
 * =========================================================================
 * GESTIÓN PRL - CONTROLADOR PRINCIPAL (renderer.js)
 * Arquitectura modular para escalabilidad y mantenimiento.
 * =========================================================================
 */

// ==========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
const AppState = {
    vistaActiva: 'inicio',
    empresaActivaId: null
};

// ==========================================
// 2. CACHÉ DE ELEMENTOS DEL DOM GLOBAL
// ==========================================
const DOM = {
    layout: {
        contenedor: document.getElementById('contenedor-principal'),
        tituloCabecera: document.getElementById('titulo-cabecera'),
        navLinks: document.querySelectorAll('.nav-links li')
    },
    empresa: {
        btnAbrir: document.getElementById('empresa'),
        textoNombre: document.getElementById('nombre-empresa'),
        modal: document.getElementById('modal-empresa'),
        btnCerrar: document.getElementById('btn-cerrar-modal-empresa'),
        btnCancelar: document.getElementById('btn-cancelar-empresa'),
        select: document.getElementById('select-empresa'),
        btnSeleccionar: document.getElementById('btn-seleccionar-empresa'),
        formNueva: document.getElementById('form-nueva-empresa')
    }
};

// ==========================================
// 3. MÓDULO DE NAVEGACIÓN Y VISTAS
// ==========================================
const Navegacion = {
    init() {
        // Configurar los clics del menú lateral
        DOM.layout.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (link.classList.contains('active')) return;

                DOM.layout.navLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');

                DOM.layout.tituloCabecera.textContent = link.textContent;
                
                const vistaTarget = link.getAttribute('data-target');
                this.cargarVista(vistaTarget);
            });
        });

        // Arrancar la vista por defecto
        this.cargarVista('inicio');
    },

    async cargarVista(nombreVista) {
        AppState.vistaActiva = nombreVista;
        try {
            const respuesta = await fetch(`./vistas/${nombreVista}.html`);
            if (!respuesta.ok) throw new Error(`Vista no encontrada: ${nombreVista}`);
            
            const html = await respuesta.text();
            DOM.layout.contenedor.innerHTML = html;
            
            // Delegar la lógica al controlador específico de esa vista
            if (ControladoresVista[nombreVista]) {
                ControladoresVista[nombreVista].init();
            }

        } catch (error) {
            console.error("Error cargando la vista:", error);
            DOM.layout.contenedor.innerHTML = `
                <div class="error-vista">
                    <h2>En construcción</h2>
                    <p>La vista <b>${nombreVista}</b> aún no ha sido creada o tiene un error.</p>
                </div>`;
        }
    },

    recargarVistaActual() {
        this.cargarVista(AppState.vistaActiva);
    }
};

// ==========================================
// 4. MÓDULO DE GESTIÓN DE EMPRESAS (MODAL)
// ==========================================
const GestorEmpresas = {
    init() {
        // Eventos de apertura y cierre
        DOM.empresa.btnAbrir.addEventListener('click', () => this.abrirModal());
        DOM.empresa.btnCerrar.addEventListener('click', () => this.cerrarModal());
        DOM.empresa.btnCancelar.addEventListener('click', () => this.cerrarModal());
        
        DOM.empresa.modal.addEventListener('click', (e) => {
            if (e.target === DOM.empresa.modal) this.cerrarModal();
        });

        // Eventos de acción
        DOM.empresa.btnSeleccionar.addEventListener('click', () => this.seleccionarExistente());
        DOM.empresa.formNueva.addEventListener('submit', (e) => this.crearNueva(e));
    },

    async abrirModal() {
        try {
            const empresas = await window.apiPRL.getEmpresas();
            DOM.empresa.select.innerHTML = ''; 
            
            if (empresas.length === 0) {
                DOM.empresa.select.innerHTML = '<option value="" disabled selected>No hay empresas (crea una abajo)</option>';
                DOM.empresa.btnSeleccionar.disabled = true;
            } else {
                DOM.empresa.btnSeleccionar.disabled = false;
                empresas.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.id;
                    option.textContent = `${emp.nombre} (${emp.cif})`;
                    DOM.empresa.select.appendChild(option);
                });
            }
            DOM.empresa.modal.style.display = 'flex';
        } catch (error) {
            console.error('Error al cargar las empresas:', error);
        }
    },

    cerrarModal() {
        DOM.empresa.modal.style.display = 'none';
        DOM.empresa.formNueva.reset();
    },

    async seleccionarExistente() {
        const idSeleccionado = DOM.empresa.select.value;
        if (!idSeleccionado) return alert('Selecciona una empresa válida.');

        try {
            const empresaDatos = await window.apiPRL.setEmpresaActiva(idSeleccionado);
            AppState.empresaActivaId = idSeleccionado;
            DOM.empresa.textoNombre.textContent = empresaDatos.nombre;
            
            this.cerrarModal();
            Navegacion.recargarVistaActual();
        } catch (error) {
            console.error('Error al fijar la empresa activa:', error);
        }
    },

    async crearNueva(e) {
        e.preventDefault();
        const datosEmpresa = {
            cif: document.getElementById('emp-cif').value.trim(),
            nombre: document.getElementById('emp-nombre').value.trim(),
            direccion: document.getElementById('emp-direccion').value.trim(),
            telefono: document.getElementById('emp-telefono').value.trim(),
            email: document.getElementById('emp-email').value.trim()
        };

        try {
            const nuevoId = await window.apiPRL.addEmpresa(datosEmpresa);
            const empresaDatos = await window.apiPRL.setEmpresaActiva(nuevoId);
            
            AppState.empresaActivaId = nuevoId;
            DOM.empresa.textoNombre.textContent = empresaDatos.nombre;
            
            this.cerrarModal();
            Navegacion.recargarVistaActual();
        } catch (error) {
            console.error('Error al crear la empresa:', error);
            alert('Error al crear. Comprueba que el CIF no esté repetido en el sistema.');
        }
    }
};

// ==========================================
// 5. CONTROLADORES ESPECÍFICOS DE CADA VISTA
// ==========================================
// Aquí encapsulamos la lógica de cada pantalla. Al añadir una sección nueva, 
// solo tienes que crear su objeto aquí dentro.
const ControladoresVista = {
    
    inicio: {
        DOM: {},
        
        init() {
            this.DOM = {
                btnEditar: document.getElementById('btn-editar-empresa'),
                btnEliminar: document.getElementById('btn-eliminar-empresa'),
                modal: document.getElementById('modal-editar-empresa'),
                btnCerrar: document.getElementById('btn-cerrar-editar-empresa'),
                btnCancelar: document.getElementById('btn-cancelar-editar-empresa'),
                form: document.getElementById('form-editar-empresa'),
                panelStats: document.getElementById('panel-estadisticas'),
                mensajeVacio: document.getElementById('mensaje-no-empresa')
            };

            // Eventos
            if(this.DOM.btnEditar) this.DOM.btnEditar.addEventListener('click', () => this.abrirModal());
            if(this.DOM.btnCerrar) this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            if(this.DOM.btnCancelar) this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            if(this.DOM.form) this.DOM.form.addEventListener('submit', (e) => this.guardarCambios(e));
            if(this.DOM.btnEliminar) this.DOM.btnEliminar.addEventListener('click', () => this.eliminarEmpresa());

            this.comprobarEstadoBotones();
            this.cargarEstadisticas();
        },

        comprobarEstadoBotones() {
            // Si no hay empresa activa, bloqueamos los botones para evitar errores
            const hayEmpresa = AppState.empresaActivaId !== null;
            if (this.DOM.btnEditar) this.DOM.btnEditar.disabled = !hayEmpresa;
            if (this.DOM.btnEliminar) this.DOM.btnEliminar.disabled = !hayEmpresa;
        },

        async cargarEstadisticas() {
            if (!AppState.empresaActivaId) return;

            try {
                // LLamada al puente usando exactamente el nombre expuesto en preload.js
                const stats = await window.apiPRL.getEstadisticas(); 
                
                if (stats) {
                    document.getElementById('stat-trabajadores').textContent = stats.trabajadores;
                    document.getElementById('stat-riesgos').textContent = stats.riesgos;
                    document.getElementById('stat-investigaciones').textContent = stats.investigaciones;
                    document.getElementById('stat-formaciones').textContent = stats.formaciones;
                    document.getElementById('stat-epis').textContent = stats.epis;
                }
            } catch (error) {
                console.error("Error al cargar el dashboard:", error);
            }
        },

        async abrirModal() {
            if (!AppState.empresaActivaId) return;
            try {
                // Recuperamos los datos de la base de datos
                const empresa = await window.apiPRL.setEmpresaActiva(AppState.empresaActivaId);
                
                document.getElementById('edit-emp-cif').value = empresa.cif;
                document.getElementById('edit-emp-nombre').value = empresa.nombre;
                document.getElementById('edit-emp-direccion').value = empresa.direccion || '';
                document.getElementById('edit-emp-telefono').value = empresa.telefono || '';
                document.getElementById('edit-emp-email').value = empresa.email || '';

                this.DOM.modal.classList.add('active');
            } catch (err) { console.error(err); }
        },

        cerrarModal() {
            this.DOM.modal.classList.remove('active');
        },

        async guardarCambios(e) {
            e.preventDefault();
            const datos = {
                id: AppState.empresaActivaId,
                cif: document.getElementById('edit-emp-cif').value.trim(),
                nombre: document.getElementById('edit-emp-nombre').value.trim(),
                direccion: document.getElementById('edit-emp-direccion').value.trim(),
                telefono: document.getElementById('edit-emp-telefono').value.trim(),
                email: document.getElementById('edit-emp-email').value.trim()
            };

            try {
                await window.apiPRL.updateEmpresa(datos);
                if(typeof Notificador !== 'undefined') Notificador.mostrar('Datos de la empresa actualizados', 'success');
                
                // Actualizamos el nombre en la cabecera en tiempo real
                const textoNombreGlobal = document.getElementById('nombre-empresa');
                if (textoNombreGlobal) textoNombreGlobal.textContent = datos.nombre;
                
                this.cerrarModal();
            } catch (err) {
                console.error(err);
                if(typeof Notificador !== 'undefined') Notificador.mostrar('Error al actualizar. ¿CIF duplicado?', 'error');
            }
        },

        async eliminarEmpresa() {
            if (!AppState.empresaActivaId) return;
            
            if (confirm('⚠️ ATENCIÓN: Esta acción archivará la empresa y ya no podrás acceder a sus datos. ¿Deseas continuar?')) {
                try {
                    await window.apiPRL.deleteEmpresa(AppState.empresaActivaId);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Empresa archivada correctamente', 'success');

                    // 1. Limpiamos el estado global
                    AppState.empresaActivaId = null;
                    const textoNombreGlobal = document.getElementById('nombre-empresa');
                    if (textoNombreGlobal) textoNombreGlobal.textContent = 'Ninguna empresa seleccionada';

                    // 2. Refrescamos la vista para bloquear los botones
                    this.comprobarEstadoBotones();

                    // 3. Forzamos que se abra el selector de empresas para elegir otra
                    if (typeof GestorEmpresas !== 'undefined') {
                        GestorEmpresas.abrirModal();
                    }

                } catch (err) {
                    console.error(err);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Error al archivar la empresa', 'error');
                }
            }
        }
    },
    secciones: {
        DOM: {},
        
        init() {
            // Mapear el DOM
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-seccion'),
                modal: document.getElementById('modal-nueva-seccion'),
                btnCerrar: document.getElementById('btn-cerrar-modal-seccion'),
                btnCancelar: document.getElementById('btn-cancelar-seccion'),
                form: document.getElementById('form-seccion'),
                tbody: document.getElementById('lista-secciones')
            };

            // Asignar eventos
            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarSeccion(e));

            // Carga inicial
            this.recargarTabla();
        },

        abrirModal(seccion = null) {
            const tituloModal = document.querySelector('#modal-nueva-seccion .modal__header h2');
            
            if (seccion) {
                tituloModal.textContent = 'Editar Sección';
                document.getElementById('form-seccion-id').value = seccion.id;
                document.getElementById('form-seccion-nombre').value = seccion.nombre;
            } else {
                tituloModal.textContent = 'Alta de Nueva Sección';
                this.DOM.form.reset();
                document.getElementById('form-seccion-id').value = '';
            }
            
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() {
            this.DOM.modal.classList.remove('active');
        },

        async recargarTabla() {
            if (!this.DOM.tbody) return; 

            try {
                const secciones = await window.apiPRL.getSeccionesActuales();
                this.DOM.tbody.innerHTML = ''; 
                
                secciones.forEach(s => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${s.nombre}</strong></td>
                        <td class="cell-actions">
                            <button class="btn btn--primary class-hook-editar" data-id="${s.id}">Editar</button>
                            <button class="btn btn--danger class-hook-eliminar" data-id="${s.id}">X</button>
                        </td>
                    `;
                    this.DOM.tbody.appendChild(tr);
                });

                this.asignarEventosTabla(secciones);
            } catch (error) {
                console.error("Error al recargar secciones:", error);
            }
        },

        asignarEventosTabla(secciones) {
            document.querySelectorAll('#lista-secciones .class-hook-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const seccion = secciones.find(s => s.id == id);
                    this.abrirModal(seccion);
                });
            });

            document.querySelectorAll('#lista-secciones .class-hook-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('⚠️ ¿Seguro que deseas borrar esta sección? ATENCIÓN: Se eliminarán automáticamente todos los Puestos de Trabajo asociados a ella.')) {
                        await window.apiPRL.deleteSeccion(id);
                        if(typeof Notificador !== 'undefined') Notificador.mostrar('Sección eliminada con éxito', 'success');
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarSeccion(e) {
            e.preventDefault();
            const id = document.getElementById('form-seccion-id').value;
            const datos = { 
                nombre: document.getElementById('form-seccion-nombre').value.trim() 
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updateSeccion(datos);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Sección actualizada', 'success');
                } else {
                    await window.apiPRL.addSeccion(datos);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Sección creada', 'success');
                }
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (error) {
                console.error(error);
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Error al guardar la sección", 'error');
            }
        }
    },
    puestos: {
        DOM: {},
        
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-puesto'),
                modal: document.getElementById('modal-nuevo-puesto'),
                btnCerrar: document.getElementById('btn-cerrar-modal-puesto'),
                btnCancelar: document.getElementById('btn-cancelar-puesto'),
                form: document.getElementById('form-puesto'),
                tbody: document.getElementById('lista-puestos')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarPuesto(e));

            this.recargarTabla();
        },

        async abrirModal(puesto = null) {
            const tituloModal = document.querySelector('#modal-nuevo-puesto .modal__header h2');
            const selectSeccion = document.getElementById('form-puesto-seccion');

            // 1. Cargar las secciones de la empresa para el desplegable
            try {
                const secciones = await window.apiPRL.getSeccionesActuales();
                selectSeccion.innerHTML = '';
                
                if (secciones.length === 0) {
                    selectSeccion.innerHTML = '<option value="" disabled selected>⚠️ Crea primero una Sección en su pestaña</option>';
                } else {
                    secciones.forEach(s => {
                        const option = document.createElement('option');
                        option.value = s.id;
                        option.textContent = s.nombre;
                        selectSeccion.appendChild(option);
                    });
                }
            } catch (err) { 
                console.error(err); 
            }

            // 2. Rellenar formulario
            if (puesto) {
                tituloModal.textContent = 'Editar Puesto';
                document.getElementById('form-puesto-id').value = puesto.id;
                document.getElementById('form-puesto-seccion').value = puesto.seccion;
                document.getElementById('form-puesto-nombre').value = puesto.nombre;
                document.getElementById('form-puesto-descripcion').value = puesto.descripcion || '';
                document.getElementById('form-puesto-riesgos').value = puesto.riesgos_asociados || '';
            } else {
                tituloModal.textContent = 'Alta de Nuevo Puesto';
                this.DOM.form.reset();
                document.getElementById('form-puesto-id').value = '';
            }
            
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() {
            this.DOM.modal.classList.remove('active');
        },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            
            try {
                // Usamos la consulta unificada que trae seccion_nombre
                const puestos = await window.apiPRL.getPuestosActuales(); 
                this.DOM.tbody.innerHTML = ''; 
                
                puestos.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${p.nombre}</strong></td>
                        <td><span style="background: #e1f0fa; color: #2980b9; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">${p.seccion_nombre}</span></td>
                        <td class="cell-wrap">${p.descripcion || '-'}</td>
                        <td class="cell-wrap" style="color: #c0392b;">${p.riesgos_asociados || '-'}</td>
                        <td class="cell-actions">
                            <button class="btn btn--primary class-hook-editar" data-id="${p.id}">Editar</button>
                            <button class="btn btn--danger class-hook-eliminar" data-id="${p.id}">X</button>
                        </td>
                    `;
                    this.DOM.tbody.appendChild(tr);
                });

                this.asignarEventosTabla(puestos);
            } catch (error) {
                console.error("Error al recargar puestos:", error);
            }
        },

        asignarEventosTabla(puestos) {
            document.querySelectorAll('#lista-puestos .class-hook-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const puesto = puestos.find(p => p.id == id);
                    this.abrirModal(puesto);
                });
            });

            document.querySelectorAll('#lista-puestos .class-hook-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('¿Seguro que deseas eliminar este puesto de trabajo?')) {
                        await window.apiPRL.deletePuesto(id);
                        if(typeof Notificador !== 'undefined') Notificador.mostrar('Puesto eliminado con éxito', 'success');
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarPuesto(e) {
            e.preventDefault();
            const id = document.getElementById('form-puesto-id').value;
            const datos = {
                seccion: document.getElementById('form-puesto-seccion').value,
                nombre: document.getElementById('form-puesto-nombre').value.trim(),
                descripcion: document.getElementById('form-puesto-descripcion').value.trim(),
                riesgos_asociados: document.getElementById('form-puesto-riesgos').value.trim()
            };
            
            // Validación de seguridad para que no creen un puesto sin sección
            if (!datos.seccion) {
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Debes seleccionar una sección", 'error');
                return;
            }

            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updatePuesto(datos);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Puesto actualizado', 'success');
                } else {
                    await window.apiPRL.addPuesto(datos);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Puesto creado', 'success');
                }
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (error) {
                console.error(error);
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Error al guardar el puesto", 'error');
            }
        }
    },
    personas: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-persona'),
                modal: document.getElementById('modal-nueva-persona'),
                btnCerrar: document.getElementById('btn-cerrar-modal-persona'),
                btnCancelar: document.getElementById('btn-cancelar-persona'),
                form: document.getElementById('form-persona'),
                tbody: document.getElementById('lista-personas')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarPersona(e));

            this.recargarTabla();
        },

        abrirModal(persona = null) {
            const tituloModal = document.querySelector('#modal-nueva-persona .modal__header h2');
            
            if (persona) {
                tituloModal.textContent = 'Editar Persona';
                document.getElementById('form-persona-id').value = persona.id;
                document.getElementById('form-persona-dni').value = persona.dni;
                document.getElementById('form-persona-nombre').value = persona.nombre;
                document.getElementById('form-persona-fecha').value = persona.fecha_nacimiento || '';
                document.getElementById('form-persona-telefono').value = persona.telefono || '';
                document.getElementById('form-persona-email').value = persona.email || '';
                document.getElementById('form-persona-direccion').value = persona.direccion || '';
            } else {
                tituloModal.textContent = 'Alta de Nueva Persona';
                this.DOM.form.reset();
                document.getElementById('form-persona-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return; 
            try {
                const personas = await window.apiPRL.getPersonasActuales();
                this.DOM.tbody.innerHTML = ''; 
                personas.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${p.dni}</strong></td>
                        <td>${p.nombre}</td>
                        <td>${p.telefono || '-'}</td>
                        <td>${p.email || '-'}</td>
                        <td class="cell-actions">
                            <button class="btn btn--primary class-hook-editar" data-id="${p.id}">Editar</button>
                            <button class="btn btn--danger class-hook-eliminar" data-id="${p.id}">X</button>
                        </td>
                    `;
                    this.DOM.tbody.appendChild(tr);
                });
                this.asignarEventosTabla(personas);
            } catch (error) { console.error(error); }
        },

        asignarEventosTabla(personas) {
            document.querySelectorAll('#lista-personas .class-hook-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.abrirModal(personas.find(p => p.id == e.currentTarget.getAttribute('data-id')));
                });
            });
            document.querySelectorAll('#lista-personas .class-hook-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm(`¿Archivar esta persona del sistema global?`)) {
                        await window.apiPRL.deletePersona(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarPersona(e) {
            e.preventDefault();
            const id = document.getElementById('form-persona-id').value;
            const datos = {
                dni: document.getElementById('form-persona-dni').value.trim(),
                nombre: document.getElementById('form-persona-nombre').value.trim(),
                fecha_nacimiento: document.getElementById('form-persona-fecha').value || null,
                telefono: document.getElementById('form-persona-telefono').value.trim() || null,
                email: document.getElementById('form-persona-email').value.trim() || null,
                direccion: document.getElementById('form-persona-direccion').value.trim() || null
            };
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updatePersona(datos);
                } else {
                    await window.apiPRL.addPersona(datos);
                }
                this.cerrarModal();
                this.recargarTabla();
            } catch (error) {
                console.error(error);
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Error. ¿DNI duplicado?", 'error');
            }
        }
    },
    trabajadores: {
        DOM: {},
        
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-trabajador'),
                modal: document.getElementById('modal-nuevo-trabajador'),
                btnCerrar: document.getElementById('btn-cerrar-modal'),
                btnCancelar: document.getElementById('btn-cancelar-modal'),
                form: document.getElementById('form-trabajador'),
                tbody: document.getElementById('lista-trabajadores')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarTrabajador(e));
             
            // --- NUEVO: Lógica de bloqueo de inputs según la Persona elegida ---
            const selectPersona = document.getElementById('form-persona-select');
            const inputNombre = document.getElementById('form-nombre');
            const inputDni = document.getElementById('form-dni');

            if (selectPersona) {
                selectPersona.addEventListener('change', (e) => {
                    if (e.target.value === 'nueva') {
                        // Desbloqueamos para escribir una nueva
                        inputNombre.value = '';
                        inputDni.value = '';
                        inputNombre.readOnly = false;
                        inputDni.readOnly = false;
                        inputNombre.style.backgroundColor = '#fff';
                        inputDni.style.backgroundColor = '#fff';
                    } else {
                        // Bloqueamos y rellenamos con la persona existente
                        const selectedOption = e.target.options[e.target.selectedIndex];
                        inputNombre.value = selectedOption.dataset.nombre;
                        inputDni.value = selectedOption.dataset.dni;
                        inputNombre.readOnly = true;
                        inputDni.readOnly = true;
                        inputNombre.style.backgroundColor = '#f0f0f0';
                        inputDni.style.backgroundColor = '#f0f0f0';
                    }
                });
            }
            // ------------------------------------------------------------------

            this.recargarTabla();
        },

        async abrirModal(trabajador = null) {
            const tituloModal = document.querySelector('#modal-nuevo-trabajador .modal__header h2');
            const btnSubmit = document.querySelector('#modal-nuevo-trabajador .modal__footer .btn--primary');
            const selectPuesto = document.getElementById('form-puesto');
            const selectPersona = document.getElementById('form-persona-select');
            
            // 1. Cargar Puestos
            try {
                const puestos = await window.apiPRL.getPuestosActuales();
                selectPuesto.innerHTML = ''; 
                
                if (!puestos || puestos.length === 0) {
                    selectPuesto.innerHTML = '<option value="" disabled selected>⚠️ Crea primero un Puesto en su pestaña</option>';
                } else {
                    puestos.forEach(p => {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = `${p.nombre} (${p.seccion_nombre})`;
                        selectPuesto.appendChild(option);
                    });
                }
            } catch (error) {
                console.error("Error al cargar puestos:", error);
            }

            // 2. Cargar Personas (NUEVO)
            if (selectPersona) {
                try {
                    const personas = await window.apiPRL.getPersonasActuales();
                    selectPersona.innerHTML = '<option value="nueva">✨ -- Crear Nueva Persona --</option>';
                    
                    if (personas) {
                        personas.forEach(p => {
                            const option = document.createElement('option');
                            option.value = p.id;
                            option.textContent = `${p.dni} - ${p.nombre}`;
                            option.dataset.nombre = p.nombre;
                            option.dataset.dni = p.dni;
                            selectPersona.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error("Error al cargar personas:", error);
                }
            }

            // 3. Rellenar formulario
            if (trabajador) {
                tituloModal.textContent = 'Editar Trabajador';
                if(btnSubmit) btnSubmit.textContent = 'Guardar Cambios';
                
                document.getElementById('form-id').value = trabajador.id;
                document.getElementById('form-nombre').value = trabajador.nombre;
                document.getElementById('form-dni').value = trabajador.dni;
                if (trabajador.puesto_trabajo) selectPuesto.value = trabajador.puesto_trabajo; 
                document.getElementById('form-fecha-alta').value = trabajador.fecha_alta || '';
                document.getElementById('form-fecha-baja').value = trabajador.fecha_baja || '';
                document.getElementById('form-activo').value = trabajador.activo !== undefined ? trabajador.activo : '1';
                document.getElementById('form-observaciones').value = trabajador.observaciones || '';

                // Autoseleccionar la persona y bloquear inputs si es edición (NUEVO)
                if (selectPersona) {
                    const option = Array.from(selectPersona.options).find(opt => opt.dataset.dni === trabajador.dni);
                    if (option) {
                        selectPersona.value = option.value;
                        const inputNombre = document.getElementById('form-nombre');
                        const inputDni = document.getElementById('form-dni');
                        inputNombre.readOnly = true;
                        inputDni.readOnly = true;
                        inputNombre.style.backgroundColor = '#f0f0f0';
                        inputDni.style.backgroundColor = '#f0f0f0';
                    }
                }

            } else {
                tituloModal.textContent = 'Alta de Nuevo Trabajador';
                if(btnSubmit) btnSubmit.textContent = 'Guardar Trabajador';
                this.DOM.form.reset();
                document.getElementById('form-id').value = '';

                // Resetear el selector de personas a "Nueva" y desbloquear inputs (NUEVO)
                if (selectPersona) {
                    selectPersona.value = 'nueva';
                    document.getElementById('form-nombre').readOnly = false;
                    document.getElementById('form-dni').readOnly = false;
                    document.getElementById('form-nombre').style.backgroundColor = '#fff';
                    document.getElementById('form-dni').style.backgroundColor = '#fff';
                }
            }
            
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() {
            this.DOM.modal.classList.remove('active');
        },

        async recargarTabla() {
            if (!this.DOM.tbody) return; 

            try {
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                this.DOM.tbody.innerHTML = ''; 
                
                if (!trabajadores) return;

                trabajadores.forEach(t => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${t.nombre}</td>
                        <td>${t.dni}</td>
                        <td>${t.puesto_trabajo || '-'}</td>
                        <td>${t.fecha_alta || '-'}</td>
                        <td>${t.fecha_baja || '-'}</td>
                        <td>${t.activo == 1 ? 'Sí' : 'No'}</td>
                        <td class="cell-wrap">${t.observaciones || ''}</td>
                        <td class="cell-actions">
                            <button class="btn btn--primary class-hook-editar" data-id="${t.id}">Editar</button>
                            <button class="btn btn--danger class-hook-eliminar" data-id="${t.id}">X</button>
                        </td>
                    `;
                    this.DOM.tbody.appendChild(tr);
                });

                this.asignarEventosTabla(trabajadores);

            } catch (error) {
                console.error("Error al recargar trabajadores:", error);
            }
        },

        asignarEventosTabla(trabajadores) {
            document.querySelectorAll('#lista-trabajadores .class-hook-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const trabajador = trabajadores.find(tr => tr.id == id);
                    this.abrirModal(trabajador);
                });
            });

            document.querySelectorAll('#lista-trabajadores .class-hook-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm(`¿Desea dar de baja al trabajador con ID ${id}?`)) {
                        await window.apiPRL.deleteTrabajador(id);
                        if(typeof Notificador !== 'undefined') Notificador.mostrar('Trabajador dado de baja', 'success');
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarTrabajador(e) {
            e.preventDefault();
            const id = document.getElementById('form-id').value;
            const selectPuesto = document.getElementById('form-puesto');
            
            if (!selectPuesto.value) {
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Debes seleccionar un puesto", 'warning');
                return;
            }

            const datos = {
                nombre: document.getElementById('form-nombre').value.trim(),
                dni: document.getElementById('form-dni').value.trim(),
                puesto_trabajo: selectPuesto.value,
                fecha_alta: document.getElementById('form-fecha-alta').value || null,
                fecha_baja: document.getElementById('form-fecha-baja').value || null,
                activo: document.getElementById('form-activo').value || null,
                observaciones: document.getElementById('form-observaciones').value.trim() || null
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updateTrabajador(datos);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Trabajador actualizado', 'success');
                } else {
                    await window.apiPRL.addTrabajador(datos);
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Trabajador creado', 'success');
                }

                this.cerrarModal();
                this.recargarTabla();
            } catch (error) {
                console.error("Error al guardar trabajador:", error);
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Hubo un error al guardar", 'error');
            }
        }
    },
    vigilancia_salud: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-examen'),
                modal: document.getElementById('modal-vigilancia'),
                btnCerrar: document.getElementById('btn-cerrar-vigilancia'),
                form: document.getElementById('form-vigilancia'),
                tbody: document.getElementById('lista-vigilancia')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarVigilancia(e));

            this.recargarTabla();
        },

        async abrirModal(registro = null) {
            const selectTra = document.getElementById('form-vigilancia-trabajador');

            try {
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                selectTra.innerHTML = '<option value="" disabled selected>-- Elige Trabajador --</option>';
                if (trabajadores) {
                    trabajadores.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = `${t.nombre} (${t.dni})`;
                        selectTra.appendChild(opt);
                    });
                }
            } catch (err) { console.error(err); }

            if (registro) {
                document.getElementById('form-vigilancia-id').value = registro.id;
                selectTra.value = registro.trabajador;
                document.getElementById('form-vigilancia-fecha').value = registro.fecha_examen;
                document.getElementById('form-vigilancia-tipo').value = registro.tipo;
                document.getElementById('form-vigilancia-resultado').value = registro.resultado;
                document.getElementById('form-vigilancia-apto').value = registro.apto !== undefined ? registro.apto : '1';
                document.getElementById('form-vigilancia-proxima').value = registro.proxima_fecha || '';
                document.getElementById('form-vigilancia-observaciones').value = registro.observaciones || '';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-vigilancia-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const registros = await window.apiPRL.getVigilanciaActuales();
                this.DOM.tbody.innerHTML = '';
                
                if (registros) {
                    registros.forEach(r => {
                        const tr = document.createElement('tr');
                        const hoy = new Date();
                        const proxima = r.proxima_fecha ? new Date(r.proxima_fecha) : null;
                        const esCaducado = proxima && proxima < hoy;

                        // Estilo según el resultado de aptitud
                        let badgeColor = '#27ae60'; // Apto
                        if (r.resultado.includes('restricciones')) badgeColor = '#f39c12';
                        if (r.resultado.includes('No apto')) badgeColor = '#c0392b';

                        tr.innerHTML = `
                            <td><strong>${r.trabajador_nombre}</strong> <small>(${r.dni})</small></td>
                            <td>${r.fecha_examen}</td>
                            <td>${r.tipo}</td>
                            <td><span style="color: ${badgeColor}; font-weight: bold;">${r.resultado}</span></td>
                            <td style="${esCaducado ? 'color:#c0392b; font-weight:bold;' : ''}">
                                ${r.proxima_fecha || 'No requerida'} ${esCaducado ? '⚠️ (Vencido)' : ''}
                            </td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-vigilancia" data-id="${r.id}">Editar</button>
                                <button class="btn btn--danger hook-del-vigilancia" data-id="${r.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-vigilancia').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const registros = await window.apiPRL.getVigilanciaActuales();
                    this.abrirModal(registros.find(r => r.id == id));
                });
            });

            document.querySelectorAll('.hook-del-vigilancia').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Archivar este registro de control médico?')) {
                        await window.apiPRL.deleteVigilancia(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarVigilancia(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-vigilancia-id').value,
                trabajador: document.getElementById('form-vigilancia-trabajador').value,
                fecha_examen: document.getElementById('form-vigilancia-fecha').value,
                tipo: document.getElementById('form-vigilancia-tipo').value,
                resultado: document.getElementById('form-vigilancia-resultado').value,
                apto: parseInt(document.getElementById('form-vigilancia-apto').value),
                proxima_fecha: document.getElementById('form-vigilancia-proxima').value || null,
                observaciones: document.getElementById('form-vigilancia-observaciones').value.trim() || null
            };

            try {
                if (datos.id) await window.apiPRL.updateVigilancia(datos);
                else await window.apiPRL.addVigilancia(datos);

                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    catalogo_cursos: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-tipo'),
                modal: document.getElementById('modal-tipo-formacion'),
                btnCerrar: document.getElementById('btn-cerrar-tipo'),
                form: document.getElementById('form-tipo-formacion'),
                tbody: document.getElementById('lista-tipos-formacion')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarTipo(e));

            this.recargarTabla();
        },

        abrirModal(tipo = null) {
            const titulo = document.querySelector('#modal-tipo-formacion .modal__header h2');
            if (tipo) {
                titulo.textContent = 'Editar Curso';
                document.getElementById('form-tipo-id').value = tipo.id;
                document.getElementById('form-tipo-nombre').value = tipo.nombre;
                document.getElementById('form-tipo-entidad').value = tipo.entidad || '';
                document.getElementById('form-tipo-validez').value = tipo.anos_validez;
                document.getElementById('form-tipo-descripcion').value = tipo.descripcion || '';
            } else {
                titulo.textContent = 'Añadir Curso al Catálogo';
                this.DOM.form.reset();
                document.getElementById('form-tipo-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const tipos = await window.apiPRL.getTiposFormacionActuales();
                this.DOM.tbody.innerHTML = '';
                if(tipos) {
                    tipos.forEach(t => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${t.nombre}</strong></td>
                            <td>${t.entidad || '-'}</td>
                            <td>${t.anos_validez === 0 ? 'Sin caducidad' : t.anos_validez + ' años'}</td>
                            <td>${t.descripcion || '-'}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-tipo" data-id="${t.id}">Editar</button>
                                <button class="btn btn--danger hook-del-tipo" data-id="${t.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-tipo').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const tipos = await window.apiPRL.getTiposFormacionActuales();
                    this.abrirModal(tipos.find(t => t.id == id));
                });
            });
            document.querySelectorAll('.hook-del-tipo').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Eliminar este curso del catálogo global?')) {
                        await window.apiPRL.deleteTipoFormacion(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarTipo(e) {
            e.preventDefault();
            const id = document.getElementById('form-tipo-id').value;
            const datos = {
                nombre: document.getElementById('form-tipo-nombre').value.trim(),
                entidad: document.getElementById('form-tipo-entidad').value.trim() || null,
                anos_validez: parseInt(document.getElementById('form-tipo-validez').value),
                descripcion: document.getElementById('form-tipo-descripcion').value.trim() || null
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updateTipoFormacion(datos);
                } else {
                    await window.apiPRL.addTipoFormacion(datos);
                }
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },

    registro_formacion: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-formacion'),
                modal: document.getElementById('modal-formacion'),
                btnCerrar: document.getElementById('btn-cerrar-formacion'),
                form: document.getElementById('form-formacion'),
                tbody: document.getElementById('lista-formaciones')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarFormacion(e));

            // Cálculo automático de caducidad
            const selectCurso = document.getElementById('form-formacion-curso');
            const inputFecha = document.getElementById('form-formacion-fecha');
            const inputCaducidad = document.getElementById('form-formacion-caducidad');

            const calcularCaducidad = () => {
                if (!selectCurso.value || !inputFecha.value) return;
                const opt = selectCurso.options[selectCurso.selectedIndex];
                const anos = parseInt(opt.dataset.validez || 0);
                if (anos > 0) {
                    const d = new Date(inputFecha.value);
                    d.setFullYear(d.getFullYear() + anos);
                    inputCaducidad.value = d.toISOString().split('T')[0];
                } else {
                    inputCaducidad.value = ''; 
                }
            };
            selectCurso.addEventListener('change', calcularCaducidad);
            inputFecha.addEventListener('change', calcularCaducidad);

            this.recargarTabla();
        },

        async abrirModal(formacion = null) {
            const selectTra = document.getElementById('form-formacion-trabajador');
            const selectCur = document.getElementById('form-formacion-curso');

            try {
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                selectTra.innerHTML = '<option value="" disabled selected>-- Elige Trabajador --</option>';
                if(trabajadores) trabajadores.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `${t.nombre} (${t.dni})`;
                    selectTra.appendChild(opt);
                });

                const cursos = await window.apiPRL.getTiposFormacionActuales();
                selectCur.innerHTML = '<option value="" disabled selected>-- Elige Curso --</option>';
                if(cursos) cursos.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.nombre;
                    opt.dataset.validez = c.anos_validez;
                    selectCur.appendChild(opt);
                });
            } catch(err) { console.error(err); }

            if (formacion) {
                document.getElementById('form-formacion-id').value = formacion.id;
                selectTra.value = formacion.trabajador;
                selectCur.value = formacion.tipo_formacion;
                document.getElementById('form-formacion-fecha').value = formacion.fecha_realizacion;
                document.getElementById('form-formacion-caducidad').value = formacion.fecha_validez || '';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-formacion-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const formaciones = await window.apiPRL.getFormacionesActuales();
                this.DOM.tbody.innerHTML = '';
                if(formaciones) {
                    formaciones.forEach(f => {
                        const tr = document.createElement('tr');
                        const hoy = new Date();
                        const caduca = f.fecha_validez ? new Date(f.fecha_validez) : null;
                        const esCaducado = caduca && caduca < hoy;

                        tr.innerHTML = `
                            <td><strong>${f.trabajador_nombre}</strong> <small>(${f.dni})</small></td>
                            <td>${f.curso_nombre}</td>
                            <td>${f.fecha_realizacion}</td>
                            <td style="${esCaducado ? 'color:#c0392b;font-weight:bold;' : ''}">
                                ${f.fecha_validez || 'No caduca'} ${esCaducado ? '⚠️' : ''}
                            </td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-form" data-id="${f.id}">Editar</button>
                                <button class="btn btn--danger hook-del-form" data-id="${f.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-form').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const forms = await window.apiPRL.getFormacionesActuales();
                    this.abrirModal(forms.find(f => f.id == id));
                });
            });
            document.querySelectorAll('.hook-del-form').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Borrar el registro de formación?')) {
                        await window.apiPRL.deleteFormacion(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarFormacion(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-formacion-id').value,
                trabajador: document.getElementById('form-formacion-trabajador').value,
                tipo_formacion: document.getElementById('form-formacion-curso').value,
                fecha_realizacion: document.getElementById('form-formacion-fecha').value,
                fecha_validez: document.getElementById('form-formacion-caducidad').value || null
            };
            
            try {
                if (datos.id) await window.apiPRL.updateFormacion(datos);
                else await window.apiPRL.addFormacion(datos);
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    riesgos: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-riesgo'),
                modal: document.getElementById('modal-nuevo-riesgo'),
                btnCerrar: document.getElementById('btn-cerrar-modal-riesgo'),
                btnCancelar: document.getElementById('btn-cancelar-riesgo'),
                form: document.getElementById('form-riesgo'),
                tbody: document.getElementById('lista-riesgos')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarRiesgo(e));

            this.recargarTabla();
        },

        async abrirModal(riesgo = null) {
            const tituloModal = document.querySelector('#modal-nuevo-riesgo .modal__header h2');
            const selectPuesto = document.getElementById('form-riesgo-puesto');

            try {
                const puestos = await window.apiPRL.getPuestosActuales();
                selectPuesto.innerHTML = ''; 
                if (!puestos || puestos.length === 0) {
                    selectPuesto.innerHTML = '<option value="" disabled selected>⚠️ Crea primero un Puesto de Trabajo</option>';
                } else {
                    puestos.forEach(p => {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = p.nombre;
                        selectPuesto.appendChild(option);
                    });
                }
            } catch (error) { console.error(error); }

            if (riesgo) {
                tituloModal.textContent = 'Editar Evaluación de Riesgo';
                document.getElementById('form-riesgo-id').value = riesgo.id;
                if (riesgo.puesto_trabajo) selectPuesto.value = riesgo.puesto_trabajo;
                document.getElementById('form-riesgo-codigo').value = riesgo.codigo;
                document.getElementById('form-riesgo-tipo').value = riesgo.tipo;
                document.getElementById('form-riesgo-descripcion').value = riesgo.descripcion || '';
                document.getElementById('form-riesgo-probabilidad').value = riesgo.probabilidad;
                document.getElementById('form-riesgo-severidad').value = riesgo.severidad;
                document.getElementById('form-riesgo-medidas').value = riesgo.medidas || '';
                document.getElementById('form-riesgo-estado').value = riesgo.estado;
            } else {
                tituloModal.textContent = 'Nueva Evaluación de Riesgo';
                this.DOM.form.reset();
                document.getElementById('form-riesgo-id').value = '';
            }
            
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return; 
            try {
                const riesgos = await window.apiPRL.getRiesgosActuales();
                this.DOM.tbody.innerHTML = ''; 
                if (!riesgos) return;

                riesgos.forEach(r => {
                    const colorNivel = r.nivel_riesgo === 'Alto' ? '#c0392b' : (r.nivel_riesgo === 'Medio' ? '#f39c12' : '#27ae60');
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${r.codigo}</strong></td>
                        <td>${r.puesto_nombre || '-'}</td>
                        <td>${r.tipo}</td>
                        <td>${r.probabilidad}</td>
                        <td>${r.severidad}</td>
                        <td style="color: ${colorNivel}; font-weight: bold;">${r.nivel_riesgo}</td>
                        <td>${r.estado}</td>
                        <td class="cell-actions">
                            <button class="btn btn--primary class-hook-editar" data-id="${r.id}">Editar</button>
                            <button class="btn btn--danger class-hook-eliminar" data-id="${r.id}">X</button>
                        </td>
                    `;
                    this.DOM.tbody.appendChild(tr);
                });
                this.asignarEventosTabla(riesgos);
            } catch (error) { console.error(error); }
        },

        asignarEventosTabla(riesgos) {
            document.querySelectorAll('#lista-riesgos .class-hook-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    this.abrirModal(riesgos.find(r => r.id == id));
                });
            });

            document.querySelectorAll('#lista-riesgos .class-hook-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm(`¿Archivar esta evaluación de riesgo?`)) {
                        await window.apiPRL.deleteRiesgo(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarRiesgo(e) {
            e.preventDefault();
            const id = document.getElementById('form-riesgo-id').value;
            
            // Calculamos el nivel de riesgo automáticamente (Probabilidad x Severidad)
            const prob = parseInt(document.getElementById('form-riesgo-probabilidad').value);
            const sev = parseInt(document.getElementById('form-riesgo-severidad').value);
            const score = prob * sev;
            let nivel = 'Bajo';
            if (score > 6 && score <= 15) nivel = 'Medio';
            if (score > 15) nivel = 'Alto';

            const datos = {
                puesto_trabajo: document.getElementById('form-riesgo-puesto').value,
                codigo: document.getElementById('form-riesgo-codigo').value.trim(),
                tipo: document.getElementById('form-riesgo-tipo').value,
                descripcion: document.getElementById('form-riesgo-descripcion').value.trim() || null,
                probabilidad: prob,
                severidad: sev,
                medidas: document.getElementById('form-riesgo-medidas').value.trim() || null,
                estado: document.getElementById('form-riesgo-estado').value,
                nivel_riesgo: nivel
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updateRiesgo(datos);
                } else {
                    await window.apiPRL.addRiesgo(datos);
                }
                this.cerrarModal();
                this.recargarTabla();
            } catch (error) {
                console.error(error);
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Error al guardar. ¿Código duplicado?", 'error');
            }
        }
    },
    planes: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-plan'),
                modal: document.getElementById('modal-nuevo-plan'),
                btnCerrar: document.getElementById('btn-cerrar-modal-plan'),
                btnCancelar: document.getElementById('btn-cancelar-plan'),
                form: document.getElementById('form-plan'),
                tbody: document.getElementById('lista-planes')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.btnCancelar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarPlan(e));

            this.recargarTabla();
        },

        async abrirModal(plan = null) {
            const tituloModal = document.querySelector('#modal-nuevo-plan .modal__header h2');
            const selectRiesgo = document.getElementById('form-plan-riesgo');

            try {
                const riesgos = await window.apiPRL.getRiesgosActuales();
                selectRiesgo.innerHTML = ''; 
                if (!riesgos || riesgos.length === 0) {
                    selectRiesgo.innerHTML = '<option value="" disabled selected>⚠️ Evalúa un Riesgo primero</option>';
                } else {
                    riesgos.forEach(r => {
                        const option = document.createElement('option');
                        option.value = r.id;
                        option.textContent = `[${r.codigo}] ${r.puesto_nombre}`;
                        selectRiesgo.appendChild(option);
                    });
                }
            } catch (error) { console.error(error); }

            if (plan) {
                tituloModal.textContent = 'Editar Plan de Prevención';
                document.getElementById('form-plan-id').value = plan.id;
                if (plan.riesgo) selectRiesgo.value = plan.riesgo;
                document.getElementById('form-plan-codigo').value = plan.codigo;
                document.getElementById('form-plan-version').value = plan.version || '1.0';
                document.getElementById('form-plan-contenido').value = plan.contenido || '';
            } else {
                tituloModal.textContent = 'Nuevo Plan de Prevención';
                this.DOM.form.reset();
                document.getElementById('form-plan-id').value = '';
            }
            
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return; 
            try {
                const planes = await window.apiPRL.getPlanesActuales();
                this.DOM.tbody.innerHTML = ''; 
                if (!planes) return;

                planes.forEach(pl => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${pl.codigo}</strong></td>
                        <td>${pl.riesgo_codigo || '-'}</td>
                        <td>${pl.fecha_creacion}</td>
                        <td>v${pl.version}</td>
                        <td class="cell-wrap">${pl.contenido ? pl.contenido.substring(0, 50) + '...' : ''}</td>
                        <td class="cell-actions">
                            <button class="btn btn--primary class-hook-editar" data-id="${pl.id}">Editar</button>
                            <button class="btn btn--danger class-hook-eliminar" data-id="${pl.id}">X</button>
                        </td>
                    `;
                    this.DOM.tbody.appendChild(tr);
                });
                this.asignarEventosTabla(planes);
            } catch (error) { console.error(error); }
        },

        asignarEventosTabla(planes) {
            document.querySelectorAll('#lista-planes .class-hook-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    this.abrirModal(planes.find(pl => pl.id == id));
                });
            });

            document.querySelectorAll('#lista-planes .class-hook-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm(`¿Archivar este plan de prevención?`)) {
                        await window.apiPRL.deletePlan(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarPlan(e) {
            e.preventDefault();
            const id = document.getElementById('form-plan-id').value;
            const datos = {
                riesgo: document.getElementById('form-plan-riesgo').value,
                codigo: document.getElementById('form-plan-codigo').value.trim(),
                version: document.getElementById('form-plan-version').value.trim() || '1.0',
                contenido: document.getElementById('form-plan-contenido').value.trim()
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updatePlan(datos);
                } else {
                    await window.apiPRL.addPlan(datos);
                }
                this.cerrarModal();
                this.recargarTabla();
            } catch (error) {
                console.error(error);
                if(typeof Notificador !== 'undefined') Notificador.mostrar("Error al guardar. ¿Código duplicado?", 'error');
            }
        }
    },
    catalogo_epis: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-tipo-epi'),
                modal: document.getElementById('modal-tipo-epi'),
                btnCerrar: document.getElementById('btn-cerrar-tipo-epi'),
                form: document.getElementById('form-tipo-epi'),
                tbody: document.getElementById('lista-tipos-epi')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarTipo(e));

            this.recargarTabla();
        },

        abrirModal(tipo = null) {
            const titulo = document.querySelector('#modal-tipo-epi .modal__header h2');
            if (tipo) {
                titulo.textContent = 'Editar EPI';
                document.getElementById('form-tipo-epi-id').value = tipo.id;
                document.getElementById('form-tipo-epi-nombre').value = tipo.nombre;
                document.getElementById('form-tipo-epi-normativa').value = tipo.normativa || '';
                document.getElementById('form-tipo-epi-descripcion').value = tipo.descripcion || '';
            } else {
                titulo.textContent = 'Añadir EPI al Catálogo';
                this.DOM.form.reset();
                document.getElementById('form-tipo-epi-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const tipos = await window.apiPRL.getTiposEpisActuales();
                this.DOM.tbody.innerHTML = '';
                if(tipos) {
                    tipos.forEach(t => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${t.nombre}</strong></td>
                            <td>${t.normativa || '-'}</td>
                            <td>${t.descripcion || '-'}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-tipo-epi" data-id="${t.id}">Editar</button>
                                <button class="btn btn--danger hook-del-tipo-epi" data-id="${t.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-tipo-epi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const tipos = await window.apiPRL.getTiposEpisActuales();
                    this.abrirModal(tipos.find(t => t.id == id));
                });
            });
            document.querySelectorAll('.hook-del-tipo-epi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Eliminar este equipo del catálogo global?')) {
                        await window.apiPRL.deleteTipoEpi(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarTipo(e) {
            e.preventDefault();
            const id = document.getElementById('form-tipo-epi-id').value;
            const datos = {
                nombre: document.getElementById('form-tipo-epi-nombre').value.trim(),
                normativa: document.getElementById('form-tipo-epi-normativa').value.trim() || null,
                descripcion: document.getElementById('form-tipo-epi-descripcion').value.trim() || null
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updateTipoEpi(datos);
                } else {
                    await window.apiPRL.addTipoEpi(datos);
                }
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },

    registro_epis: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-epi'),
                modal: document.getElementById('modal-epi'),
                btnCerrar: document.getElementById('btn-cerrar-epi'),
                form: document.getElementById('form-epi'),
                tbody: document.getElementById('lista-epis-entregados')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarEntrega(e));

            this.recargarTabla();
        },

        async abrirModal(entrega = null) {
            const selectTra = document.getElementById('form-epi-trabajador');
            const selectTipo = document.getElementById('form-epi-tipo');

            try {
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                selectTra.innerHTML = '<option value="" disabled selected>-- Elige Trabajador --</option>';
                if(trabajadores) trabajadores.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `${t.nombre} (${t.dni})`;
                    selectTra.appendChild(opt);
                });

                const tipos = await window.apiPRL.getTiposEpisActuales();
                selectTipo.innerHTML = '<option value="" disabled selected>-- Elige Equipo --</option>';
                if(tipos) tipos.forEach(te => {
                    const opt = document.createElement('option');
                    opt.value = te.id;
                    opt.textContent = te.nombre;
                    selectTipo.appendChild(opt);
                });
            } catch(err) { console.error(err); }

            if (entrega) {
                document.getElementById('form-epi-id').value = entrega.id;
                selectTra.value = entrega.trabajador;
                selectTipo.value = entrega.tipo; // Usa el campo 'tipo' de tu BD
                document.getElementById('form-epi-marca').value = entrega.marca_modelo || '';
                document.getElementById('form-epi-fecha').value = entrega.fecha_entrega || '';
                document.getElementById('form-epi-caducidad').value = entrega.fecha_caducidad || '';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-epi-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const entregas = await window.apiPRL.getEpisActuales();
                this.DOM.tbody.innerHTML = '';
                if(entregas) {
                    entregas.forEach(e => {
                        const tr = document.createElement('tr');
                        const hoy = new Date();
                        const caduca = e.fecha_caducidad ? new Date(e.fecha_caducidad) : null;
                        const esCaducado = caduca && caduca < hoy;

                        tr.innerHTML = `
                            <td><strong>${e.trabajador_nombre}</strong> <small>(${e.dni})</small></td>
                            <td>${e.epi_nombre || '<em>Tipo borrado</em>'}</td>
                            <td>${e.marca_modelo || '-'}</td>
                            <td>${e.fecha_entrega || '-'}</td>
                            <td style="${esCaducado ? 'color:#c0392b;font-weight:bold;' : ''}">
                                ${e.fecha_caducidad || 'No caduca'} ${esCaducado ? '⚠️' : ''}
                            </td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-epi" data-id="${e.id}">Editar</button>
                                <button class="btn btn--danger hook-del-epi" data-id="${e.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-epi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const entregas = await window.apiPRL.getEpisActuales();
                    this.abrirModal(entregas.find(ent => ent.id == id));
                });
            });
            document.querySelectorAll('.hook-del-epi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Borrar el registro de entrega?')) {
                        await window.apiPRL.deleteEpi(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarEntrega(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-epi-id').value,
                trabajador: document.getElementById('form-epi-trabajador').value,
                tipo: document.getElementById('form-epi-tipo').value || null,
                marca_modelo: document.getElementById('form-epi-marca').value.trim() || null,
                fecha_entrega: document.getElementById('form-epi-fecha').value || null,
                fecha_caducidad: document.getElementById('form-epi-caducidad').value || null
            };
            
            try {
                if (datos.id) await window.apiPRL.updateEpi(datos);
                else await window.apiPRL.addEpi(datos);
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    investigaciones: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-investigacion'),
                modal: document.getElementById('modal-investigacion'),
                btnCerrar: document.getElementById('btn-cerrar-investigacion'),
                form: document.getElementById('form-investigacion'),
                tbody: document.getElementById('lista-investigaciones')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarInvestigacion(e));

            this.recargarTabla();
        },

        async abrirModal(inv = null) {
            const selectTra = document.getElementById('form-inv-trabajador');

            try {
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                selectTra.innerHTML = '<option value="" disabled selected>-- Elige Trabajador --</option>';
                if(trabajadores) {
                    trabajadores.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = `${t.nombre} (${t.dni})`;
                        selectTra.appendChild(opt);
                    });
                }
            } catch(err) { console.error(err); }

            if (inv) {
                document.getElementById('form-inv-id').value = inv.id;
                document.getElementById('form-inv-codigo').value = inv.codigo;
                document.getElementById('form-inv-fecha').value = inv.fecha;
                selectTra.value = inv.trabajador;
                document.getElementById('form-inv-tipo').value = inv.tipo;
                document.getElementById('form-inv-estado').value = inv.estado || 'pendiente';
                document.getElementById('form-inv-descripcion').value = inv.descripcion || '';
                document.getElementById('form-inv-causas').value = inv.causas || '';
                document.getElementById('form-inv-medidas').value = inv.medidas_correctivas || '';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-inv-id').value = '';
                document.getElementById('form-inv-estado').value = 'pendiente';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const investigaciones = await window.apiPRL.getInvestigacionesActuales();
                this.DOM.tbody.innerHTML = '';
                if(investigaciones) {
                    investigaciones.forEach(i => {
                        const tr = document.createElement('tr');
                        
                        // Lógica de colores para el estado
                        let colorEstado = '#555';
                        if (i.estado === 'pendiente') colorEstado = '#e74c3c';
                        else if (i.estado === 'en proceso') colorEstado = '#f39c12';
                        else if (i.estado === 'cerrada') colorEstado = '#27ae60';

                        tr.innerHTML = `
                            <td><strong>${i.codigo}</strong></td>
                            <td>${i.trabajador_nombre} <small>(${i.dni})</small></td>
                            <td>${i.tipo}</td>
                            <td>${i.fecha}</td>
                            <td style="color: ${colorEstado}; font-weight: bold; text-transform: capitalize;">${i.estado}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-inv" data-id="${i.id}">Editar</button>
                                <button class="btn btn--danger hook-del-inv" data-id="${i.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-inv').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const invs = await window.apiPRL.getInvestigacionesActuales();
                    this.abrirModal(invs.find(i => i.id == id));
                });
            });
            document.querySelectorAll('.hook-del-inv').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Archivar esta investigación?')) {
                        await window.apiPRL.deleteInvestigacion(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarInvestigacion(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-inv-id').value,
                codigo: document.getElementById('form-inv-codigo').value.trim(),
                fecha: document.getElementById('form-inv-fecha').value,
                trabajador: document.getElementById('form-inv-trabajador').value,
                tipo: document.getElementById('form-inv-tipo').value,
                estado: document.getElementById('form-inv-estado').value,
                descripcion: document.getElementById('form-inv-descripcion').value.trim() || null,
                causas: document.getElementById('form-inv-causas').value.trim() || null,
                medidas_correctivas: document.getElementById('form-inv-medidas').value.trim() || null
            };
            
            try {
                if (datos.id) await window.apiPRL.updateInvestigacion(datos);
                else await window.apiPRL.addInvestigacion(datos);
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { 
                console.error(err);
                if(typeof Notificador !== 'undefined') Notificador.mostrar('Error. ¿Código duplicado?', 'error');
            }
        }
    },
    equipos: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-equipo'),
                modal: document.getElementById('modal-equipo'),
                btnCerrar: document.getElementById('btn-cerrar-equipo'),
                form: document.getElementById('form-equipo'),
                tbody: document.getElementById('lista-equipos')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarEquipo(e));

            this.recargarTabla();
        },

        abrirModal(eq = null) {
            const titulo = document.querySelector('#modal-equipo .modal__header h2');
            if (eq) {
                titulo.textContent = 'Editar Equipo';
                document.getElementById('form-eq-id').value = eq.id;
                document.getElementById('form-eq-codigo').value = eq.codigo;
                document.getElementById('form-eq-nombre').value = eq.nombre;
                document.getElementById('form-eq-ubicacion').value = eq.ubicacion || '';
                document.getElementById('form-eq-fecha').value = eq.fecha_compra || '';
            } else {
                titulo.textContent = 'Alta de Equipo';
                this.DOM.form.reset();
                document.getElementById('form-eq-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const equipos = await window.apiPRL.getEquiposActuales();
                this.DOM.tbody.innerHTML = '';
                if(equipos) {
                    equipos.forEach(e => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${e.codigo}</strong></td>
                            <td>${e.nombre}</td>
                            <td>${e.ubicacion || '-'}</td>
                            <td>${e.fecha_compra || '-'}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-eq" data-id="${e.id}">Editar</button>
                                <button class="btn btn--danger hook-del-eq" data-id="${e.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-eq').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const equipos = await window.apiPRL.getEquiposActuales();
                    this.abrirModal(equipos.find(eq => eq.id == id));
                });
            });
            document.querySelectorAll('.hook-del-eq').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Dar de baja este equipo?')) {
                        await window.apiPRL.deleteEquipo(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarEquipo(e) {
            e.preventDefault();
            const id = document.getElementById('form-eq-id').value;
            const datos = {
                codigo: document.getElementById('form-eq-codigo').value.trim(),
                nombre: document.getElementById('form-eq-nombre').value.trim(),
                ubicacion: document.getElementById('form-eq-ubicacion').value.trim() || null,
                fecha_compra: document.getElementById('form-eq-fecha').value || null
            };
            
            try {
                if (id) {
                    datos.id = id;
                    await window.apiPRL.updateEquipo(datos);
                } else {
                    await window.apiPRL.addEquipo(datos);
                }
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { 
                console.error(err);
                if(typeof Notificador !== 'undefined') Notificador.mostrar('Error. ¿Código duplicado?', 'error');
            }
        }
    },

    mantenimientos: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-mantenimiento'),
                modal: document.getElementById('modal-mantenimiento'),
                btnCerrar: document.getElementById('btn-cerrar-mantenimiento'),
                form: document.getElementById('form-mantenimiento'),
                tbody: document.getElementById('lista-mantenimientos')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarMantenimiento(e));

            this.recargarTabla();
        },

        async abrirModal(mant = null) {
            const selectEq = document.getElementById('form-mant-equipo');
            const selectResp = document.getElementById('form-mant-responsable');

            // Cargar selectores
            try {
                const equipos = await window.apiPRL.getEquiposActuales();
                selectEq.innerHTML = '<option value="" disabled selected>-- Elige Equipo --</option>';
                if(equipos) equipos.forEach(eq => {
                    const opt = document.createElement('option');
                    opt.value = eq.id;
                    opt.textContent = `[${eq.codigo}] ${eq.nombre}`;
                    selectEq.appendChild(opt);
                });

                const personas = await window.apiPRL.getPersonasActuales();
                selectResp.innerHTML = '<option value="" disabled selected>-- Elige Responsable --</option>';
                if(personas) personas.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = `${p.nombre} (${p.dni})`;
                    selectResp.appendChild(opt);
                });
            } catch(err) { console.error(err); }

            if (mant) {
                document.getElementById('form-mant-id').value = mant.id;
                selectEq.value = mant.equipo;
                document.getElementById('form-mant-tipo').value = mant.tipo;
                selectResp.value = mant.responsable;
                document.getElementById('form-mant-prog').value = mant.fecha_programada;
                document.getElementById('form-mant-real').value = mant.fecha_realizada || '';
                document.getElementById('form-mant-obs').value = mant.observaciones || '';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-mant-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const mants = await window.apiPRL.getMantenimientosActuales();
                this.DOM.tbody.innerHTML = '';
                if(mants) {
                    mants.forEach(m => {
                        const tr = document.createElement('tr');
                        
                        // Lógica visual: Si la fecha actual pasa la programada y no está realizada -> ROJO
                        const hoy = new Date();
                        const programada = new Date(m.fecha_programada);
                        const retrasado = !m.fecha_realizada && programada < hoy;
                        
                        let tipoColor = m.tipo === 'preventivo' ? '#2980b9' : '#e67e22';

                        tr.innerHTML = `
                            <td><strong>${m.equipo_nombre}</strong> <small>[${m.equipo_codigo}]</small></td>
                            <td style="color: ${tipoColor}; text-transform: capitalize;">${m.tipo}</td>
                            <td style="${retrasado ? 'color:#c0392b; font-weight:bold;' : ''}">
                                ${m.fecha_programada} ${retrasado ? '⚠️' : ''}
                            </td>
                            <td>${m.fecha_realizada ? '<span style="color:#27ae60;">' + m.fecha_realizada + '</span>' : 'Pendiente'}</td>
                            <td>${m.responsable_nombre || '<em>No asignado</em>'}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-mant" data-id="${m.id}">Editar</button>
                                <button class="btn btn--danger hook-del-mant" data-id="${m.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-mant').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const mants = await window.apiPRL.getMantenimientosActuales();
                    this.abrirModal(mants.find(m => m.id == id));
                });
            });
            document.querySelectorAll('.hook-del-mant').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Eliminar este registro de mantenimiento?')) {
                        await window.apiPRL.deleteMantenimiento(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarMantenimiento(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-mant-id').value,
                equipo: document.getElementById('form-mant-equipo').value,
                tipo: document.getElementById('form-mant-tipo').value,
                responsable: document.getElementById('form-mant-responsable').value,
                fecha_programada: document.getElementById('form-mant-prog').value,
                fecha_realizada: document.getElementById('form-mant-real').value || null,
                observaciones: document.getElementById('form-mant-obs').value.trim() || null
            };
            
            try {
                if (datos.id) await window.apiPRL.updateMantenimiento(datos);
                else await window.apiPRL.addMantenimiento(datos);
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    emergencias: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-simulacro'),
                modal: document.getElementById('modal-simulacro'),
                btnCerrar: document.getElementById('btn-cerrar-simulacro'),
                form: document.getElementById('form-simulacro'),
                tbody: document.getElementById('lista-simulacros'),
                
                // Modal Secundario
                modalAddPart: document.getElementById('modal-add-participante'),
                btnCerrarAddPart: document.getElementById('btn-cerrar-add-part'),
                formAddPart: document.getElementById('form-add-part')
            };

            // Eventos Modal Principal
            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.DOM.modal.classList.remove('active'));
            this.DOM.form.addEventListener('submit', (e) => this.guardarSimulacro(e));

            // Eventos Modal Secundario
            this.DOM.btnCerrarAddPart.addEventListener('click', () => this.DOM.modalAddPart.classList.remove('active'));
            this.DOM.formAddPart.addEventListener('submit', (e) => this.guardarParticipanteRapido(e));

            this.recargarTabla();
        },

        async abrirModal(simulacro = null) {
            const selectResp = document.getElementById('form-sim-responsable');
            const selectPart = document.getElementById('form-sim-participantes');

            try {
                // Cargar Personas (Responsable)
                const personas = await window.apiPRL.getPersonasActuales();
                selectResp.innerHTML = '<option value="" disabled selected>-- Elige Responsable --</option>';
                if(personas) personas.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = `${p.nombre} (${p.dni})`;
                    selectResp.appendChild(opt);
                });

                // Cargar Trabajadores (Participantes)
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                selectPart.innerHTML = '';
                if(trabajadores) trabajadores.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `${t.nombre}`;
                    selectPart.appendChild(opt);
                });
            } catch(err) { console.error(err); }

            if (simulacro) {
                document.getElementById('form-sim-id').value = simulacro.id;
                document.getElementById('form-sim-tipo').value = simulacro.tipo;
                document.getElementById('form-sim-fecha').value = simulacro.fecha_simulacro;
                document.getElementById('form-sim-descripcion').value = simulacro.descripcion;
                selectResp.value = simulacro.responsable;
                
                // Rellenar las opciones múltiples previamente seleccionadas
                const idsSeleccionados = simulacro.participantes_ids ? simulacro.participantes_ids.split(',') : [];
                Array.from(selectPart.options).forEach(opt => {
                    opt.selected = idsSeleccionados.includes(opt.value);
                });
            } else {
                this.DOM.form.reset();
                document.getElementById('form-sim-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        async abrirModalParticipante(simulacro) {
            document.getElementById('form-add-part-simulacro-id').value = simulacro.id;
            const selectTra = document.getElementById('form-add-part-trabajador');
            
            // 1. Extraemos los IDs de los que YA están en el simulacro
            let idsExistentes = [];
            if (simulacro.participantes_ids) {
                // Lo convertimos en un array limpio de textos para comparar fácilmente
                idsExistentes = simulacro.participantes_ids.split(',').map(id => id.trim());
            }
            
            try {
                const trabajadores = await window.apiPRL.getTrabajadoresActuales();
                selectTra.innerHTML = '<option value="" disabled selected>-- Selecciona un trabajador --</option>';
                
                let añadidosAlSelect = 0;

                if(trabajadores) {
                    trabajadores.forEach(t => {
                        // 2. MAGIA: Solo creamos el <option> si el trabajador NO está en la lista de existentes
                        if (!idsExistentes.includes(t.id.toString())) {
                            const opt = document.createElement('option');
                            opt.value = t.id;
                            opt.textContent = t.nombre;
                            selectTra.appendChild(opt);
                            añadidosAlSelect++;
                        }
                    });
                }

                // 3. Detalle de UX: Si todos los trabajadores ya están en el simulacro
                if (añadidosAlSelect === 0) {
                    selectTra.innerHTML = '<option value="" disabled selected>✅ Todos los trabajadores ya están añadidos</option>';
                }

            } catch(err) { console.error(err); }
            
            this.DOM.modalAddPart.classList.add('active');
        },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const simulacros = await window.apiPRL.getSimulacrosActuales();
                this.DOM.tbody.innerHTML = '';
                if(simulacros) {
                    simulacros.forEach(s => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${s.tipo}</strong></td>
                            <td>${s.fecha_simulacro}</td>
                            <td class="cell-wrap">${s.descripcion}</td>
                            <td>${s.responsable_nombre || '-'}</td>
                            <td class="cell-wrap" style="color: #555; font-size: 0.9em;">
                                ${s.participantes_nombres || '<em>Sin asistentes</em>'}
                            </td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-sim" data-id="${s.id}">Editar</button>
                                <button class="btn btn--secondary hook-add-part" data-id="${s.id}">+ Participante</button>
                                <button class="btn btn--danger hook-del-sim" data-id="${s.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-sim').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const sims = await window.apiPRL.getSimulacrosActuales();
                    this.abrirModal(sims.find(s => s.id == id));
                });
            });

            document.querySelectorAll('.hook-add-part').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    // Necesitamos pasarle el objeto entero para que lea los participantes_ids
                    const sims = await window.apiPRL.getSimulacrosActuales();
                    const simulacroSeleccionado = sims.find(s => s.id == id);
                    this.abrirModalParticipante(simulacroSeleccionado);
                });
            });

            document.querySelectorAll('.hook-del-sim').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Archivar el registro de este simulacro?')) {
                        await window.apiPRL.deleteSimulacro(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarSimulacro(e) {
            e.preventDefault();
            const selectPart = document.getElementById('form-sim-participantes');
            
            // Extraer un Array puro con los IDs de las opciones seleccionadas (Ctrl + Click)
            const arrayParticipantes = Array.from(selectPart.selectedOptions).map(opt => opt.value);

            const datos = {
                id: document.getElementById('form-sim-id').value,
                tipo: document.getElementById('form-sim-tipo').value,
                fecha_simulacro: document.getElementById('form-sim-fecha').value,
                responsable: document.getElementById('form-sim-responsable').value || null,
                descripcion: document.getElementById('form-sim-descripcion').value.trim(),
                participantes: arrayParticipantes 
            };
            
            try {
                if (datos.id) await window.apiPRL.updateSimulacro(datos);
                else await window.apiPRL.addSimulacro(datos);
                
                this.DOM.modal.classList.remove('active');
                this.recargarTabla();
            } catch (err) { console.error(err); }
        },

        async guardarParticipanteRapido(e) {
            e.preventDefault();
            const datos = {
                simulacro: document.getElementById('form-add-part-simulacro-id').value,
                trabajador: document.getElementById('form-add-part-trabajador').value
            };

            try {
                const res = await window.apiPRL.addParticipanteRapido(datos);
                if (res === false && typeof Notificador !== 'undefined') {
                    Notificador.mostrar('Este trabajador ya está en el simulacro.', 'warning');
                } else {
                    if(typeof Notificador !== 'undefined') Notificador.mostrar('Participante añadido con éxito.', 'success');
                }
                this.DOM.modalAddPart.classList.remove('active');
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    condiciones_trabajo: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-inspeccion'),
                modal: document.getElementById('modal-inspeccion'),
                btnCerrar: document.getElementById('btn-cerrar-inspeccion'),
                form: document.getElementById('form-inspeccion'),
                tbody: document.getElementById('lista-inspecciones')
            };

            if (!AppState.empresaActivaId) {
                if(typeof Notificador !== 'undefined') Notificador.mostrar('⚠️ Selecciona una empresa activa para gestionar sus inspecciones.', 'warning');
                this.DOM.btnNuevo.disabled = true;
            } else {
                this.DOM.btnNuevo.disabled = false;
            }

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarInspeccion(e));

            this.recargarTabla();
        },

        async abrirModal(insp = null) {
            const selectSecc = document.getElementById('form-insp-seccion');
            const selectResp = document.getElementById('form-insp-responsable');

            try {
                // 1. Cargar las secciones de la empresa activa
                const secciones = await window.apiPRL.getSeccionesActuales();
                selectSecc.innerHTML = '<option value="">-- Ninguna / Instalación General --</option>';
                if (secciones) {
                    secciones.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.id;
                        opt.textContent = s.nombre;
                        selectSecc.appendChild(opt);
                    });
                }

                // 2. Cargar las personas globales (Inspectores / Responsables)
                const personas = await window.apiPRL.getPersonasActuales();
                selectResp.innerHTML = '<option value="">-- Sin asignar responsable --</option>';
                if (personas) {
                    personas.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.nombre} (${p.dni})`;
                        selectResp.appendChild(opt);
                    });
                }
            } catch (err) { console.error(err); }

            if (insp) {
                document.getElementById('form-insp-id').value = insp.id;
                document.getElementById('form-insp-tipo').value = insp.tipo_inspeccion;
                document.getElementById('form-insp-fecha').value = insp.fecha;
                selectSecc.value = insp.seccion || '';
                document.getElementById('form-insp-ubicacion').value = insp.ubicacion_exacta;
                selectResp.value = insp.responsable || '';
                document.getElementById('form-insp-resultado').value = insp.resultado;
                document.getElementById('form-insp-medidas').value = insp.medidas_correctivas || '';
                document.getElementById('form-insp-estado').value = insp.estado || 'pendiente';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-insp-id').value = '';
                document.getElementById('form-insp-estado').value = 'pendiente';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const inspecciones = await window.apiPRL.getInspeccionesActuales();
                this.DOM.tbody.innerHTML = '';
                
                if (inspecciones) {
                    inspecciones.forEach(i => {
                        const tr = document.createElement('tr');
                        
                        // Paleta cromática para los estados del informe
                        let colorEstado = '#e74c3c'; // Pendiente
                        if (i.estado === 'en proceso') colorEstado = '#f39c12';
                        else if (i.estado === 'subsanado') colorEstado = '#27ae60';

                        tr.innerHTML = `
                            <td><strong>${i.tipo_inspeccion}</strong></td>
                            <td>${i.seccion_nombre || '<em>General</em>'}</td>
                            <td>${i.ubicacion_exacta}</td>
                            <td>${i.fecha}</td>
                            <td style="color: ${colorEstado}; font-weight: bold; text-transform: capitalize;">${i.estado}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-insp" data-id="${i.id}">Editar</button>
                                <button class="btn btn--danger hook-del-insp" data-id="${i.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-insp').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const lista = await window.apiPRL.getInspeccionesActuales();
                    this.abrirModal(lista.find(i => i.id == id));
                });
            });

            document.querySelectorAll('.hook-del-insp').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Archivar este informe de inspección?')) {
                        await window.apiPRL.deleteInspeccion(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarInspeccion(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-insp-id').value,
                tipo_inspeccion: document.getElementById('form-insp-tipo').value,
                fecha: document.getElementById('form-insp-fecha').value,
                seccion: document.getElementById('form-insp-seccion').value || null,
                ubicacion_exacta: document.getElementById('form-insp-ubicacion').value.trim(),
                responsable: document.getElementById('form-insp-responsable').value || null,
                resultado: document.getElementById('form-insp-resultado').value.trim(),
                medidas_correctivas: document.getElementById('form-insp-medidas').value.trim() || null,
                estado: document.getElementById('form-insp-estado').value
            };

            try {
                if (datos.id) await window.apiPRL.updateInspeccion(datos);
                else await window.apiPRL.addInspeccion(datos);

                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    participacion_consultas: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-consulta'),
                modal: document.getElementById('modal-consulta'),
                btnCerrar: document.getElementById('btn-cerrar-consulta'),
                form: document.getElementById('form-consulta'),
                tbody: document.getElementById('lista-consultas'),
                
                // Elementos del modal rápido
                modalAddPart: document.getElementById('modal-con-add-participante'),
                btnCerrarAddPart: document.getElementById('btn-cerrar-con-add-part'),
                formAddPart: document.getElementById('form-con-add-part')
            };

            // Mapeo de eventos
            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.DOM.modal.classList.remove('active'));
            this.DOM.form.addEventListener('submit', (e) => this.guardarConsulta(e));

            this.DOM.btnCerrarAddPart.addEventListener('click', () => this.DOM.modalAddPart.classList.remove('active'));
            this.DOM.formAddPart.addEventListener('submit', (e) => this.guardarParticipanteRapido(e));

            this.recargarTabla();
        },

        async abrirModal(consulta = null) {
            const selectPart = document.getElementById('form-con-participantes');

            try {
                // Al cruzar con tu tabla "personas", cargamos la base de datos global de personas
                const personas = await window.apiPRL.getPersonasActuales();
                selectPart.innerHTML = '';
                
                if(personas) {
                    personas.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.nombre} (${p.dni})`;
                        selectPart.appendChild(opt);
                    });
                }
            } catch(err) { console.error(err); }

            if (consulta) {
                document.getElementById('form-con-id').value = consulta.id;
                document.getElementById('form-con-tipo').value = consulta.tipo_consulta;
                document.getElementById('form-con-fecha').value = consulta.fecha;
                document.getElementById('form-con-descripcion').value = consulta.descripcion;
                document.getElementById('form-con-acuerdos').value = consulta.acuerdos || '';
                
                // Mapear selección múltiple en caliente
                const idsSeleccionados = consulta.participantes_ids ? consulta.participantes_ids.split(',') : [];
                Array.from(selectPart.options).forEach(opt => {
                    opt.selected = idsSeleccionados.includes(opt.value);
                });
            } else {
                this.DOM.form.reset();
                document.getElementById('form-con-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        async abrirModalParticipante(consulta) {
            document.getElementById('form-con-add-part-id').value = consulta.id;
            const selectPersona = document.getElementById('form-con-add-part-persona');
            
            // Filtro de exclusión inteligente usando las IDs pasadas desde el GROUP_CONCAT
            let idsExistentes = [];
            if (consulta.participantes_ids) {
                idsExistentes = consulta.participantes_ids.split(',').map(id => id.trim());
            }

            try {
                const personas = await window.apiPRL.getPersonasActuales();
                selectPersona.innerHTML = '<option value="" disabled selected>-- Selecciona persona a añadir --</option>';
                
                let contadorFiltrados = 0;
                if(personas) {
                    personas.forEach(p => {
                        if (!idsExistentes.includes(p.id.toString())) {
                            const opt = document.createElement('option');
                            opt.value = p.id;
                            opt.textContent = p.nombre;
                            selectPersona.appendChild(opt);
                            contadorFiltrados++;
                        }
                    });
                }

                if (contadorFiltrados === 0) {
                    selectPersona.innerHTML = '<option value="" disabled selected>✅ Todo el censo ya asiste a esta reunión</option>';
                }
            } catch(err) { console.error(err); }

            this.DOM.modalAddPart.classList.add('active');
        },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const consultas = await window.apiPRL.getConsultasActuales();
                this.DOM.tbody.innerHTML = '';
                
                if(consultas) {
                    consultas.forEach(c => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${c.tipo_consulta}</strong></td>
                            <td>${c.fecha}</td>
                            <td class="cell-wrap">${c.descripcion}</td>
                            <td class="cell-wrap">${c.acuerdos || '<em>Sin acuerdos registrados</em>'}</td>
                            <td class="cell-wrap" style="color: #555; font-size: 0.9em;">
                                ${c.participantes_nombres || '<em>Sin asistentes</em>'}
                            </td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-con" data-id="${c.id}">Editar</button>
                                <button class="btn btn--secondary hook-add-part-con" data-id="${c.id}">+ Participante</button>
                                <button class="btn btn--danger hook-del-con" data-id="${c.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-con').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const listas = await window.apiPRL.getConsultasActuales();
                    this.abrirModal(listas.find(c => c.id == id));
                });
            });

            document.querySelectorAll('.hook-add-part-con').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const listas = await window.apiPRL.getConsultasActuales();
                    this.abrirModalParticipante(listas.find(c => c.id == id));
                });
            });

            document.querySelectorAll('.hook-del-con').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Archivar esta acta de consulta de la empresa?')) {
                        await window.apiPRL.deleteConsulta(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarConsulta(e) {
            e.preventDefault();
            const selectPart = document.getElementById('form-con-participantes');
            const arrayIds = Array.from(selectPart.selectedOptions).map(opt => opt.value);

            const datos = {
                id: document.getElementById('form-con-id').value,
                tipo_consulta: document.getElementById('form-con-tipo').value,
                fecha: document.getElementById('form-con-fecha').value,
                descripcion: document.getElementById('form-con-descripcion').value.trim(),
                acuerdos: document.getElementById('form-con-acuerdos').value.trim() || null,
                participantes: arrayIds
            };

            try {
                if (datos.id) await window.apiPRL.updateConsulta(datos);
                else await window.apiPRL.addConsulta(datos);
                
                this.DOM.modal.classList.remove('active');
                this.recargarTabla();
            } catch (err) { console.error(err); }
        },

        async guardarParticipanteRapido(e) {
            e.preventDefault();
            const datos = {
                consulta: document.getElementById('form-con-add-part-id').value, // Reutiliza el ID del input oculto secundario
                persona: document.getElementById('form-con-add-part-persona').value
            };

            try {
                await window.apiPRL.addConsultaParticipanteRapido(datos);
                if(typeof Notificador !== 'undefined') Notificador.mostrar('Asistente vinculado al acta.', 'success');
                this.DOM.modalAddPart.classList.remove('active');
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    },
    documentos_catalogo: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nuevo-documento'),
                modal: document.getElementById('modal-documento'),
                btnCerrar: document.getElementById('btn-cerrar-documento'),
                form: document.getElementById('form-documento'),
                tbody: document.getElementById('lista-documentos')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarDocumento(e));

            this.recargarTabla();
        },

        abrirModal(doc = null) {
            if (doc) {
                document.getElementById('form-doc-id').value = doc.id;
                document.getElementById('form-doc-codigo').value = doc.codigo;
                document.getElementById('form-doc-nombre').value = doc.nombre;
                document.getElementById('form-doc-tipo').value = doc.tipo || 'Procedimiento';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-doc-id').value = '';
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const docs = await window.apiPRL.getDocumentosActuales();
                this.DOM.tbody.innerHTML = '';
                if(docs) {
                    docs.forEach(d => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${d.codigo}</strong></td>
                            <td>${d.nombre}</td>
                            <td>${d.tipo || '-'}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-doc" data-id="${d.id}">Editar</button>
                                <button class="btn btn--danger hook-del-doc" data-id="${d.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-doc').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const docs = await window.apiPRL.getDocumentosActuales();
                    this.abrirModal(docs.find(d => d.id == id));
                });
            });
            document.querySelectorAll('.hook-del-doc').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Dar de baja este documento del catálogo?')) {
                        await window.apiPRL.deleteDocumento(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarDocumento(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-doc-id').value,
                codigo: document.getElementById('form-doc-codigo').value.trim(),
                nombre: document.getElementById('form-doc-nombre').value.trim(),
                tipo: document.getElementById('form-doc-tipo').value
            };
            
            try {
                if (datos.id) await window.apiPRL.updateDocumento(datos);
                else await window.apiPRL.addDocumento(datos);
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { 
                console.error(err);
                if(typeof Notificador !== 'undefined') Notificador.mostrar('Error. ¿Código duplicado?', 'error');
            }
        }
    },

    documentos_versiones: {
        DOM: {},
        init() {
            this.DOM = {
                btnNuevo: document.getElementById('btn-nueva-version'),
                modal: document.getElementById('modal-version'),
                btnCerrar: document.getElementById('btn-cerrar-version'),
                form: document.getElementById('form-version'),
                tbody: document.getElementById('lista-versiones')
            };

            this.DOM.btnNuevo.addEventListener('click', () => this.abrirModal());
            this.DOM.btnCerrar.addEventListener('click', () => this.cerrarModal());
            this.DOM.form.addEventListener('submit', (e) => this.guardarVersion(e));

            this.recargarTabla();
        },

        async abrirModal(ver = null) {
            const selectDoc = document.getElementById('form-ver-documento');
            const selectAprob = document.getElementById('form-ver-aprobado');

            try {
                const docs = await window.apiPRL.getDocumentosActuales();
                selectDoc.innerHTML = '<option value="" disabled selected>-- Elige Documento --</option>';
                if(docs) docs.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = `[${d.codigo}] ${d.nombre}`;
                    selectDoc.appendChild(opt);
                });

                const personas = await window.apiPRL.getPersonasActuales();
                selectAprob.innerHTML = '<option value="">-- Sin aprobador asignado --</option>';
                if(personas) personas.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = `${p.nombre} (${p.dni})`;
                    selectAprob.appendChild(opt);
                });
            } catch(err) { console.error(err); }

            if (ver) {
                document.getElementById('form-ver-id').value = ver.id;
                selectDoc.value = ver.documento;
                document.getElementById('form-ver-numero').value = ver.version;
                document.getElementById('form-ver-fecha').value = ver.fecha;
                document.getElementById('form-ver-cambios').value = ver.cambios;
                selectAprob.value = ver.aprobado_por || '';
            } else {
                this.DOM.form.reset();
                document.getElementById('form-ver-id').value = '';
                // Rellenar automáticamente la fecha de hoy
                document.getElementById('form-ver-fecha').value = new Date().toISOString().split('T')[0];
            }
            this.DOM.modal.classList.add('active');
        },

        cerrarModal() { this.DOM.modal.classList.remove('active'); },

        async recargarTabla() {
            if (!this.DOM.tbody) return;
            try {
                const versiones = await window.apiPRL.getVersionesActuales();
                this.DOM.tbody.innerHTML = '';
                if(versiones) {
                    versiones.forEach(v => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${v.doc_nombre}</strong> <br><small>[${v.doc_codigo}]</small></td>
                            <td><span style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">v${v.version}</span></td>
                            <td>${v.fecha}</td>
                            <td class="cell-wrap">${v.cambios}</td>
                            <td>${v.aprobado_nombre || '<em>Pendiente</em>'}</td>
                            <td class="cell-actions">
                                <button class="btn btn--primary hook-edit-ver" data-id="${v.id}">Editar</button>
                                <button class="btn btn--danger hook-del-ver" data-id="${v.id}">X</button>
                            </td>
                        `;
                        this.DOM.tbody.appendChild(tr);
                    });
                }
                this.asignarEventos();
            } catch (err) { console.error(err); }
        },

        asignarEventos() {
            document.querySelectorAll('.hook-edit-ver').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const versiones = await window.apiPRL.getVersionesActuales();
                    this.abrirModal(versiones.find(v => v.id == id));
                });
            });
            document.querySelectorAll('.hook-del-ver').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Eliminar este registro de versión?')) {
                        await window.apiPRL.deleteVersion(e.currentTarget.getAttribute('data-id'));
                        this.recargarTabla();
                    }
                });
            });
        },

        async guardarVersion(e) {
            e.preventDefault();
            const datos = {
                id: document.getElementById('form-ver-id').value,
                documento: document.getElementById('form-ver-documento').value,
                version: document.getElementById('form-ver-numero').value.trim(),
                fecha: document.getElementById('form-ver-fecha').value,
                cambios: document.getElementById('form-ver-cambios').value.trim(),
                aprobado_por: document.getElementById('form-ver-aprobado').value || null
            };
            
            try {
                if (datos.id) await window.apiPRL.updateVersion(datos);
                else await window.apiPRL.addVersion(datos);
                
                this.cerrarModal();
                this.recargarTabla();
            } catch (err) { console.error(err); }
        }
    }
};

// ==========================================
// 6. MÓDULO DE NOTIFICACIONES GLOBALES
// ==========================================
const Notificador = {
    /**
     * Muestra un mensaje flotante en la esquina superior derecha
     * @param {string} mensaje - El texto a mostrar
     * @param {string} tipo - 'success', 'error', o 'info'
     */
    init() {
        // Nos suscribimos al canal del servidor
        if (window.apiPRL && window.apiPRL.onNotificacion) {
            window.apiPRL.onNotificacion((datos) => {
                this.mostrar(datos.mensaje, datos.tipo);
            });
        }
    },

    mostrar(mensaje, tipo = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${tipo}`;
        
        toast.innerHTML = `
            <span>${mensaje}</span>
            <span class="toast__close">&times;</span>
        `;

        // Cerrar al hacer clic en la X
        toast.querySelector('.toast__close').addEventListener('click', () => {
            this.cerrar(toast);
        });

        container.appendChild(toast);

        // Auto-destrucción a los 4 segundos
        setTimeout(() => {
            this.cerrar(toast);
        }, 4000);
    },

    cerrar(toastElement) {
        if (toastElement.classList.contains('fade-out')) return;
        toastElement.classList.add('fade-out');
        toastElement.addEventListener('animationend', () => toastElement.remove());
    }
};

// ==========================================
// 7. ARRANQUE DE LA APLICACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    GestorEmpresas.init();
    Navegacion.init();
    Notificador.init();
});