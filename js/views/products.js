// js/views/products.js
const productsView = {
    editingProductId: null,
    init: function () {
        this.loadCategories();
        this.setupEventListeners();
        this.renderTable();
        this.cargarVariantes("filtroVariante");
    },

    cargarVariantes: async function (id) {
        try {
            const data = await productService.obtenerVariantes();
            const dropFiltroVariante = document.getElementById(id);

            if (dropFiltroVariante) {
                dropFiltroVariante.innerHTML =
                    '<option value="">Todas las variantes</option>' +
                    data.map(p => `<option value="${p.cod}">${p.nombre}</option>`).join('');
            }

            const pVariante = document.getElementById("pVariante");

            if (pVariante) {
                pVariante.innerHTML =
                    '<option value="">Seleccione una variante</option>' +
                    data.map(p => `<option value="${p.cod}">${p.nombre}</option>`).join('');
            }

        } catch (error) {
            console.error("Error cargando filtro de variantes:", error);
        }
    },

    openAddProduct: function () {
        this.cleanForm();

        document.getElementById("productModalTitle").innerHTML = 'Nuevo Producto';
        modals.open('productModal');
    },

    setupEventListeners: function () {
        const searchInput = document.getElementById('searchProducts');
        const filterCategory = document.getElementById('filterCategory');
        const filterStock = document.getElementById('filterStock');
        const filtroVariante = document.getElementById('filtroVariante');

        searchInput?.addEventListener('input', () => this.renderTable());
        filterCategory?.addEventListener('change', () => this.renderTable());
        filterStock?.addEventListener('change', () => this.renderTable());
        filtroVariante?.addEventListener('change', () => this.renderTable());
    },

    loadCategories: async function () {
        const data = await categoryService.getAll();
        const filterCategory = document.getElementById('filterCategory');

        if (filterCategory) {
            filterCategory.innerHTML =
                '<option value="">Todas las categorías</option>' +
                data.map(t =>
                    `<option value="${t.cod}">${t.nombre}</option>`
                ).join('');
        }

        const productCategory = document.getElementById('pCategory');

        if (productCategory) {
            productCategory.innerHTML =
                '<option value="">Selecciona una categoría</option>' +
                data.map(t =>
                    `<option value="${t.cod}">${t.nombre}</option>`
                ).join('');
        }
    },

    renderTable: async function () {

        const tbody = document.getElementById('productsTableBody');
        const emptyState = document.getElementById('productsEmpty');
        const data = await productService.getAll();


        const search = document.getElementById('searchProducts')?.value.toLowerCase().trim() || "";
        const category = document.getElementById('filterCategory')?.value || "";
        const stockFilter = document.getElementById('filterStock')?.value || "";
        const variante = document.getElementById('filtroVariante')?.value || "";

        // Filtrar productos
        const filteredProducts = data.filter(product => {

            // Buscar por nombre
            const matchSearch = product.nombre.toLowerCase().includes(search);

            // Filtrar categoría
            const matchCategory = category === "" || product.codcategoria == category;

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

            let matchVariante = true;

            if (variante !== "")
                matchVariante = Number(variante) === product.codvariante;

            return matchSearch && matchCategory && matchStock && matchVariante;
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
                ${product.categoria.nombre}
            </td>
            <td>
                ${product.variante ? `${product.variante.nombre}` : ""}
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
                        onclick="productsView.editProduct('${product.cod}')"
                        title="Editar">

                        <i class="fas fa-pen"></i>

                    </button>
                    <button
                        class="action-btn delete"
                        onclick="productsView.deleteProduct('${product.cod}')"
                        title="Eliminar">

                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
        const codvariante = document.getElementById("pVariante").value.trim() || null;

        const existe = await productService.existsByName(nombre, this.editingProductId);
        if (existe) {
            app.showToast("Ya existe un producto con ese nombre", "error");
            return;
        }

        try {
            const values =
            {
                nombre,
                codcategoria: categoria,
                precio,
                descripcion,
                stock,
                stock_minimo,
                codvariante
            }

            if (this.editingProductId) {
                await productService.update(this.editingProductId, values)
            } else {
                await productService.create(values)
            }

            await this.renderTable();

            const wasEditing = this.editingProductId;

            this.cleanForm();
            modals.close("productModal");
            app.showToast(wasEditing ? "Producto actualizado correctamente" : "Producto guardado correctamente");
        } catch (error) {

            console.error(error);
            app.showToast(error.message, "error");
        }

    },


    editProduct: async function (cod) {

        const data = await productService.getByCod(cod);
        this.editingProductId = cod;
        document.getElementById("productModalTitle").innerHTML = 'Actualizar Producto';
        document.getElementById("pName").value = data.nombre;
        document.getElementById("pCategory").value = data.codcategoria;
        document.getElementById("pPrice").value = data.precio;
        document.getElementById("pDesc").value = data.descripcion || "";
        document.getElementById("pStock").value = data.stock;
        document.getElementById("pStockMinimo").value = data.stock_minimo || "";
        document.getElementById("pVariante").value = data.codvariante || "";

        modals.open('productModal');
    },

    deleteProduct: async function (cod) {

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

        await productService.delete(cod);
        app.showToast("Producto eliminado correctamente.")
        await this.renderTable();
    },

    cleanForm: function () {
        this.editingProductId = null;
        document.getElementById("pName").value = "";
        document.getElementById("pCategory").value = "";
        document.getElementById("pPrice").value = "";
        document.getElementById("pDesc").value = "";
        document.getElementById("pStock").value = "0";
        document.getElementById("pStockMinimo").value = "";
        document.getElementById("pVariante").value = "";
    }
};

// Registrar la vista
app.views = app.views || {};
app.views.products = productsView;
window.productsView = productsView;