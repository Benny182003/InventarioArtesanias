const movementService = {
    async getAll(fechaInicio, fechaFin) {
        const movimientos = await supabaseService.getMovements(fechaInicio, fechaFin);
        return movimientos.filter(m => m.producto.visible === true);
    },

    async getByCod(cod) {
        return supabaseService.getByCod("movimiento", cod);
    },

    async create(producto) {
        return supabaseService.create("movimiento", producto);
    },

    async update(cod, producto) {
        return supabaseService.update("movimiento", cod, producto);
    },

    async delete(cod) {
        return supabaseService.delete("movimiento", cod);
    }
};
