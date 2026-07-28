const productService = {
    async getAll(order) {
        const productos = await supabaseService.getAll("producto", order);

        return productos.filter(p => p.visible === true);
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

    async obtenerTipoVariantes() {
        return supabaseService.getAll("tipo_variante");
    },

    async obtenerVariantes() {
        return supabaseService.getAll("variante");
    },
};
