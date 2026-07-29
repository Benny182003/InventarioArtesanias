const productService = {
    async getAll() {
        const productos = await supabaseService.getProducts();

        productos.sort((a, b) => {
            const ordenA = a.variante?.orden ?? Number.MAX_SAFE_INTEGER;
            const ordenB = b.variante?.orden ?? Number.MAX_SAFE_INTEGER;

            return ordenA - ordenB;
        });

        return productos.filter(p => p.visible);
    },

    async getByCod(cod) {
        return supabaseService.getByCod("producto", cod);
    },

    async existsByName(name, cod = null) {
        return supabaseService.existsByName("producto", name, cod);
    },

    async create(producto) {
        return supabaseService.create("producto", producto);
    },

    async update(cod, producto) {
        return supabaseService.update("producto", cod, producto);
    },

    async delete(cod) {
        return supabaseService.delete("producto", cod);
    },

    async obtenerVariantes() {
        return supabaseService.getAll("variante", "orden");
    },
};
