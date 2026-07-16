const supabaseUrl = "https://lpfrvothrdgbelrashfw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZnJ2b3RocmRnYmVscmFzaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzgxODksImV4cCI6MjA5OTU1NDE4OX0.oz8GT_P8v1g5yAe2fSxIXzHLwZgLzwFjSPWzrD9YRY4"

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

async function test() {

    const { data, error } = await supabaseClient
        .from("articulo")
        .select("*")

    console.log("DATA:", data)
    console.log("ERROR:", error)
}

test()