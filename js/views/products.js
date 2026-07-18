// js/views/products.js
const productsView = {
    editingProductId: null,
    init: function () {
        this.loadCategories();
        this.setupEventListeners();
        this.renderTable();
    },

    openAddProduct: function () {
        productsView.editingProductId = null;

        document.getElementById("productModalTitle").innerHTML = 'Nuevo Producto';
        modals.open('productModal');
    },

    setupEventListeners: function () {
        const searchInput = document.getElementById('searchProducts');
        const filterCategory = document.getElementById('filterCategory');
        const filterStock = document.getElementById('filterStock');

        searchInput?.addEventListener('input', () => this.renderTable());
        filterCategory?.addEventListener('change', () => this.renderTable());
        filterStock?.addEventListener('change', () => this.renderTable());
    },

    loadCategories: async function () {
        const { data, error } = await window.supabase
            .from('tipo')
            .select('*');

        if (error) {
            console.error("Error cargando categorías:", error);
            return;
        }

        window.cachedData = window.cachedData || {};
        window.cachedData.types = data;

        const filterCategory = document.getElementById('filterCategory');

        if (filterCategory) {
            filterCategory.innerHTML =
                '<option value="">Todas las categorías</option>' +
                data.map(t =>
                    `<option value="${t.id}">${t.nombre}</option>`        
                ).join('');
        }

        const productCategory = document.getElementById('pCategory');

        if (productCategory) {
            productCategory.innerHTML =
                '<option value="">Selecciona una categoría</option>' +
                data.map(t =>
                    `<option value="${t.id}">${t.nombre}</option>`
                ).join('');
        }
    },

    renderTable: async function () {

        const tbody = document.getElementById('productsTableBody');
        const emptyState = document.getElementById('productsEmpty');


        const { data: products, error } = await window.supabase
            .from('articulo')
            .select('*').order("nombre");


        if (error) {
            console.error(error);
            return;
        }


        const search = document.getElementById('searchProducts')?.value.toLowerCase().trim() || "";
        const category = document.getElementById('filterCategory')?.value || "";
        const stockFilter = document.getElementById('filterStock')?.value || "";

        // Filtrar productos
        const filteredProducts = products.filter(product => {

            // Buscar por nombre
            const matchSearch = product.nombre.toLowerCase().includes(search);

            // Filtrar categoría
            const matchCategory = category === "" || product.tipo_id == category;

            // Filtrar stock
            let matchStock = true;

            if (stockFilter === "available") {
                matchStock = product.stock > 0;
            }

            if (stockFilter === "low") {
                matchStock = product.stock > 0 && product.stock <= product.stock_minimo;
            }

            if (stockFilter === "empty") {
                matchStock = product.stock <= 0;
            }

            return matchSearch && matchCategory && matchStock;
        });

        if (!filteredProducts || filteredProducts.length === 0) {

            tbody.innerHTML = '';

            emptyState.style.display = 'flex';

            return;
        }

        emptyState.style.display = 'none';

        tbody.innerHTML = filteredProducts.map(product => `

        <tr>
            <td>
                <strong>${product.nombre}</strong>
            </td>
            <td>
                ${this.getCategoryName(product.tipo_id)}
            </td>
            <td>
                ${product.stock || 0}
            </td>
            <td>
                ${product.stock_minimo || 0}
            </td>
            <td>
                $${product.precio?.toLocaleString()}
            </td>
            <td>
                ${this.getStockBadge(product.stock, product.stock_minimo)}
            </td>
            <td>
                <div class="table-actions">

                    <button
                        class="action-btn edit"
                        onclick="productsView.editProduct('${product.id}')"
                        title="Editar">

                        <i class="fas fa-pen"></i>

                    </button>
                    <button
                        class="action-btn delete"
                        onclick="productsView.deleteProduct('${product.id}')"
                        title="Eliminar">

                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    },

    getCategoryName: function (tipoId) {
        const types = window.cachedData?.types || [];
        const type = types.find(t => t.id === tipoId);
        return type ? `${type.nombre}` : 'Sin categoría';
    },

    getStockBadge: function (stock, stock_minimo) {
        if (stock <= 0) return '<span class="badge badge-danger"><i class="fas fa-times"></i> Sin stock</span>';
        if (stock <= stock_minimo) return '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Bajo</span>';
        return '<span class="badge badge-success"><i class="fas fa-check"></i> Normal</span>';
    },

    saveProduct: async function () {

        if (!app.validateRequiredFields("validarProducto")) {
            return;
        }

        const nombre = document.getElementById("pName").value.trim();
        const categoria = document.getElementById("pCategory").value;
        const precio = Number(document.getElementById("pPrice").value || 0);
        const descripcion = document.getElementById("pDesc").value.trim();
        const stock = Number(document.getElementById("pStock").value || 0);
        const stock_minimo = document.getElementById("pStockMinimo").value.trim();

        const nombreDisponible = await this.validateProductName(
            nombre,
            this.editingProductId
        );

        if (!nombreDisponible) {
            app.showToast("Ya existe un producto con ese nombre", "error");
            return;
        }

        let error;

        if (this.editingProductId) {

            ({ error } = await window.supabase
                .from("articulo")
                .update({
                    nombre,
                    tipo_id: categoria,
                    precio,
                    descripcion,
                    stock,
                    stock_minimo
                })
                .eq("id", this.editingProductId));
        } else {

            ({ error } = await window.supabase
                .from("articulo")
                .insert([{
                    nombre,
                    tipo_id: categoria,
                    precio,
                    descripcion,
                    stock,
                    stock_minimo
                }]));
        }

        if (error) {
            console.error(error);
            app.showToast(error.message, "error");
            return;
        }

        // Limpiar formulario
        document.getElementById("pName").value = "";
        document.getElementById("pCategory").value = "";
        document.getElementById("pPrice").value = "";
        document.getElementById("pDesc").value = "";
        document.getElementById("pStock").value = "0";
        document.getElementById("pStockMinimo").value = "";

        await this.renderTable();

        const wasEditing = this.editingProductId;

        modals.close("productModal");
        this.editingProductId = null;

        app.showToast(wasEditing ? "Producto actualizado correctamente" : "Producto guardado correctamente");
    },

    editProduct: async function (id) {

        const { data, error } = await window.supabase
            .from("articulo")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            app.showToast(error.message, "error");
            return;
        }
        this.editingProductId = id;
        document.getElementById("productModalTitle").innerHTML = 'Actualizar Producto';
        document.getElementById("pName").value = data.nombre;
        document.getElementById("pCategory").value = data.tipo_id;
        document.getElementById("pPrice").value = data.precio;
        document.getElementById("pDesc").value = data.descripcion || "";
        document.getElementById("pStock").value = data.stock;
        document.getElementById("pStockMinimo").value = data.stock_minimo || "";

        modals.open('productModal');
    },
    deleteProduct: async function (id) {

        const result = await Swal.fire({
            title: "¿Eliminar producto?",
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


        const { error } = await window.supabase
            .from("articulo")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            app.showToast("No se pudo eliminar el producto.", "error")
            return;
        }
        app.showToast("Producto eliminado correctamente.")
        await this.renderTable();
    },
    validateProductName: async function (nombre, excludeId = null) {

        let query = window.supabase
            .from("articulo")
            .select("id")
            .eq("nombre", nombre);

        // Si estamos editando, ignorar el mismo registro
        if (excludeId) {
            query = query.neq("id", excludeId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error validando nombre:", error);
            return false;
        }

        return data.length === 0;
    },
};

// Registrar la vista
app.views = app.views || {};
app.views.products = productsView;
window.productsView = productsView;