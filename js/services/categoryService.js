const categoryService = {
    async getAll(order) {
        return supabaseService.getAll("categoria", order);
    },

    async getByCod(cod) {
        return supabaseService.getByCod("categoria", cod);
    },

    async existsByName(name, cod = null) {
        return supabaseService.existsByName("categoria", name, cod);
    },

    async create(producto) {
        return supabaseService.create("categoria", producto);
    },

    async update(cod, producto) {
        return supabaseService.update("categoria", cod, producto);
    },

    async delete(cod) {
        return supabaseService.delete("categoria", cod);
    }
};
