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
        const { data, error } = await window.supabase
            .from("tipo")
            .select("*")
            .order("id");
        if (error) {
            console.error(error);
            return;
        }

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
                    ${cat.created_at
                ? new Date(cat.created_at).toLocaleDateString()
                : '-'}
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="action-btn edit"
                            onclick="categoriesView.editCategory('${cat.id}')">

                            <i class="fas fa-pen"></i>
                        </button>
                        <button
                            class="action-btn delete"
                            onclick="categoriesView.deleteCategory('${cat.id}')">

                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    saveCategory: async function () {
        const nombre = document
            .getElementById("cName")
            .value
            .trim();

        if (nombre === "") {
            app.showToast(
                "El nombre es requerido",
                "error"
            );
            return;
        }

        const disponible = await this.validateCategoryName(
            nombre,
            this.editingCategoryId
        );

        if (!disponible) {

            app.showToast(
                "Ya existe una categoría con ese nombre",
                "error"
            );

            return;
        }
        let error;
        if (this.editingCategoryId) {
            ({ error } = await window.supabase
                .from("tipo")
                .update({
                    nombre
                })
                .eq(
                    "id",
                    this.editingCategoryId
                ));

        } else {
            ({ error } = await window.supabase
                .from("tipo")
                .insert([{
                    nombre
                }]));
        }

        if (error) {
            console.error(error);

            app.showToast(
                error.message,
                "error"
            );
            return;
        }
        modals.close("categoryModal");
        const editando = this.editingCategoryId;
        this.editingCategoryId = null;
        this.clearForm();
        await this.renderTable();
        app.showToast(
            editando
                ? "Categoría actualizada"
                : "Categoría creada"
        );
    },

    editCategory: async function (id) {

        const { data, error } = await window.supabase
            .from("tipo")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            app.showToast(
                error.message,
                "error"
            );
            return;
        }

        this.editingCategoryId = id;

        document.getElementById("categoryModalTitle").innerHTML = "Actualizar categoría";
        document.getElementById("cName").value = data.nombre || "";
        modals.open("categoryModal");
    },



    deleteCategory: async function (id) {
        if (!confirm("¿Eliminar categoría?"))
            return;
        const { error } = await window.supabase
            .from("tipo")
            .delete()
            .eq("id", id);
        if (error) {
            app.showToast(
                error.message,
                "error"
            );
            return;
        }
        await this.renderTable();
        app.showToast(
            "Categoría eliminada"
        );
    },

    validateCategoryName: async function (nombre, id = null) {
        let query = window.supabase
            .from("tipo")
            .select("id")
            .eq("nombre", nombre);
        if (id) {
            query = query.neq(
                "id",
                id
            );
        }
        const { data, error } = await query;
        if (error)
            return false;

        return data.length === 0;
    },
    clearForm: function () {
        document.getElementById("cName").value = "";
    }
};

app.views = app.views || {};
app.views.categories = categoriesView;

window.categoriesView = categoriesView;