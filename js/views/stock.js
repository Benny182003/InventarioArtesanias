const stocksView = {


    currentProduct: null,



    init: function () {

        this.setupEvents();

        this.render();


    },



    setupEvents: function () {


        document
            .getElementById("stockSearch")
            ?.addEventListener(
                "input",
                () => this.render()
            );



        document
            .getElementById("stockFilter")
            ?.addEventListener(
                "change",
                () => this.render()
            );



    },




    render: async function () {


        const tbody =
            document.getElementById(
                "stockTableBody"
            );



        const { data, error } = await supabase
            .from("articulo")
            .select("*");



        if (error) return;



        let products = data;



        const search =
            document.getElementById(
                "stockSearch"
            )?.value
                .toLowerCase() || "";

        const filter =
            document.getElementById(
                "stockFilter"
            )?.value || "";

        products =
            products.filter(p => {
                let ok =
                    p.nombre
                        .toLowerCase()
                        .includes(search);

                if (filter === "low")
                    ok = ok && p.stock > 0 && p.stock <= 5;

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

${this.badge(p.stock)}

</td>



<td>

<div class='table-actions'>
<button
class="action-btn edit"

onclick="stocksView.open('${p.id}')">

<i class="fas fa-plus-minus"></i>

</button>
</div>



</td>



</tr>


`).join("");

    },




    updateStats: function (products) {


        document
            .getElementById("stockTotalProducts")
            .innerText =
            products.length;



        document
            .getElementById("stockLow")
            .innerText =
            products.filter(
                p => p.stock > 0 && p.stock <= 5
            ).length;



        document
            .getElementById("stockEmpty")
            .innerText =
            products.filter(
                p => p.stock <= 0
            ).length;


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


                document
                    .getElementById(
                        "stockProductId"
                    ).value = id;


                document
                    .getElementById(
                        "stockProductName"
                    ).value = data.nombre;



                modals.open("stockModal");


            });


    },


    saveMovement: async function () {

        const id =
            document.getElementById(
                "stockProductId"
            ).value;



        const cantidad =
            Number(
                document.getElementById(
                    "stockQuantity"
                ).value
            );



        const tipo =
            document.getElementById(
                "stockType"
            ).value;



        const motivo =
            document.getElementById(
                "stockReason"
            ).value;



        const { data: product } = await supabase
            .from("articulo")
            .select("stock")
            .eq("id", id)
            .single();

        let nuevoStock;

        if (tipo === "entrada")
            nuevoStock =
                product.stock + cantidad;

        else
            nuevoStock =
                product.stock - cantidad;


        if (nuevoStock < 0) {

            app.showToast(
                "No hay suficiente stock",
                "error"
            );

            return;

        }

        await supabase
            .from("articulo")
            .update({
                stock: nuevoStock
            })
            .eq("id", id);

        await supabase
            .from("movimiento_stock")
            .insert({

                articulo_id: id,

                tipo,

                cantidad,

                stock_anterior: product.stock,

                stock_nuevo: nuevoStock,

                motivo

            });

        modals.close("stockModal");
        this.render();

        app.showToast(
            "Movimiento registrado"
        );
    }
};

app.views.stock = stocksView;
window.stocksView = stocksView;