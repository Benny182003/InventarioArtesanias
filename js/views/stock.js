const stocksView = {
    currentProduct: null,
    init: function () {
        this.setupEvents();
        this.render();
    },

    setupEvents: function () {
        document.getElementById("stockSearch")?.addEventListener("input", () => this.render());
        document.getElementById("stockFilter")?.addEventListener("change", () => this.render());
    },

    render: async function () {

        const tbody = document.getElementById("stockTableBody");

        const { data, error } = await supabase
            .from("articulo")
            .select("*").order("nombre");

        if (error) return;

        let products = data;

        const search = document.getElementById("stockSearch")?.value.toLowerCase() || "";
        const filter = document.getElementById("stockFilter")?.value || "";

        products =
            products.filter(p => {
                let ok =
                    p.nombre
                        .toLowerCase()
                        .includes(search);

                if (filter === "available") {
                    ok = ok && p.stock > 0;
                }
                if (filter === "low")
                    ok = ok && p.stock > 0 && p.stock <= p.stock_minimo;

                if (filter === "empty")
                    ok = ok && p.stock <= 0;
                return ok;
            });

        this.updateStats(data);
        tbody.innerHTML =
            products.map(p => `
                <tr>
                    <td>
                        <strong>
                        ${p.nombre}
                        </strong>
                    </td>
                    <td>
                        ${p.stock}
                    </td>
                    <td>
                        ${p.stock_minimo}
                    </td>
                    <td>
                        ${productsView.getStockBadge(p.stock, p.stock_minimo)}
                    </td>
                    <td>
                        <div class='table-actions'>
                            <button class="action-btn edit" onclick="stocksView.open('${p.id}')">
                                <i class="fas fa-plus-minus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                `).join("");

        await this.loadHistory();
    },

    updateStats: function (products) {
        document.getElementById("stockTotalProducts").innerText = products.length;
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

    open: function (id) {
        this.currentProduct = id;
        supabase
            .from("articulo")
            .select("*")
            .eq("id", id)
            .single()
            .then(({ data }) => {
                document.getElementById("stockProductId").value = id;
                document.getElementById("stockProductName").value = data.nombre;
                modals.open("stockModal");
            });
    },

    saveMovement: async function () {

        const id = document.getElementById("stockProductId").value;
        const cantidad = Number(document.getElementById("stockQuantity").value);
        const tipo = document.getElementById("stockType").value;
        const motivo = document.getElementById("stockReason").value;

        if (cantidad <= 0) {
            app.showToast("Ingrese una cantidad mayor a 0", "error");
            return;
        }

        let nuevoStock;
        const { data: product } = await supabase
            .from("articulo")
            .select("stock")
            .eq("id", id)
            .single();

        if (tipo === "0")
            nuevoStock = product.stock + cantidad;
        else
            nuevoStock = product.stock - cantidad;

        if (nuevoStock < 0) {
            app.showToast("No hay suficiente stock", "error");
            return;
        }

        const { data, error } = await supabase
            .from("movimiento_stock")
            .insert({
                articulo_id: id,
                tipo_movimiento: tipo,
                cantidad,
                motivo
            });

        if (error) {
            app.showToast("No se pudo registrar el movimiento", "error");
            return;
        }


        await supabase
            .from("articulo")
            .update({
                stock: nuevoStock
            })
            .eq("id", id);


        modals.close("stockModal");
        this.render();

        app.showToast("Movimiento registrado");
    },

    loadHistory: async function () {

        const tbody = document.getElementById("movementHistoryBody");

        const { data, error } = await supabase
            .from("movimiento_stock")
            .select(`
            *,
            articulo(nombre)
        `)
            .order("created_at", { ascending: false });

        if (error) return;

        tbody.innerHTML = data.map(m => `

        <tr>

            <td>
                 ${new Date(m.created_at).toLocaleString("es-CO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                })}
            </td>

            <td>
                ${m.articulo?.nombre ?? "-"}
            </td>

            <td>

                ${m.tipo_movimiento == "0"
                ? '<span class="badge badge-success">Entrada</span>'
                : '<span class="badge badge-danger">Salida</span>'
            }

            </td>

            <td>
                ${m.cantidad}
            </td>

            <td>
                ${m.motivo || "-"}
            </td>

        </tr>

    `).join("");

    },
};

app.views.stock = stocksView;
window.stocksView = stocksView;