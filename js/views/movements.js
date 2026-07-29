const movementsView = {
    init: function () {
        this.setCurrentDate();
        this.loadHistory();
    },

    setCurrentDate: function () {
        const today = app.getCurrentDate();
        document.getElementById("txtFechaInicio").value = today;
        document.getElementById("txtFechaFin").value = today;
    },

    saveMovement: async function () {

        const cod = document.getElementById("dropProducto").value;
        const cantidad = Number(document.getElementById("stockQuantity").value);
        const tipo = document.getElementById("stockType").value;
        const motivo = document.getElementById("stockReason").value;

        if (cantidad <= 0) {
            app.showToast("Ingrese una cantidad mayor a 0", "error");
            return;
        }

        try {

            const product = await productService.getByCod(cod);

            if (!product) {
                app.showToast("Producto no encontrado", "error");
                return;
            }

            const nuevoStock = tipo === "0"
                ? product.stock + cantidad
                : product.stock - cantidad;

            if (nuevoStock < 0) {
                app.showToast("No hay suficiente stock", "error");
                return;
            }

            await movementService.create({
                codproducto: cod,
                tipo_movimiento: tipo,
                cantidad,
                motivo
            });

            await productService.update(cod, { stock: nuevoStock });

            modals.close("stockModal");

            await this.refreshViews();

            app.showToast("Movimiento registrado");

        } catch (error) {
            console.error(error);
            app.showToast(error.message, "error");
        }
    },

    async refreshViews() {

        if (stocksView?.render) {
            await stocksView.render();
        }

        const movementBody = document.getElementById("movementHistoryBody");

        if (movementBody && movementsView?.loadHistory) {
            await movementsView.loadHistory();
        }
    },

    loadHistory: async function () {

        const tbody = document.getElementById("movementHistoryBody");
        const emptyState = document.getElementById('movementsEmpty');

        const fechaInicio = document.getElementById("txtFechaInicio").value;
        const fechaFin = document.getElementById("txtFechaFin").value;

        if(new Date(fechaInicio) > new Date(fechaFin)){
            app.showToast("La fecha inicio no puede ser mayor a la fecha final", "error");
        }

        try {

            const data = await movementService.getAll(fechaInicio, fechaFin);
            if (!data || data.length === 0) {

                tbody.innerHTML = '';

                emptyState.style.display = 'flex';

                return;
            }

            emptyState.style.display = 'none';
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
                <td>${m.producto?.nombre ?? "-"}</td>
                <td>
                    ${m.tipo_movimiento == "0"
                    ? '<span class="badge badge-success">Entrada</span>'
                    : '<span class="badge badge-danger">Salida</span>'
                }
                </td>
                <td>${m.cantidad}</td>
                <td>${m.motivo || "-"}</td>
            </tr>
        `).join("");

        } catch (error) {

            console.error(error);
            app.showToast("Error al cargar el historial", "error");

        }

    },

    open: function (id = null) {

        const dropProducto = document.getElementById("dropProducto");

        if (id) {
            dropProducto.value = id;
            dropProducto.disabled = true;
        } else {
            dropProducto.value = "";
            dropProducto.disabled = false;
        }

        modals.open("stockModal");
    },

    clearForm: function () {
        document.getElementById("stockQuantity").value = "";
    }
};

app.views = app.views || {};
app.views.movements = movementsView;
window.movementsView = movementsView;