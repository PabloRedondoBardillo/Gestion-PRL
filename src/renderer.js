/**
 * =========================================================================
 * GESTIÓN PRL - CONTROLADOR PRINCIPAL (renderer.js)
 * Arquitectura mantenida, lógica intacta, máxima compresión sintáctica.
 * =========================================================================
 */

// ==========================================
// 1. UTILIDADES Y ACCESOS DIRECTOS (COMPRESIÓN)
// ==========================================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const Utils = {
  cerrarModal: (modal) => modal.classList.remove("active"),
  asignarEventos(
    selectorContenedor,
    datos,
    fnAbrirModal,
    msjBorrar,
    fnBorrar,
    fnRecargar,
  ) {
    $$(`${selectorContenedor} [class*="edit"]`).forEach((btn) => {
      btn.addEventListener("click", (e) =>
        fnAbrirModal(datos.find((x) => x.id == e.currentTarget.dataset.id)),
      );
    });
    $$(
      `${selectorContenedor} [class*="elim"], ${selectorContenedor} [class*="del"]`,
    ).forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        if (confirm(msjBorrar)) {
          await fnBorrar(e.currentTarget.dataset.id);
          if (typeof Notificador !== "undefined")
            Notificador.mostrar("Acción completada con éxito", "success");
          fnRecargar();
        }
      });
    });
  },
};

// ==========================================
// 2. ESTADO Y CACHÉ DEL DOM GLOBAL
// ==========================================
const AppState = { vistaActiva: "inicio", empresaActivaId: null };

const _DOM = {
  layout: {
    contenedor: $("contenedor-principal"),
    tituloCabecera: $("titulo-cabecera"),
    navLinks: $$(".nav-links li"),
  },
  empresa: {
    btnAbrir: $("empresa"),
    textoNombre: $("nombre-empresa"),
    modal: $("modal-empresa"),
    btnCerrar: $("btn-cerrar-modal-empresa"),
    btnCancelar: $("btn-cancelar-empresa"),
    select: $("select-empresa"),
    btnSeleccionar: $("btn-seleccionar-empresa"),
    formNueva: $("form-nueva-empresa"),
  },
};

// ==========================================
// 3. NAVEGACIÓN Y GESTOR DE EMPRESAS
// ==========================================
const Navegacion = {
  init() {
    _DOM.layout.navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        if (link.classList.contains("active")) return;
        _DOM.layout.navLinks.forEach((i) => i.classList.remove("active"));
        link.classList.add("active");
        _DOM.layout.tituloCabecera.textContent = link.textContent;
        this.cargarVista(link.dataset.target);
      }),
    );
    this.cargarVista("inicio");
  },
  async cargarVista(nombreVista) {
    AppState.vistaActiva = nombreVista;
    try {
      const res = await fetch(`./vistas/${nombreVista}.html`);
      if (!res.ok) throw new Error(`Vista no encontrada: ${nombreVista}`);
      _DOM.layout.contenedor.innerHTML = await res.text();
      if (ControladoresVista[nombreVista])
        ControladoresVista[nombreVista].init();
    } catch (err) {
      console.error(err);
      _DOM.layout.contenedor.innerHTML = `<div class="error-vista"><h2>En construcción</h2><p>La vista <b>${nombreVista}</b> aún no ha sido creada.</p></div>`;
    }
  },
  recargarVistaActual() {
    this.cargarVista(AppState.vistaActiva);
  },
};

const GestorEmpresas = {
  init() {
    const d = _DOM.empresa;
    d.btnAbrir.addEventListener("click", () => this.abrirModal());
    [d.btnCerrar, d.btnCancelar].forEach((b) =>
      b.addEventListener("click", () => this.cerrarModal()),
    );
    d.modal.addEventListener("click", (e) => {
      if (e.target === d.modal) this.cerrarModal();
    });
    d.btnSeleccionar.addEventListener("click", () =>
      this.seleccionarExistente(),
    );
    d.formNueva.addEventListener("submit", (e) => this.crearNueva(e));
  },
  async abrirModal() {
    try {
      const empresas = await window.apiPRL.getEmpresas();
      _DOM.empresa.select.innerHTML = empresas.length
        ? empresas
            .map(
              (e) => `<option value="${e.id}">${e.nombre} (${e.cif})</option>`,
            )
            .join("")
        : '<option value="" disabled selected>No hay empresas (crea una abajo)</option>';
      _DOM.empresa.btnSeleccionar.disabled = !empresas.length;
      _DOM.empresa.modal.style.display = "flex";
    } catch (err) {
      console.error("Error al cargar empresas:", err);
    }
  },
  cerrarModal() {
    _DOM.empresa.modal.style.display = "none";
    _DOM.empresa.formNueva.reset();
  },
  async seleccionarExistente() {
    const id = _DOM.empresa.select.value;
    if (!id) return alert("Selecciona una empresa válida.");
    try {
      const emp = await window.apiPRL.setEmpresaActiva(id);
      AppState.empresaActivaId = id;
      _DOM.empresa.textoNombre.textContent = emp.nombre;
      this.cerrarModal();
      Navegacion.recargarVistaActual();
    } catch (err) {
      console.error("Error al fijar empresa activa:", err);
    }
  },
  async crearNueva(e) {
    e.preventDefault();
    const datos = {
      cif: $("emp-cif").value.trim(),
      nombre: $("emp-nombre").value.trim(),
      direccion: $("emp-direccion").value.trim(),
      telefono: $("emp-telefono").value.trim(),
      email: $("emp-email").value.trim(),
    };
    try {
      const id = await window.apiPRL.addEmpresa(datos);
      const emp = await window.apiPRL.setEmpresaActiva(id);
      AppState.empresaActivaId = id;
      _DOM.empresa.textoNombre.textContent = emp.nombre;
      this.cerrarModal();
      Navegacion.recargarVistaActual();
    } catch (err) {
      alert("Error al crear. Comprueba que el CIF no esté repetido.");
    }
  },
};

// ==========================================
// 4. CONTROLADORES ESPECÍFICOS DE VISTA
// ==========================================
const ControladoresVista = {
  inicio: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-editar-empresa"),
        form: $("form-editar-empresa"),
        btnEd: $("btn-editar-empresa"),
        btnDel: $("btn-eliminar-empresa"),
      };
      if (this.DOM.btnEd)
        this.DOM.btnEd.addEventListener("click", () => this.abrirModal());
      ["btn-cerrar-editar-empresa", "btn-cancelar-editar-empresa"].forEach(
        (id) => $(id)?.addEventListener("click", () => this.cerrarModal()),
      );
      if (this.DOM.form)
        this.DOM.form.addEventListener("submit", (e) => this.guardarCambios(e));
      if (this.DOM.btnDel)
        this.DOM.btnDel.addEventListener("click", () => this.eliminarEmpresa());
      this.comprobarEstadoBotones();
      this.cargarEstadisticas();
    },
    comprobarEstadoBotones() {
      const hayEmpresa = AppState.empresaActivaId !== null;
      if (this.DOM.btnEd) this.DOM.btnEd.disabled = !hayEmpresa;
      if (this.DOM.btnDel) this.DOM.btnDel.disabled = !hayEmpresa;
    },
    async cargarEstadisticas() {
      if (!AppState.empresaActivaId) return;
      try {
        const s = await window.apiPRL.getEstadisticas();
        if (s) {
          $("stat-trabajadores").textContent = s.trabajadores;
          $("stat-riesgos").textContent = s.riesgos;
          $("stat-investigaciones").textContent = s.investigaciones;
          $("stat-formaciones").textContent = s.formaciones;
          $("stat-epis").textContent = s.epis;
        }
      } catch (err) {
        console.error(err);
      }
    },
    async abrirModal() {
      if (!AppState.empresaActivaId) return;
      try {
        const emp = await window.apiPRL.setEmpresaActiva(
          AppState.empresaActivaId,
        );
        $("edit-emp-cif").value = emp.cif;
        $("edit-emp-nombre").value = emp.nombre;
        $("edit-emp-direccion").value = emp.direccion || "";
        $("edit-emp-telefono").value = emp.telefono || "";
        $("edit-emp-email").value = emp.email || "";
        this.DOM.modal.classList.add("active");
      } catch (err) {
        console.error(err);
      }
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async guardarCambios(e) {
      e.preventDefault();
      const d = {
        id: AppState.empresaActivaId,
        cif: $("edit-emp-cif").value.trim(),
        nombre: $("edit-emp-nombre").value.trim(),
        direccion: $("edit-emp-direccion").value.trim(),
        telefono: $("edit-emp-telefono").value.trim(),
        email: $("edit-emp-email").value.trim(),
      };
      try {
        await window.apiPRL.updateEmpresa(d);
        Notificador?.mostrar("Datos actualizados", "success");
        if ($("nombre-empresa")) $("nombre-empresa").textContent = d.nombre;
        this.cerrarModal();
      } catch (err) {
        Notificador?.mostrar("Error. ¿CIF duplicado?", "error");
      }
    },
    async eliminarEmpresa() {
      if (!AppState.empresaActivaId) return;
      if (confirm("⚠️ ATENCIÓN: Se archivará la empresa. ¿Continuar?")) {
        try {
          await window.apiPRL.deleteEmpresa(AppState.empresaActivaId);
          Notificador?.mostrar("Empresa archivada", "success");
          AppState.empresaActivaId = null;
          if ($("nombre-empresa"))
            $("nombre-empresa").textContent = "Ninguna empresa seleccionada";
          this.comprobarEstadoBotones();
          GestorEmpresas.abrirModal();
        } catch (err) {
          Notificador?.mostrar("Error al archivar", "error");
        }
      }
    },
  },

  secciones: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-nueva-seccion"),
        form: $("form-seccion"),
        tbody: $("lista-secciones"),
      };
      $("btn-nueva-seccion").addEventListener("click", () => this.abrirModal());
      ["btn-cerrar-modal-seccion", "btn-cancelar-seccion"].forEach((id) =>
        $(id).addEventListener("click", () => this.cerrarModal()),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarSeccion(e));
      this.recargarTabla();
    },
    abrirModal(s = null) {
      document.querySelector("#modal-nueva-seccion h2").textContent = s
        ? "Editar Sección"
        : "Alta de Nueva Sección";
      if (s) {
        $("form-seccion-id").value = s.id;
        $("form-seccion-nombre").value = s.nombre;
      } else {
        this.DOM.form.reset();
        $("form-seccion-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      try {
        const data = await window.apiPRL.getSeccionesActuales();
        this.DOM.tbody.innerHTML = (data || [])
          .map(
            (s) => `<tr>
                    <td><strong>${s.nombre}</strong></td>
                    <td class="cell-actions">
                        <button class="btn btn--primary class-hook-editar" data-id="${s.id}">Editar</button>
                        <button class="btn btn--danger class-hook-eliminar" data-id="${s.id}">X</button>
                    </td></tr>`,
          )
          .join("");
        Utils.asignarEventos(
          "#lista-secciones",
          data,
          (s) => this.abrirModal(s),
          "⚠️ ¿Borrar sección? Se eliminarán los puestos asociados.",
          (id) => window.apiPRL.deleteSeccion(id),
          () => this.recargarTabla(),
        );
      } catch (e) {
        console.error(e);
      }
    },
    async guardarSeccion(e) {
      e.preventDefault();
      const id = $("form-seccion-id").value,
        datos = { nombre: $("form-seccion-nombre").value.trim() };
      try {
        id
          ? ((datos.id = id), await window.apiPRL.updateSeccion(datos))
          : await window.apiPRL.addSeccion(datos);
        Notificador?.mostrar("Sección guardada", "success");
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
        Notificador?.mostrar("Error al guardar", "error");
      }
    },
  },

  puestos: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-nuevo-puesto"),
        form: $("form-puesto"),
        tbody: $("lista-puestos"),
      };
      $("btn-nuevo-puesto").addEventListener("click", () => this.abrirModal());
      ["btn-cerrar-modal-puesto", "btn-cancelar-puesto"].forEach((id) =>
        $(id).addEventListener("click", () => this.cerrarModal()),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarPuesto(e));
      this.recargarTabla();
    },
    async abrirModal(p = null) {
      document.querySelector("#modal-nuevo-puesto h2").textContent = p
        ? "Editar Puesto"
        : "Alta de Nuevo Puesto";
      const secs = await window.apiPRL.getSeccionesActuales();
      $("form-puesto-seccion").innerHTML = secs.length
        ? secs
            .map((s) => `<option value="${s.id}">${s.nombre}</option>`)
            .join("")
        : '<option value="" disabled selected>⚠️ Crea primero una Sección</option>';

      if (p) {
        $("form-puesto-id").value = p.id;
        $("form-puesto-seccion").value = p.seccion;
        $("form-puesto-nombre").value = p.nombre;
        $("form-puesto-descripcion").value = p.descripcion || "";
        $("form-puesto-riesgos").value = p.riesgos_asociados || "";
      } else {
        this.DOM.form.reset();
        $("form-puesto-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getPuestosActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (p) => `<tr>
                <td><strong>${p.nombre}</strong></td>
                <td><span style="background: #e1f0fa; color: #2980b9; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">${p.seccion_nombre}</span></td>
                <td class="cell-wrap">${p.descripcion || "-"}</td><td class="cell-wrap" style="color: #c0392b;">${p.riesgos_asociados || "-"}</td>
                <td class="cell-actions"><button class="btn btn--primary class-hook-editar" data-id="${p.id}">Editar</button> <button class="btn btn--danger class-hook-eliminar" data-id="${p.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-puestos",
        data,
        (p) => this.abrirModal(p),
        "¿Eliminar este puesto de trabajo?",
        (id) => window.apiPRL.deletePuesto(id),
        () => this.recargarTabla(),
      );
    },
    async guardarPuesto(e) {
      e.preventDefault();
      const id = $("form-puesto-id").value,
        sec = $("form-puesto-seccion").value;
      if (!sec)
        return Notificador?.mostrar("Debes seleccionar una sección", "error");
      const datos = {
        seccion: sec,
        nombre: $("form-puesto-nombre").value.trim(),
        descripcion: $("form-puesto-descripcion").value.trim(),
        riesgos_asociados: $("form-puesto-riesgos").value.trim(),
      };
      try {
        id
          ? ((datos.id = id), await window.apiPRL.updatePuesto(datos))
          : await window.apiPRL.addPuesto(datos);
        Notificador?.mostrar("Puesto guardado", "success");
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error al guardar", "error");
      }
    },
  },

  personas: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-nueva-persona"),
        form: $("form-persona"),
        tbody: $("lista-personas"),
      };
      $("btn-nueva-persona").addEventListener("click", () => this.abrirModal());
      ["btn-cerrar-modal-persona", "btn-cancelar-persona"].forEach((id) =>
        $(id).addEventListener("click", () => this.cerrarModal()),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarPersona(e));
      this.recargarTabla();
    },
    abrirModal(p = null) {
      document.querySelector("#modal-nueva-persona h2").textContent = p
        ? "Editar Persona"
        : "Alta de Nueva Persona";
      if (p) {
        $("form-persona-id").value = p.id;
        $("form-persona-dni").value = p.dni;
        $("form-persona-nombre").value = p.nombre;
        $("form-persona-fecha").value = p.fecha_nacimiento || "";
        $("form-persona-telefono").value = p.telefono || "";
        $("form-persona-email").value = p.email || "";
        $("form-persona-direccion").value = p.direccion || "";
      } else {
        this.DOM.form.reset();
        $("form-persona-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getPersonasActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (p) => `<tr>
                <td><strong>${p.dni}</strong></td><td>${p.nombre}</td><td>${p.telefono || "-"}</td><td>${p.email || "-"}</td>
                <td class="cell-actions"><button class="btn btn--primary class-hook-editar" data-id="${p.id}">Editar</button> <button class="btn btn--danger class-hook-eliminar" data-id="${p.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-personas",
        data,
        (p) => this.abrirModal(p),
        "¿Archivar persona del sistema global?",
        (id) => window.apiPRL.deletePersona(id),
        () => this.recargarTabla(),
      );
    },
    async guardarPersona(e) {
      e.preventDefault();
      const id = $("form-persona-id").value,
        d = {
          dni: $("form-persona-dni").value.trim(),
          nombre: $("form-persona-nombre").value.trim(),
          fecha_nacimiento: $("form-persona-fecha").value || null,
          telefono: $("form-persona-telefono").value.trim() || null,
          email: $("form-persona-email").value.trim() || null,
          direccion: $("form-persona-direccion").value.trim() || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updatePersona(d))
          : await window.apiPRL.addPersona(d);
        Notificador?.mostrar("Persona guardada", "success");
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error. ¿DNI duplicado?", "error");
      }
    },
  },

  trabajadores: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-nuevo-trabajador"),
        form: $("form-trabajador"),
        tbody: $("lista-trabajadores"),
      };
      $("btn-nuevo-trabajador").addEventListener("click", () =>
        this.abrirModal(),
      );
      ["btn-cerrar-modal", "btn-cancelar-modal"].forEach((id) =>
        $(id).addEventListener("click", () => this.cerrarModal()),
      );
      this.DOM.form.addEventListener("submit", (e) =>
        this.guardarTrabajador(e),
      );

      const selectP = $("form-persona-select"),
        nom = $("form-nombre"),
        dni = $("form-dni");
      if (selectP)
        selectP.addEventListener("change", (e) => {
          const isNew = e.target.value === "nueva";
          [nom, dni].forEach((i) => {
            i.readOnly = !isNew;
            i.style.backgroundColor = isNew ? "#fff" : "#f0f0f0";
          });
          if (isNew) {
            nom.value = "";
            dni.value = "";
          } else {
            const opt = e.target.options[e.target.selectedIndex];
            nom.value = opt.dataset.nombre;
            dni.value = opt.dataset.dni;
          }
        });
      this.recargarTabla();
    },
    async abrirModal(t = null) {
      document.querySelector("#modal-nuevo-trabajador h2").textContent = t
        ? "Editar Trabajador"
        : "Alta de Nuevo Trabajador";
      const btnSubmit = document.querySelector(
        "#modal-nuevo-trabajador .btn--primary",
      );
      if (btnSubmit)
        btnSubmit.textContent = t ? "Guardar Cambios" : "Guardar Trabajador";

      const [puestos, personas] = await Promise.all([
        window.apiPRL.getPuestosActuales(),
        window.apiPRL.getPersonasActuales(),
      ]);
      $("form-puesto").innerHTML = puestos?.length
        ? puestos
            .map(
              (p) =>
                `<option value="${p.id}">${p.nombre} (${p.seccion_nombre})</option>`,
            )
            .join("")
        : '<option value="" disabled selected>⚠️ Crea un Puesto primero</option>';
      if ($("form-persona-select"))
        $("form-persona-select").innerHTML =
          '<option value="nueva">✨ -- Crear Nueva Persona --</option>' +
          (personas || [])
            .map(
              (p) =>
                `<option value="${p.id}" data-dni="${p.dni}" data-nombre="${p.nombre}">${p.dni} - ${p.nombre}</option>`,
            )
            .join("");

      if (t) {
        $("form-id").value = t.id;
        $("form-nombre").value = t.nombre;
        $("form-dni").value = t.dni;
        if (t.puesto_trabajo) $("form-puesto").value = t.puesto_trabajo;
        $("form-fecha-alta").value = t.fecha_alta || "";
        $("form-fecha-baja").value = t.fecha_baja || "";
        $("form-activo").value = t.activo ?? "1";
        $("form-observaciones").value = t.observaciones || "";
        if ($("form-persona-select")) {
          const opt = Array.from($("form-persona-select").options).find(
            (o) => o.dataset.dni === t.dni,
          );
          if (opt) {
            $("form-persona-select").value = opt.value;
            ["form-nombre", "form-dni"].forEach((id) => {
              $(id).readOnly = true;
              $(id).style.backgroundColor = "#f0f0f0";
            });
          }
        }
      } else {
        this.DOM.form.reset();
        $("form-id").value = "";
        if ($("form-persona-select")) {
          $("form-persona-select").value = "nueva";
          ["form-nombre", "form-dni"].forEach((id) => {
            $(id).readOnly = false;
            $(id).style.backgroundColor = "#fff";
          });
        }
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getTrabajadoresActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (t) => `<tr>
                <td>${t.nombre}</td><td>${t.dni}</td><td>${t.puesto_trabajo || "-"}</td><td>${t.fecha_alta || "-"}</td><td>${t.fecha_baja || "-"}</td><td>${t.activo == 1 ? "Sí" : "No"}</td><td class="cell-wrap">${t.observaciones || ""}</td>
                <td class="cell-actions"><button class="btn btn--primary class-hook-editar" data-id="${t.id}">Editar</button> <button class="btn btn--danger class-hook-eliminar" data-id="${t.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-trabajadores",
        data,
        (t) => this.abrirModal(t),
        "¿Dar de baja al trabajador?",
        (id) => window.apiPRL.deleteTrabajador(id),
        () => this.recargarTabla(),
      );
    },
    async guardarTrabajador(e) {
      e.preventDefault();
      const id = $("form-id").value,
        puesto = $("form-puesto").value;
      if (!puesto)
        return Notificador?.mostrar("Debes seleccionar un puesto", "warning");
      const d = {
        nombre: $("form-nombre").value.trim(),
        dni: $("form-dni").value.trim(),
        puesto_trabajo: puesto,
        fecha_alta: $("form-fecha-alta").value || null,
        fecha_baja: $("form-fecha-baja").value || null,
        activo: $("form-activo").value || null,
        observaciones: $("form-observaciones").value.trim() || null,
      };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateTrabajador(d))
          : await window.apiPRL.addTrabajador(d);
        Notificador?.mostrar("Trabajador guardado", "success");
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error al guardar", "error");
      }
    },
  },

  vigilancia_salud: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-vigilancia"),
        form: $("form-vigilancia"),
        tbody: $("lista-vigilancia"),
      };
      $("btn-nuevo-examen").addEventListener("click", () => this.abrirModal());
      $("btn-cerrar-vigilancia").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) =>
        this.guardarVigilancia(e),
      );
      this.recargarTabla();
    },
    async abrirModal(reg = null) {
      const tr = await window.apiPRL.getTrabajadoresActuales();
      $("form-vigilancia-trabajador").innerHTML =
        '<option value="" disabled selected>-- Elige Trabajador --</option>' +
        (tr || [])
          .map((t) => `<option value="${t.id}">${t.nombre} (${t.dni})</option>`)
          .join("");
      if (reg) {
        $("form-vigilancia-id").value = reg.id;
        $("form-vigilancia-trabajador").value = reg.trabajador;
        $("form-vigilancia-fecha").value = reg.fecha_examen;
        $("form-vigilancia-tipo").value = reg.tipo;
        $("form-vigilancia-resultado").value = reg.resultado;
        $("form-vigilancia-apto").value = reg.apto ?? "1";
        $("form-vigilancia-proxima").value = reg.proxima_fecha || "";
        $("form-vigilancia-observaciones").value = reg.observaciones || "";
      } else {
        this.DOM.form.reset();
        $("form-vigilancia-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getVigilanciaActuales();
      const hoy = new Date();
      this.DOM.tbody.innerHTML = (data || [])
        .map((r) => {
          const vencido = r.proxima_fecha && new Date(r.proxima_fecha) < hoy;
          const col = r.resultado.includes("No apto")
            ? "#c0392b"
            : r.resultado.includes("restricciones")
              ? "#f39c12"
              : "#27ae60";
          return `<tr><td><strong>${r.trabajador_nombre}</strong> <small>(${r.dni})</small></td><td>${r.fecha_examen}</td><td>${r.tipo}</td><td><span style="color:${col}; font-weight:bold;">${r.resultado}</span></td><td style="${vencido ? "color:#c0392b;font-weight:bold;" : ""}">${r.proxima_fecha || "No requerida"} ${vencido ? "⚠️" : ""}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-vigilancia" data-id="${r.id}">Editar</button> <button class="btn btn--danger hook-del-vigilancia" data-id="${r.id}">X</button></td></tr>`;
        })
        .join("");
      Utils.asignarEventos(
        "#lista-vigilancia",
        data,
        (r) => this.abrirModal(r),
        "¿Archivar control médico?",
        (id) => window.apiPRL.deleteVigilancia(id),
        () => this.recargarTabla(),
      );
    },
    async guardarVigilancia(e) {
      e.preventDefault();
      const id = $("form-vigilancia-id").value,
        d = {
          trabajador: $("form-vigilancia-trabajador").value,
          fecha_examen: $("form-vigilancia-fecha").value,
          tipo: $("form-vigilancia-tipo").value,
          resultado: $("form-vigilancia-resultado").value,
          apto: parseInt($("form-vigilancia-apto").value),
          proxima_fecha: $("form-vigilancia-proxima").value || null,
          observaciones:
            $("form-vigilancia-observaciones").value.trim() || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateVigilancia(d))
          : await window.apiPRL.addVigilancia(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  catalogo_cursos: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-tipo-formacion"),
        form: $("form-tipo-formacion"),
        tbody: $("lista-tipos-formacion"),
      };
      $("btn-nuevo-tipo").addEventListener("click", () => this.abrirModal());
      $("btn-cerrar-tipo").addEventListener("click", () => this.cerrarModal());
      this.DOM.form.addEventListener("submit", (e) => this.guardarTipo(e));
      this.recargarTabla();
    },
    abrirModal(t = null) {
      document.querySelector("#modal-tipo-formacion h2").textContent = t
        ? "Editar Curso"
        : "Añadir Curso al Catálogo";
      if (t) {
        $("form-tipo-id").value = t.id;
        $("form-tipo-nombre").value = t.nombre;
        $("form-tipo-entidad").value = t.entidad || "";
        $("form-tipo-validez").value = t.anos_validez;
        $("form-tipo-descripcion").value = t.descripcion || "";
      } else {
        this.DOM.form.reset();
        $("form-tipo-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getTiposFormacionActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (t) =>
            `<tr><td><strong>${t.nombre}</strong></td><td>${t.entidad || "-"}</td><td>${t.anos_validez === 0 ? "Sin caducidad" : t.anos_validez + " años"}</td><td>${t.descripcion || "-"}</td><td class="cell-actions"><button class="btn btn--primary hook-edit-tipo" data-id="${t.id}">Editar</button> <button class="btn btn--danger hook-del-tipo" data-id="${t.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-tipos-formacion",
        data,
        (t) => this.abrirModal(t),
        "¿Eliminar curso del catálogo?",
        (id) => window.apiPRL.deleteTipoFormacion(id),
        () => this.recargarTabla(),
      );
    },
    async guardarTipo(e) {
      e.preventDefault();
      const id = $("form-tipo-id").value,
        d = {
          nombre: $("form-tipo-nombre").value.trim(),
          entidad: $("form-tipo-entidad").value.trim() || null,
          anos_validez: parseInt($("form-tipo-validez").value),
          descripcion: $("form-tipo-descripcion").value.trim() || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateTipoFormacion(d))
          : await window.apiPRL.addTipoFormacion(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  registro_formacion: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-formacion"),
        form: $("form-formacion"),
        tbody: $("lista-formaciones"),
      };
      $("btn-nueva-formacion").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-formacion").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarFormacion(e));

      const calcCaducidad = () => {
        const c = $("form-formacion-curso"),
          f = $("form-formacion-fecha");
        if (!c.value || !f.value) return;
        const anos = parseInt(c.options[c.selectedIndex].dataset.validez || 0);
        if (anos > 0) {
          const d = new Date(f.value);
          d.setFullYear(d.getFullYear() + anos);
          $("form-formacion-caducidad").value = d.toISOString().split("T")[0];
        } else {
          $("form-formacion-caducidad").value = "";
        }
      };
      ["form-formacion-curso", "form-formacion-fecha"].forEach((id) =>
        $(id).addEventListener("change", calcCaducidad),
      );
      this.recargarTabla();
    },
    async abrirModal(f = null) {
      const [tr, cu] = await Promise.all([
        window.apiPRL.getTrabajadoresActuales(),
        window.apiPRL.getTiposFormacionActuales(),
      ]);
      $("form-formacion-trabajador").innerHTML =
        '<option value="" disabled selected>-- Elige Trabajador --</option>' +
        (tr || [])
          .map((t) => `<option value="${t.id}">${t.nombre} (${t.dni})</option>`)
          .join("");
      $("form-formacion-curso").innerHTML =
        '<option value="" disabled selected>-- Elige Curso --</option>' +
        (cu || [])
          .map(
            (c) =>
              `<option value="${c.id}" data-validez="${c.anos_validez}">${c.nombre}</option>`,
          )
          .join("");

      if (f) {
        $("form-formacion-id").value = f.id;
        $("form-formacion-trabajador").value = f.trabajador;
        $("form-formacion-curso").value = f.tipo_formacion;
        $("form-formacion-fecha").value = f.fecha_realizacion;
        $("form-formacion-caducidad").value = f.fecha_validez || "";
      } else {
        this.DOM.form.reset();
        $("form-formacion-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getFormacionesActuales();
      const hoy = new Date();
      this.DOM.tbody.innerHTML = (data || [])
        .map((f) => {
          const caducado = f.fecha_validez && new Date(f.fecha_validez) < hoy;
          return `<tr><td><strong>${f.trabajador_nombre}</strong> <small>(${f.dni})</small></td><td>${f.curso_nombre}</td><td>${f.fecha_realizacion}</td><td style="${caducado ? "color:#c0392b;font-weight:bold;" : ""}">${f.fecha_validez || "No caduca"} ${caducado ? "⚠️" : ""}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-form" data-id="${f.id}">Editar</button> <button class="btn btn--danger hook-del-form" data-id="${f.id}">X</button></td></tr>`;
        })
        .join("");
      Utils.asignarEventos(
        "#lista-formaciones",
        data,
        (f) => this.abrirModal(f),
        "¿Borrar registro de formación?",
        (id) => window.apiPRL.deleteFormacion(id),
        () => this.recargarTabla(),
      );
    },
    async guardarFormacion(e) {
      e.preventDefault();
      const id = $("form-formacion-id").value,
        d = {
          trabajador: $("form-formacion-trabajador").value,
          tipo_formacion: $("form-formacion-curso").value,
          fecha_realizacion: $("form-formacion-fecha").value,
          fecha_validez: $("form-formacion-caducidad").value || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateFormacion(d))
          : await window.apiPRL.addFormacion(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  riesgos: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-nuevo-riesgo"),
        form: $("form-riesgo"),
        tbody: $("lista-riesgos"),
      };
      $("btn-nuevo-riesgo").addEventListener("click", () => this.abrirModal());
      ["btn-cerrar-modal-riesgo", "btn-cancelar-riesgo"].forEach((id) =>
        $(id).addEventListener("click", () => this.cerrarModal()),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarRiesgo(e));
      this.recargarTabla();
    },
    async abrirModal(r = null) {
      document.querySelector("#modal-nuevo-riesgo h2").textContent = r
        ? "Editar Evaluación"
        : "Nueva Evaluación";
      const pt = await window.apiPRL.getPuestosActuales();
      $("form-riesgo-puesto").innerHTML = pt?.length
        ? pt.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("")
        : '<option value="" disabled selected>⚠️ Crea primero un Puesto</option>';

      if (r) {
        $("form-riesgo-id").value = r.id;
        if (r.puesto_trabajo) $("form-riesgo-puesto").value = r.puesto_trabajo;
        $("form-riesgo-codigo").value = r.codigo;
        $("form-riesgo-tipo").value = r.tipo;
        $("form-riesgo-descripcion").value = r.descripcion || "";
        $("form-riesgo-probabilidad").value = r.probabilidad;
        $("form-riesgo-severidad").value = r.severidad;
        $("form-riesgo-medidas").value = r.medidas || "";
        $("form-riesgo-estado").value = r.estado;
      } else {
        this.DOM.form.reset();
        $("form-riesgo-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getRiesgosActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (r) => `<tr>
                <td><strong>${r.codigo}</strong></td><td>${r.puesto_nombre || "-"}</td><td>${r.tipo}</td><td>${r.probabilidad}</td><td>${r.severidad}</td>
                <td style="color: ${r.nivel_riesgo === "Alto" ? "#c0392b" : r.nivel_riesgo === "Medio" ? "#f39c12" : "#27ae60"}; font-weight: bold;">${r.nivel_riesgo}</td><td>${r.estado}</td>
                <td class="cell-actions"><button class="btn btn--primary class-hook-editar" data-id="${r.id}">Editar</button> <button class="btn btn--danger class-hook-eliminar" data-id="${r.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-riesgos",
        data,
        (r) => this.abrirModal(r),
        "¿Archivar evaluación de riesgo?",
        (id) => window.apiPRL.deleteRiesgo(id),
        () => this.recargarTabla(),
      );
    },
    async guardarRiesgo(e) {
      e.preventDefault();
      const prob = parseInt($("form-riesgo-probabilidad").value),
        sev = parseInt($("form-riesgo-severidad").value),
        score = prob * sev;
      const id = $("form-riesgo-id").value,
        d = {
          puesto_trabajo: $("form-riesgo-puesto").value,
          codigo: $("form-riesgo-codigo").value.trim(),
          tipo: $("form-riesgo-tipo").value,
          descripcion: $("form-riesgo-descripcion").value.trim() || null,
          probabilidad: prob,
          severidad: sev,
          medidas: $("form-riesgo-medidas").value.trim() || null,
          estado: $("form-riesgo-estado").value,
          nivel_riesgo: score > 15 ? "Alto" : score > 6 ? "Medio" : "Bajo",
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateRiesgo(d))
          : await window.apiPRL.addRiesgo(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error. ¿Código duplicado?", "error");
      }
    },
  },

  planes: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-nuevo-plan"),
        form: $("form-plan"),
        tbody: $("lista-planes"),
      };
      $("btn-nuevo-plan").addEventListener("click", () => this.abrirModal());
      ["btn-cerrar-modal-plan", "btn-cancelar-plan"].forEach((id) =>
        $(id).addEventListener("click", () => this.cerrarModal()),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarPlan(e));
      this.recargarTabla();
    },
    async abrirModal(p = null) {
      document.querySelector("#modal-nuevo-plan h2").textContent = p
        ? "Editar Plan"
        : "Nuevo Plan";
      const ri = await window.apiPRL.getRiesgosActuales();
      $("form-plan-riesgo").innerHTML = ri?.length
        ? ri
            .map(
              (r) =>
                `<option value="${r.id}">[${r.codigo}] ${r.puesto_nombre}</option>`,
            )
            .join("")
        : '<option value="" disabled selected>⚠️ Evalúa un Riesgo primero</option>';
      if (p) {
        $("form-plan-id").value = p.id;
        if (p.riesgo) $("form-plan-riesgo").value = p.riesgo;
        $("form-plan-codigo").value = p.codigo;
        $("form-plan-version").value = p.version || "1.0";
        $("form-plan-contenido").value = p.contenido || "";
      } else {
        this.DOM.form.reset();
        $("form-plan-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getPlanesActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (pl) =>
            `<tr><td><strong>${pl.codigo}</strong></td><td>${pl.riesgo_codigo || "-"}</td><td>${pl.fecha_creacion}</td><td>v${pl.version}</td><td class="cell-wrap">${pl.contenido ? pl.contenido.substring(0, 50) + "..." : ""}</td><td class="cell-actions"><button class="btn btn--primary class-hook-editar" data-id="${pl.id}">Editar</button> <button class="btn btn--danger class-hook-eliminar" data-id="${pl.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-planes",
        data,
        (p) => this.abrirModal(p),
        "¿Archivar este plan?",
        (id) => window.apiPRL.deletePlan(id),
        () => this.recargarTabla(),
      );
    },
    async guardarPlan(e) {
      e.preventDefault();
      const id = $("form-plan-id").value,
        d = {
          riesgo: $("form-plan-riesgo").value,
          codigo: $("form-plan-codigo").value.trim(),
          version: $("form-plan-version").value.trim() || "1.0",
          contenido: $("form-plan-contenido").value.trim(),
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updatePlan(d))
          : await window.apiPRL.addPlan(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error. ¿Código duplicado?", "error");
      }
    },
  },

  catalogo_epis: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-tipo-epi"),
        form: $("form-tipo-epi"),
        tbody: $("lista-tipos-epi"),
      };
      $("btn-nuevo-tipo-epi").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-tipo-epi").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarTipo(e));
      this.recargarTabla();
    },
    abrirModal(t = null) {
      document.querySelector("#modal-tipo-epi h2").textContent = t
        ? "Editar EPI"
        : "Añadir EPI";
      if (t) {
        $("form-tipo-epi-id").value = t.id;
        $("form-tipo-epi-nombre").value = t.nombre;
        $("form-tipo-epi-normativa").value = t.normativa || "";
        $("form-tipo-epi-descripcion").value = t.descripcion || "";
      } else {
        this.DOM.form.reset();
        $("form-tipo-epi-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getTiposEpisActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (t) =>
            `<tr><td><strong>${t.nombre}</strong></td><td>${t.normativa || "-"}</td><td>${t.descripcion || "-"}</td><td class="cell-actions"><button class="btn btn--primary hook-edit-tipo-epi" data-id="${t.id}">Editar</button> <button class="btn btn--danger hook-del-tipo-epi" data-id="${t.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-tipos-epi",
        data,
        (t) => this.abrirModal(t),
        "¿Eliminar equipo del catálogo?",
        (id) => window.apiPRL.deleteTipoEpi(id),
        () => this.recargarTabla(),
      );
    },
    async guardarTipo(e) {
      e.preventDefault();
      const id = $("form-tipo-epi-id").value,
        d = {
          nombre: $("form-tipo-epi-nombre").value.trim(),
          normativa: $("form-tipo-epi-normativa").value.trim() || null,
          descripcion: $("form-tipo-epi-descripcion").value.trim() || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateTipoEpi(d))
          : await window.apiPRL.addTipoEpi(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  registro_epis: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-epi"),
        form: $("form-epi"),
        tbody: $("lista-epis-entregados"),
      };
      $("btn-nuevo-epi").addEventListener("click", () => this.abrirModal());
      $("btn-cerrar-epi").addEventListener("click", () => this.cerrarModal());
      this.DOM.form.addEventListener("submit", (e) => this.guardarEntrega(e));
      this.recargarTabla();
    },
    async abrirModal(e = null) {
      const [tr, ti] = await Promise.all([
        window.apiPRL.getTrabajadoresActuales(),
        window.apiPRL.getTiposEpisActuales(),
      ]);
      $("form-epi-trabajador").innerHTML =
        '<option value="" disabled selected>-- Elige Trabajador --</option>' +
        (tr || [])
          .map((t) => `<option value="${t.id}">${t.nombre} (${t.dni})</option>`)
          .join("");
      $("form-epi-tipo").innerHTML =
        '<option value="" disabled selected>-- Elige Equipo --</option>' +
        (ti || [])
          .map((te) => `<option value="${te.id}">${te.nombre}</option>`)
          .join("");
      if (e) {
        $("form-epi-id").value = e.id;
        $("form-epi-trabajador").value = e.trabajador;
        $("form-epi-tipo").value = e.tipo;
        $("form-epi-marca").value = e.marca_modelo || "";
        $("form-epi-fecha").value = e.fecha_entrega || "";
        $("form-epi-caducidad").value = e.fecha_caducidad || "";
      } else {
        this.DOM.form.reset();
        $("form-epi-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getEpisActuales();
      const hoy = new Date();
      this.DOM.tbody.innerHTML = (data || [])
        .map((e) => {
          const caducado =
            e.fecha_caducidad && new Date(e.fecha_caducidad) < hoy;
          return `<tr><td><strong>${e.trabajador_nombre}</strong> <small>(${e.dni})</small></td><td>${e.epi_nombre || "<em>Borrado</em>"}</td><td>${e.marca_modelo || "-"}</td><td>${e.fecha_entrega || "-"}</td><td style="${caducado ? "color:#c0392b;font-weight:bold;" : ""}">${e.fecha_caducidad || "No caduca"} ${caducado ? "⚠️" : ""}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-epi" data-id="${e.id}">Editar</button> <button class="btn btn--danger hook-del-epi" data-id="${e.id}">X</button></td></tr>`;
        })
        .join("");
      Utils.asignarEventos(
        "#lista-epis-entregados",
        data,
        (e) => this.abrirModal(e),
        "¿Borrar registro de entrega?",
        (id) => window.apiPRL.deleteEpi(id),
        () => this.recargarTabla(),
      );
    },
    async guardarEntrega(e) {
      e.preventDefault();
      const id = $("form-epi-id").value,
        d = {
          trabajador: $("form-epi-trabajador").value,
          tipo: $("form-epi-tipo").value || null,
          marca_modelo: $("form-epi-marca").value.trim() || null,
          fecha_entrega: $("form-epi-fecha").value || null,
          fecha_caducidad: $("form-epi-caducidad").value || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateEpi(d))
          : await window.apiPRL.addEpi(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  investigaciones: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-investigacion"),
        form: $("form-investigacion"),
        tbody: $("lista-investigaciones"),
      };
      $("btn-nueva-investigacion").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-investigacion").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) =>
        this.guardarInvestigacion(e),
      );
      this.recargarTabla();
    },
    async abrirModal(i = null) {
      const tr = await window.apiPRL.getTrabajadoresActuales();
      $("form-inv-trabajador").innerHTML =
        '<option value="" disabled selected>-- Elige Trabajador --</option>' +
        (tr || [])
          .map((t) => `<option value="${t.id}">${t.nombre} (${t.dni})</option>`)
          .join("");
      if (i) {
        $("form-inv-id").value = i.id;
        $("form-inv-codigo").value = i.codigo;
        $("form-inv-fecha").value = i.fecha;
        $("form-inv-trabajador").value = i.trabajador;
        $("form-inv-tipo").value = i.tipo;
        $("form-inv-estado").value = i.estado || "pendiente";
        $("form-inv-descripcion").value = i.descripcion || "";
        $("form-inv-causas").value = i.causas || "";
        $("form-inv-medidas").value = i.medidas_correctivas || "";
      } else {
        this.DOM.form.reset();
        $("form-inv-id").value = "";
        $("form-inv-estado").value = "pendiente";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getInvestigacionesActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map((i) => {
          const col =
            i.estado === "pendiente"
              ? "#e74c3c"
              : i.estado === "en proceso"
                ? "#f39c12"
                : "#27ae60";
          return `<tr><td><strong>${i.codigo}</strong></td><td>${i.trabajador_nombre} <small>(${i.dni})</small></td><td>${i.tipo}</td><td>${i.fecha}</td><td style="color: ${col}; font-weight: bold; text-transform: capitalize;">${i.estado}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-inv" data-id="${i.id}">Editar</button> <button class="btn btn--danger hook-del-inv" data-id="${i.id}">X</button></td></tr>`;
        })
        .join("");
      Utils.asignarEventos(
        "#lista-investigaciones",
        data,
        (i) => this.abrirModal(i),
        "¿Archivar investigación?",
        (id) => window.apiPRL.deleteInvestigacion(id),
        () => this.recargarTabla(),
      );
    },
    async guardarInvestigacion(e) {
      e.preventDefault();
      const id = $("form-inv-id").value,
        d = {
          codigo: $("form-inv-codigo").value.trim(),
          fecha: $("form-inv-fecha").value,
          trabajador: $("form-inv-trabajador").value,
          tipo: $("form-inv-tipo").value,
          estado: $("form-inv-estado").value,
          descripcion: $("form-inv-descripcion").value.trim() || null,
          causas: $("form-inv-causas").value.trim() || null,
          medidas_correctivas: $("form-inv-medidas").value.trim() || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateInvestigacion(d))
          : await window.apiPRL.addInvestigacion(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error. ¿Código duplicado?", "error");
      }
    },
  },

  equipos: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-equipo"),
        form: $("form-equipo"),
        tbody: $("lista-equipos"),
      };
      $("btn-nuevo-equipo").addEventListener("click", () => this.abrirModal());
      $("btn-cerrar-equipo").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarEquipo(e));
      this.recargarTabla();
    },
    abrirModal(e = null) {
      document.querySelector("#modal-equipo h2").textContent = e
        ? "Editar Equipo"
        : "Alta de Equipo";
      if (e) {
        $("form-eq-id").value = e.id;
        $("form-eq-codigo").value = e.codigo;
        $("form-eq-nombre").value = e.nombre;
        $("form-eq-ubicacion").value = e.ubicacion || "";
        $("form-eq-fecha").value = e.fecha_compra || "";
      } else {
        this.DOM.form.reset();
        $("form-eq-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getEquiposActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (e) =>
            `<tr><td><strong>${e.codigo}</strong></td><td>${e.nombre}</td><td>${e.ubicacion || "-"}</td><td>${e.fecha_compra || "-"}</td><td class="cell-actions"><button class="btn btn--primary hook-edit-eq" data-id="${e.id}">Editar</button> <button class="btn btn--danger hook-del-eq" data-id="${e.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-equipos",
        data,
        (e) => this.abrirModal(e),
        "¿Dar de baja este equipo?",
        (id) => window.apiPRL.deleteEquipo(id),
        () => this.recargarTabla(),
      );
    },
    async guardarEquipo(ev) {
      ev.preventDefault();
      const id = $("form-eq-id").value,
        d = {
          codigo: $("form-eq-codigo").value.trim(),
          nombre: $("form-eq-nombre").value.trim(),
          ubicacion: $("form-eq-ubicacion").value.trim() || null,
          fecha_compra: $("form-eq-fecha").value || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateEquipo(d))
          : await window.apiPRL.addEquipo(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error. ¿Código duplicado?", "error");
      }
    },
  },

  mantenimientos: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-mantenimiento"),
        form: $("form-mantenimiento"),
        tbody: $("lista-mantenimientos"),
      };
      $("btn-nuevo-mantenimiento").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-mantenimiento").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) =>
        this.guardarMantenimiento(e),
      );
      this.recargarTabla();
    },
    async abrirModal(m = null) {
      const [eq, pe] = await Promise.all([
        window.apiPRL.getEquiposActuales(),
        window.apiPRL.getPersonasActuales(),
      ]);
      $("form-mant-equipo").innerHTML =
        '<option value="" disabled selected>-- Elige Equipo --</option>' +
        (eq || [])
          .map(
            (e) => `<option value="${e.id}">[${e.codigo}] ${e.nombre}</option>`,
          )
          .join("");
      $("form-mant-responsable").innerHTML =
        '<option value="" disabled selected>-- Elige Responsable --</option>' +
        (pe || [])
          .map((p) => `<option value="${p.id}">${p.nombre} (${p.dni})</option>`)
          .join("");
      if (m) {
        $("form-mant-id").value = m.id;
        $("form-mant-equipo").value = m.equipo;
        $("form-mant-tipo").value = m.tipo;
        $("form-mant-responsable").value = m.responsable;
        $("form-mant-prog").value = m.fecha_programada;
        $("form-mant-real").value = m.fecha_realizada || "";
        $("form-mant-obs").value = m.observaciones || "";
      } else {
        this.DOM.form.reset();
        $("form-mant-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getMantenimientosActuales();
      const hoy = new Date();
      this.DOM.tbody.innerHTML = (data || [])
        .map((m) => {
          const retrasado =
            !m.fecha_realizada && new Date(m.fecha_programada) < hoy;
          return `<tr><td><strong>${m.equipo_nombre}</strong> <small>[${m.equipo_codigo}]</small></td><td style="color:${m.tipo === "preventivo" ? "#2980b9" : "#e67e22"}; text-transform:capitalize;">${m.tipo}</td>
                <td style="${retrasado ? "color:#c0392b;font-weight:bold;" : ""}">${m.fecha_programada} ${retrasado ? "⚠️" : ""}</td><td>${m.fecha_realizada ? `<span style="color:#27ae60;">${m.fecha_realizada}</span>` : "Pendiente"}</td><td>${m.responsable_nombre || "<em>No asignado</em>"}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-mant" data-id="${m.id}">Editar</button> <button class="btn btn--danger hook-del-mant" data-id="${m.id}">X</button></td></tr>`;
        })
        .join("");
      Utils.asignarEventos(
        "#lista-mantenimientos",
        data,
        (m) => this.abrirModal(m),
        "¿Eliminar mantenimiento?",
        (id) => window.apiPRL.deleteMantenimiento(id),
        () => this.recargarTabla(),
      );
    },
    async guardarMantenimiento(e) {
      e.preventDefault();
      const id = $("form-mant-id").value,
        d = {
          equipo: $("form-mant-equipo").value,
          tipo: $("form-mant-tipo").value,
          responsable: $("form-mant-responsable").value,
          fecha_programada: $("form-mant-prog").value,
          fecha_realizada: $("form-mant-real").value || null,
          observaciones: $("form-mant-obs").value.trim() || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateMantenimiento(d))
          : await window.apiPRL.addMantenimiento(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  emergencias: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-simulacro"),
        form: $("form-simulacro"),
        tbody: $("lista-simulacros"),
        modalAddPart: $("modal-add-participante"),
        formAddPart: $("form-add-part"),
      };
      $("btn-nuevo-simulacro").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-simulacro").addEventListener("click", () =>
        Utils.cerrarModal(this.DOM.modal),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarSimulacro(e));
      $("btn-cerrar-add-part").addEventListener("click", () =>
        Utils.cerrarModal(this.DOM.modalAddPart),
      );
      this.DOM.formAddPart.addEventListener("submit", (e) =>
        this.guardarParticipanteRapido(e),
      );
      this.recargarTabla();
    },
    async abrirModal(s = null) {
      const [pe, tr] = await Promise.all([
        window.apiPRL.getPersonasActuales(),
        window.apiPRL.getTrabajadoresActuales(),
      ]);
      $("form-sim-responsable").innerHTML =
        '<option value="" disabled selected>-- Elige Responsable --</option>' +
        (pe || [])
          .map((p) => `<option value="${p.id}">${p.nombre} (${p.dni})</option>`)
          .join("");
      $("form-sim-participantes").innerHTML = (tr || [])
        .map((t) => `<option value="${t.id}">${t.nombre}</option>`)
        .join("");

      if (s) {
        $("form-sim-id").value = s.id;
        $("form-sim-tipo").value = s.tipo;
        $("form-sim-fecha").value = s.fecha_simulacro;
        $("form-sim-descripcion").value = s.descripcion;
        $("form-sim-responsable").value = s.responsable;
        const ids = s.participantes_ids ? s.participantes_ids.split(",") : [];
        Array.from($("form-sim-participantes").options).forEach(
          (opt) => (opt.selected = ids.includes(opt.value)),
        );
      } else {
        this.DOM.form.reset();
        $("form-sim-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    async abrirModalParticipante(s) {
      $("form-add-part-simulacro-id").value = s.id;
      const idsEx = s.participantes_ids
        ? s.participantes_ids.split(",").map((i) => i.trim())
        : [];
      const tr = await window.apiPRL.getTrabajadoresActuales();
      const filt = (tr || []).filter((t) => !idsEx.includes(t.id.toString()));
      $("form-add-part-trabajador").innerHTML = filt.length
        ? '<option value="" disabled selected>-- Selecciona un trabajador --</option>' +
          filt
            .map((t) => `<option value="${t.id}">${t.nombre}</option>`)
            .join("")
        : '<option value="" disabled selected>✅ Todos añadidos</option>';
      this.DOM.modalAddPart.classList.add("active");
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getSimulacrosActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (
            s,
          ) => `<tr><td><strong>${s.tipo}</strong></td><td>${s.fecha_simulacro}</td><td class="cell-wrap">${s.descripcion}</td><td>${s.responsable_nombre || "-"}</td><td class="cell-wrap" style="color: #555; font-size: 0.9em;">${s.participantes_nombres || "<em>Sin asistentes</em>"}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-sim" data-id="${s.id}">Editar</button> <button class="btn btn--secondary hook-add-part" data-id="${s.id}">+ Participante</button> <button class="btn btn--danger hook-del-sim" data-id="${s.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-simulacros",
        data,
        (s) => this.abrirModal(s),
        "¿Archivar simulacro?",
        (id) => window.apiPRL.deleteSimulacro(id),
        () => this.recargarTabla(),
      );
      $$(".hook-add-part").forEach((b) =>
        b.addEventListener("click", (e) =>
          this.abrirModalParticipante(
            data.find((s) => s.id == e.currentTarget.dataset.id),
          ),
        ),
      );
    },
    async guardarSimulacro(e) {
      e.preventDefault();
      const id = $("form-sim-id").value,
        d = {
          tipo: $("form-sim-tipo").value,
          fecha_simulacro: $("form-sim-fecha").value,
          responsable: $("form-sim-responsable").value || null,
          descripcion: $("form-sim-descripcion").value.trim(),
          participantes: Array.from(
            $("form-sim-participantes").selectedOptions,
          ).map((o) => o.value),
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateSimulacro(d))
          : await window.apiPRL.addSimulacro(d);
        Utils.cerrarModal(this.DOM.modal);
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
    async guardarParticipanteRapido(e) {
      e.preventDefault();
      try {
        const res = await window.apiPRL.addParticipanteRapido({
          simulacro: $("form-add-part-simulacro-id").value,
          trabajador: $("form-add-part-trabajador").value,
        });
        Notificador?.mostrar(
          res === false ? "Ya está en el simulacro." : "Añadido con éxito.",
          res === false ? "warning" : "success",
        );
        Utils.cerrarModal(this.DOM.modalAddPart);
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  condiciones_trabajo: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-inspeccion"),
        form: $("form-inspeccion"),
        tbody: $("lista-inspecciones"),
      };
      $("btn-nueva-inspeccion").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-inspeccion").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) =>
        this.guardarInspeccion(e),
      );
      this.recargarTabla();
    },
    async abrirModal(i = null) {
      const [se, pe] = await Promise.all([
        window.apiPRL.getSeccionesActuales(),
        window.apiPRL.getPersonasActuales(),
      ]);
      $("form-insp-seccion").innerHTML =
        '<option value="">-- Ninguna / General --</option>' +
        (se || [])
          .map((s) => `<option value="${s.id}">${s.nombre}</option>`)
          .join("");
      $("form-insp-responsable").innerHTML =
        '<option value="">-- Sin asignar --</option>' +
        (pe || [])
          .map((p) => `<option value="${p.id}">${p.nombre} (${p.dni})</option>`)
          .join("");
      if (i) {
        $("form-insp-id").value = i.id;
        $("form-insp-tipo").value = i.tipo_inspeccion;
        $("form-insp-fecha").value = i.fecha;
        $("form-insp-seccion").value = i.seccion || "";
        $("form-insp-ubicacion").value = i.ubicacion_exacta;
        $("form-insp-responsable").value = i.responsable || "";
        $("form-insp-resultado").value = i.resultado;
        $("form-insp-medidas").value = i.medidas_correctivas || "";
        $("form-insp-estado").value = i.estado || "pendiente";
      } else {
        this.DOM.form.reset();
        $("form-insp-id").value = "";
        $("form-insp-estado").value = "pendiente";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getInspeccionesActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map((i) => {
          const col =
            i.estado === "en proceso"
              ? "#f39c12"
              : i.estado === "subsanado"
                ? "#27ae60"
                : "#e74c3c";
          return `<tr><td><strong>${i.tipo_inspeccion}</strong></td><td>${i.seccion_nombre || "<em>General</em>"}</td><td>${i.ubicacion_exacta}</td><td>${i.fecha}</td><td style="color:${col};font-weight:bold;text-transform:capitalize;">${i.estado}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-insp" data-id="${i.id}">Editar</button> <button class="btn btn--danger hook-del-insp" data-id="${i.id}">X</button></td></tr>`;
        })
        .join("");
      Utils.asignarEventos(
        "#lista-inspecciones",
        data,
        (i) => this.abrirModal(i),
        "¿Archivar informe?",
        (id) => window.apiPRL.deleteInspeccion(id),
        () => this.recargarTabla(),
      );
    },
    async guardarInspeccion(e) {
      e.preventDefault();
      const id = $("form-insp-id").value,
        d = {
          tipo_inspeccion: $("form-insp-tipo").value,
          fecha: $("form-insp-fecha").value,
          seccion: $("form-insp-seccion").value || null,
          ubicacion_exacta: $("form-insp-ubicacion").value.trim(),
          responsable: $("form-insp-responsable").value || null,
          resultado: $("form-insp-resultado").value.trim(),
          medidas_correctivas: $("form-insp-medidas").value.trim() || null,
          estado: $("form-insp-estado").value,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateInspeccion(d))
          : await window.apiPRL.addInspeccion(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  participacion_consultas: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-consulta"),
        form: $("form-consulta"),
        tbody: $("lista-consultas"),
        modalAddPart: $("modal-con-add-participante"),
        formAddPart: $("form-con-add-part"),
      };
      $("btn-nueva-consulta").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-consulta").addEventListener("click", () =>
        Utils.cerrarModal(this.DOM.modal),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarConsulta(e));
      $("btn-cerrar-con-add-part").addEventListener("click", () =>
        Utils.cerrarModal(this.DOM.modalAddPart),
      );
      this.DOM.formAddPart.addEventListener("submit", (e) =>
        this.guardarParticipanteRapido(e),
      );
      this.recargarTabla();
    },
    async abrirModal(c = null) {
      const pe = await window.apiPRL.getPersonasActuales();
      $("form-con-participantes").innerHTML = (pe || [])
        .map((p) => `<option value="${p.id}">${p.nombre} (${p.dni})</option>`)
        .join("");
      if (c) {
        $("form-con-id").value = c.id;
        $("form-con-tipo").value = c.tipo_consulta;
        $("form-con-fecha").value = c.fecha;
        $("form-con-descripcion").value = c.descripcion;
        $("form-con-acuerdos").value = c.acuerdos || "";
        const ids = c.participantes_ids ? c.participantes_ids.split(",") : [];
        Array.from($("form-con-participantes").options).forEach(
          (opt) => (opt.selected = ids.includes(opt.value)),
        );
      } else {
        this.DOM.form.reset();
        $("form-con-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    async abrirModalParticipante(c) {
      $("form-con-add-part-id").value = c.id;
      const idsEx = c.participantes_ids
        ? c.participantes_ids.split(",").map((i) => i.trim())
        : [];
      const pe = await window.apiPRL.getPersonasActuales();
      const filt = (pe || []).filter((p) => !idsEx.includes(p.id.toString()));
      $("form-con-add-part-persona").innerHTML = filt.length
        ? '<option value="" disabled selected>-- Selecciona persona --</option>' +
          filt
            .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
            .join("")
        : '<option value="" disabled selected>✅ Todos ya asisten</option>';
      this.DOM.modalAddPart.classList.add("active");
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getConsultasActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (
            c,
          ) => `<tr><td><strong>${c.tipo_consulta}</strong></td><td>${c.fecha}</td><td class="cell-wrap">${c.descripcion}</td><td class="cell-wrap">${c.acuerdos || "<em>Sin acuerdos</em>"}</td><td class="cell-wrap" style="color:#555;font-size:0.9em;">${c.participantes_nombres || "<em>Sin asistentes</em>"}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-con" data-id="${c.id}">Editar</button> <button class="btn btn--secondary hook-add-part-con" data-id="${c.id}">+ Part.</button> <button class="btn btn--danger hook-del-con" data-id="${c.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-consultas",
        data,
        (c) => this.abrirModal(c),
        "¿Archivar acta?",
        (id) => window.apiPRL.deleteConsulta(id),
        () => this.recargarTabla(),
      );
      $$(".hook-add-part-con").forEach((b) =>
        b.addEventListener("click", (e) =>
          this.abrirModalParticipante(
            data.find((c) => c.id == e.currentTarget.dataset.id),
          ),
        ),
      );
    },
    async guardarConsulta(e) {
      e.preventDefault();
      const id = $("form-con-id").value,
        d = {
          tipo_consulta: $("form-con-tipo").value,
          fecha: $("form-con-fecha").value,
          descripcion: $("form-con-descripcion").value.trim(),
          acuerdos: $("form-con-acuerdos").value.trim() || null,
          participantes: Array.from(
            $("form-con-participantes").selectedOptions,
          ).map((o) => o.value),
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateConsulta(d))
          : await window.apiPRL.addConsulta(d);
        Utils.cerrarModal(this.DOM.modal);
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
    async guardarParticipanteRapido(e) {
      e.preventDefault();
      try {
        await window.apiPRL.addConsultaParticipanteRapido({
          consulta: $("form-con-add-part-id").value,
          persona: $("form-con-add-part-persona").value,
        });
        Notificador?.mostrar("Asistente vinculado.", "success");
        Utils.cerrarModal(this.DOM.modalAddPart);
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },

  documentos_catalogo: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-documento"),
        form: $("form-documento"),
        tbody: $("lista-documentos"),
      };
      $("btn-nuevo-documento").addEventListener("click", () =>
        this.abrirModal(),
      );
      $("btn-cerrar-documento").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarDocumento(e));
      this.recargarTabla();
    },
    abrirModal(d = null) {
      if (d) {
        $("form-doc-id").value = d.id;
        $("form-doc-codigo").value = d.codigo;
        $("form-doc-nombre").value = d.nombre;
        $("form-doc-tipo").value = d.tipo || "Procedimiento";
      } else {
        this.DOM.form.reset();
        $("form-doc-id").value = "";
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getDocumentosActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (d) =>
            `<tr><td><strong>${d.codigo}</strong></td><td>${d.nombre}</td><td>${d.tipo || "-"}</td><td class="cell-actions"><button class="btn btn--primary hook-edit-doc" data-id="${d.id}">Editar</button> <button class="btn btn--danger hook-del-doc" data-id="${d.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-documentos",
        data,
        (d) => this.abrirModal(d),
        "¿Dar de baja documento?",
        (id) => window.apiPRL.deleteDocumento(id),
        () => this.recargarTabla(),
      );
    },
    async guardarDocumento(e) {
      e.preventDefault();
      const id = $("form-doc-id").value,
        d = {
          codigo: $("form-doc-codigo").value.trim(),
          nombre: $("form-doc-nombre").value.trim(),
          tipo: $("form-doc-tipo").value,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateDocumento(d))
          : await window.apiPRL.addDocumento(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        Notificador?.mostrar("Error. ¿Código duplicado?", "error");
      }
    },
  },

  documentos_versiones: {
    DOM: {},
    init() {
      this.DOM = {
        modal: $("modal-version"),
        form: $("form-version"),
        tbody: $("lista-versiones"),
      };
      $("btn-nueva-version").addEventListener("click", () => this.abrirModal());
      $("btn-cerrar-version").addEventListener("click", () =>
        this.cerrarModal(),
      );
      this.DOM.form.addEventListener("submit", (e) => this.guardarVersion(e));
      this.recargarTabla();
    },
    async abrirModal(v = null) {
      const [doc, per] = await Promise.all([
        window.apiPRL.getDocumentosActuales(),
        window.apiPRL.getPersonasActuales(),
      ]);
      $("form-ver-documento").innerHTML =
        '<option value="" disabled selected>-- Elige Documento --</option>' +
        (doc || [])
          .map(
            (d) => `<option value="${d.id}">[${d.codigo}] ${d.nombre}</option>`,
          )
          .join("");
      $("form-ver-aprobado").innerHTML =
        '<option value="">-- Sin aprobador asignado --</option>' +
        (per || [])
          .map((p) => `<option value="${p.id}">${p.nombre} (${p.dni})</option>`)
          .join("");
      if (v) {
        $("form-ver-id").value = v.id;
        $("form-ver-documento").value = v.documento;
        $("form-ver-numero").value = v.version;
        $("form-ver-fecha").value = v.fecha;
        $("form-ver-cambios").value = v.cambios;
        $("form-ver-aprobado").value = v.aprobado_por || "";
      } else {
        this.DOM.form.reset();
        $("form-ver-id").value = "";
        $("form-ver-fecha").value = new Date().toISOString().split("T")[0];
      }
      this.DOM.modal.classList.add("active");
    },
    cerrarModal() {
      Utils.cerrarModal(this.DOM.modal);
    },
    async recargarTabla() {
      if (!this.DOM.tbody) return;
      const data = await window.apiPRL.getVersionesActuales();
      this.DOM.tbody.innerHTML = (data || [])
        .map(
          (
            v,
          ) => `<tr><td><strong>${v.doc_nombre}</strong> <br><small>[${v.doc_codigo}]</small></td><td><span style="background:var(--primary);color:white;padding:2px 6px;border-radius:4px;font-weight:bold;">v${v.version}</span></td><td>${v.fecha}</td><td class="cell-wrap">${v.cambios}</td><td>${v.aprobado_nombre || "<em>Pendiente</em>"}</td>
                <td class="cell-actions"><button class="btn btn--primary hook-edit-ver" data-id="${v.id}">Editar</button> <button class="btn btn--danger hook-del-ver" data-id="${v.id}">X</button></td></tr>`,
        )
        .join("");
      Utils.asignarEventos(
        "#lista-versiones",
        data,
        (v) => this.abrirModal(v),
        "¿Eliminar registro de versión?",
        (id) => window.apiPRL.deleteVersion(id),
        () => this.recargarTabla(),
      );
    },
    async guardarVersion(e) {
      e.preventDefault();
      const id = $("form-ver-id").value,
        d = {
          documento: $("form-ver-documento").value,
          version: $("form-ver-numero").value.trim(),
          fecha: $("form-ver-fecha").value,
          cambios: $("form-ver-cambios").value.trim(),
          aprobado_por: $("form-ver-aprobado").value || null,
        };
      try {
        id
          ? ((d.id = id), await window.apiPRL.updateVersion(d))
          : await window.apiPRL.addVersion(d);
        this.cerrarModal();
        this.recargarTabla();
      } catch (err) {
        console.error(err);
      }
    },
  },
};

// ==========================================
// 5. MÓDULO DE NOTIFICACIONES GLOBALES
// ==========================================
const Notificador = {
  init() {
    if (window.apiPRL?.onNotificacion)
      window.apiPRL.onNotificacion((d) => this.mostrar(d.mensaje, d.tipo));
  },
  mostrar(mensaje, tipo = "info") {
    const c = $("toast-container");
    if (!c) return;
    const toast = document.createElement("div");
    toast.className = `toast toast--${tipo}`;
    toast.innerHTML = `<span>${mensaje}</span><span class="toast__close">&times;</span>`;
    toast
      .querySelector(".toast__close")
      .addEventListener("click", () => this.cerrar(toast));
    c.appendChild(toast);
    setTimeout(() => this.cerrar(toast), 4000);
  },
  cerrar(t) {
    if (!t.classList.contains("fade-out")) {
      t.classList.add("fade-out");
      t.addEventListener("animationend", () => t.remove());
    }
  },
};

// ==========================================
// 6. ARRANQUE Y LOGIN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  Notificador.init();  
  document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('input-password').value;
        const btn = e.target.querySelector('button');
        
        btn.textContent = 'Desbloqueando...';
        btn.disabled = true;

        const resultado = await window.apiPRL.iniciarSesion(pwd);

        if (resultado) {
            document.getElementById('pantalla-bloqueo').remove();
            
            GestorEmpresas.init(); 
            Navegacion.init(); 
        } else {
            btn.textContent = 'Desbloquear';
            btn.disabled = false;
        }
    });
});
