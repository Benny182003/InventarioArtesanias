const supabaseUrl = "https://lpfrvothrdgbelrashfw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZnJ2b3RocmRnYmVscmFzaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzgxODksImV4cCI6MjA5OTU1NDE4OX0.oz8GT_P8v1g5yAe2fSxIXzHLwZgLzwFjSPWzrD9YRY4"

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

const supabaseService = {
    async getAll(table, order = "nombre") {
        const { data, error } = await supabaseClient.from(table).select("*").order(order);
        if (error) throw error;
        return data;
    },

    async getByCod(table, cod) {
        const { data, error } = await supabaseClient.from(table).select("*").eq("cod", cod).single();
        if (error) throw error;
        return data;
    },

    async existsByName(table, name, cod = null) {

        const nombre = name.trim().toLowerCase();

        let query = supabaseClient
            .from(table)
            .select("cod")
            .ilike("nombre", nombre);

        if (cod) {
            query = query.neq("cod", cod);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.length > 0;
    },

    async create(table, values) {
        const { error } = await supabaseClient.from(table).insert(values);
        if (error) throw error;
    },

    async update(table, cod, values) {
        const { error } = await supabaseClient.from(table).update(values).eq("cod", cod);
        if (error) throw error;
    },

    async delete(table, cod) {
        const { error } = await supabaseClient.from(table).delete().eq("cod", cod);
        if (error) throw error;
    },

    async getMovements(fechaInicio, fechaFin) {

        let query = supabaseClient
            .from("movimiento")
            .select(`
            *,
            producto(nombre, visible)
        `)
            .order("created_at", { ascending: false });


        if (fechaInicio) {
            const inicioUTC = new Date(`${fechaInicio}T00:00:00-05:00`).toISOString();
            query = query.gte("created_at", inicioUTC);
        }

        if (fechaFin) {
            const finUTC = new Date(`${fechaFin}T23:59:59-05:00`).toISOString();
            query = query.lte("created_at", finUTC);
        }


        const { data, error } = await query;

        if (error) {
            console.error(error);
            throw error;
        }

        return data;
    },

    async getProducts() {
        const { data, error } = await supabaseClient
            .from("producto")
            .select(`
                *,
                categoria(nombre),
                variante(
                    nombre,
                    orden
                )
            `)
            .order("nombre");

        if (error) {
            console.error(error);
            throw error;
        }

        return data;
    }
};
