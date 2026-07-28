const categoriesView = {
    editingCategoryId: null,
    init: function () {
        this.renderTable();
    },

    openAddCategory: function () {
        categoriesView.editingCategoryId = null;

        document.getElementById("categoryModalTitle").innerHTML = 'Nueva Categoria';
        modals.open('categoryModal');
    },

    renderTable: async function () {

        const tbody = document.getElementById("categoriesTableBody");
        const empty = document.getElementById("categoriesEmpty");
        const data = await categoryService.getAll();

        if (!data || data.length === 0) {
            tbody.innerHTML = "";
            empty.style.display = "flex";
            return;
        }
        empty.style.display = "none";
        tbody.innerHTML = data.map(cat => `

            <tr>
                <td>
                    <strong>
                        ${cat.nombre}
                    </strong>
                </td>
                <td>
                    ${cat.descripcion || '-'}
                </td>  
                  <td>
                    ${cat.maneja_variantes
                        ? '<span class="badge badge-success">Si</span>'
                        : '<span class="badge badge-danger">No</span>'
                    }
                </td>  
                <td>
                    ${cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '-'}
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="action-btn edit"
                            onclick="categoriesView.editCategory('${cat.cod}')">

                            <i class="fas fa-pen"></i>
                        </button>
                        <button
                            class="action-btn delete"
                            onclick="categoriesView.deleteCategory('${cat.cod}')">

                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    saveCategory: async function () {

        const nombre = document.getElementById("cName").value.trim();
        const maneja_variantes = document.getElementById("cHasVariants").checked;

        if (nombre === "") {
            app.showToast("El nombre es requerido", "error");
            return;
        }

        const existe = await categoryService.existsByName(nombre, this.editingCategoryId);
        if (existe) {
            app.showToast("Ya existe una categoría con ese nombre", "error");
            return;
        }

        try {

            if (this.editingCategoryId) {
                await categoryService.update(this.editingCategoryId, { nombre, maneja_variantes });
            } else {
                await categoryService.create({ nombre });
            }

            modals.close("categoryModal");

            const editando = this.editingCategoryId;
            this.editingCategoryId = null;

            this.clearForm();
            await this.renderTable();

            app.showToast(editando ? "Categoría actualizada" : "Categoría creada");

        } catch (error) {
            console.error(error);
            app.showToast(error.message, "error");
        }
    },

    editCategory: async function (cod) {
        const data = await categoryService.getByCod(cod);
        this.editingCategoryId = cod;
        document.getElementById("categoryModalTitle").innerHTML = "Actualizar categoría";
        document.getElementById("cName").value = data.nombre || "";
        document.getElementById("cHasVariants").checked = data.maneja_variantes;
        modals.open("categoryModal");
    },

    deleteCategory: async function (cod) {
        const result = await Swal.fire({
            title: "¿Eliminar categoria?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e74c3c",
            cancelButtonColor: "#7f8c8d",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) {
            return;
        }

        await categoryService.delete(cod);
        await this.renderTable();
        app.showToast("Categoría eliminada correctamente");
    },

    clearForm: function () {
        document.getElementById("cName").value = "";
    }
};

app.views = app.views || {};
app.views.categories = categoriesView;

window.categoriesView = categoriesView;