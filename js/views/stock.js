const stocksView = {
    init: function () {
        this.setupEvents();
        this.render();
        this.loadProducts();
        productsView.cargarVariantes("dropFiltroVariante");
    },

    loadProducts: async function () {
        try {
            const data = await productService.getAll();
            const dropProducto = document.getElementById("dropProducto");

            if (dropProducto) {
                dropProducto.innerHTML =
                    '<option value="">Selecciona un producto</option>' +
                    data.map(p => `<option value="${p.cod}">${p.nombre}</option>`).join('');
            }

        } catch (error) {
            console.error("Error cargando productos:", error);
        }
    },

    setupEvents: function () {
        document.getElementById("stockSearch")?.addEventListener("input", () => this.render());
        document.getElementById("stockFilter")?.addEventListener("change", () => this.render());
        document.getElementById("dropFiltroVariante")?.addEventListener("change", () => this.render());
    },

    render: async function () {

        const tbody = document.getElementById("stockTableBody");

        try {

            const data = await productService.getAll();

            const search = document.getElementById("stockSearch")?.value.toLowerCase() || "";
            const filter = document.getElementById("stockFilter")?.value || "";
            const variante = document.getElementById("dropFiltroVariante")?.value || "";

            const products = data.filter(p => {
                let ok = p.nombre.toLowerCase().includes(search);

                if (filter === "available")
                    ok = ok && p.stock > 0;

                if (filter === "low")
                    ok = ok && p.stock > 0 && p.stock <= p.stock_minimo;

                if (filter === "empty")
                    ok = ok && p.stock <= 0;

                if (variante !== "")
                    ok = ok && Number(variante) === p.codvariante;

                return ok;
            });

            this.updateStats(data);

            tbody.innerHTML = products.map(p => `
            <tr>
                <td><strong>${p.nombre}</strong></td>
                <td>${p.variante ? `${p.variante.nombre}` : ""}</td>
                <td>${p.stock}</td>
                <td>${p.stock_minimo}</td>
                <td>${productsView.getStockBadge(p.stock, p.stock_minimo)}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit"
                                onclick="movementsView.open('${p.cod}')">
                            <i class="fas fa-plus-minus"></i>
                        </button>
                    </div>
                </td>
            </tr>`).join("");

        } catch (error) {
            console.error(error);
            app.showToast("Error al cargar los productos", "error");
        }
    },

    updateStats: function (products) {
        document.getElementById("stockTotalProducts").innerText = products.length;
        document.getElementById("stockNormal").innerText = products.filter(p => p.stock > 0 && p.stock > p.stock_minimo).length;
        document.getElementById("stockLow").innerText = products.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length;
        document.getElementById("stockEmpty").innerText = products.filter(p => p.stock <= 0).length;
    },

    badge: function (stock) {

        if (stock <= 0)
            return `<span class="badge badge-danger">
                    Agotado
                    </span>
                    `;

        if (stock <= 5)
            return `<span class="badge badge-warning">
                    Bajo
                    </span>
                    `;

        return `<span class="badge badge-success">
                Normal
                </span>
                `;

    },
};

app.views.stock = stocksView;
window.stocksView = stocksView;