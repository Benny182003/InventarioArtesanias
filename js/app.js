// js/app.js
const app = {
    currentView: 'stock',
    views: {},

    init: async function () {
        // Inicializar Supabase
        this.initSupabase();
        const theme = localStorage.getItem("theme");

        if (theme === "dark") {
            document.body.setAttribute("data-theme", "dark");
            document.getElementById("themeSwitch")?.classList.add("on");
        }
        // Cargar componentes
        await this.loadComponent('sidebar', '/components/sidebar.html');
        await this.loadComponent('topbar', '/components/topbar.html');
        await this.loadComponent('modals', '/components/modals.html');

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar vista inicial
        await this.loadView('stock');

        // Cargar datos iniciales
        this.loadInitialData();


    },

    initSupabase: function () {
        const supabaseUrl = "https://lpfrvothrdgbelrashfw.supabase.co"
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZnJ2b3RocmRnYmVscmFzaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzgxODksImV4cCI6MjA5OTU1NDE4OX0.oz8GT_P8v1g5yAe2fSxIXzHLwZgLzwFjSPWzrD9YRY4"

        this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        window.supabase = this.supabase;
    },

    loadComponent: async function (containerId, url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            document.getElementById(containerId).innerHTML = html;
        } catch (error) {
            console.error(`Error cargando componente ${containerId}:`, error);
        }
    },

    loadView: async function (viewName) {
        try {
            const response = await fetch(`/views/${viewName}.html`);
            const html = await response.text();
            document.getElementById('content').innerHTML = html;

            if (this.views[viewName]) {
                this.views[viewName].init();
            }
            this.currentView = viewName;

        } catch (error) {
            console.error(`Error cargando vista ${viewName}:`, error);
        }
    },

    setupEventListeners: function () {
        // Navegación por clicks en sidebar
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item[data-view]');
            if (navItem) {
                e.preventDefault();
                const viewName = navItem.dataset.view;
                this.showView(viewName, navItem);
            }
        });

        // Botones con data-view
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('[data-view]');
            if (viewBtn && !viewBtn.classList.contains('nav-item')) {
                e.preventDefault();
                this.showView(viewBtn.dataset.view);
            }
        });

        // Toggle sidebar
        document.getElementById("menuToggle").onclick = function () {

            const sidebar = document.getElementById("sidebar");
            const overlay = document.getElementById("sidebarOverlay");

            sidebar.classList.add("open");
            overlay.classList.add("show");

        };

        document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
            this.closeSidebar();
        });

        // Toggle theme
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
    },

    showView: function (viewName, element) {

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        if (element) {
            element.classList.add('active');
        } else {
            document.querySelector(`.nav-item[data-view="${viewName}"]`)
                ?.classList.add('active');
        }

        this.loadView(viewName);
        this.closeSidebar();
    },

    openSidebar: function () {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('active');
    },

    closeSidebar: function () {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        sidebar?.classList.remove('open');
        overlay?.classList.remove('show');
    },

    toggleTheme: function () {

        const isDark = document.body.getAttribute("data-theme") === "dark";

        if (isDark) {
            document.body.removeAttribute("data-theme");
        } else {
            document.body.setAttribute("data-theme", "dark");
        }

        document.getElementById("themeSwitch")
            ?.classList.toggle("on", !isDark);

        localStorage.setItem("theme", isDark ? "light" : "dark");
    },

    loadInitialData: async function () {
        try {
            const { data: types } = await this.supabase.from('tipo').select('*');
            window.cachedData = window.cachedData || {};
            window.cachedData.types = types;
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    },

    showToast: function (message, type = 'success') {

        const container = document.getElementById('toastContainer');

        if (!container) {
            console.error("No existe toastContainer");
            return;
        }

        const toast = document.createElement('div');

        toast.className = `app-toast app-toast-${type}`;

        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };

        toast.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
    `;

        container.appendChild(toast);


        // activar entrada
        setTimeout(() => {
            toast.classList.add("show");
        }, 10);


        // salida después de 3 segundos
        setTimeout(() => {

            toast.classList.remove("show");
            toast.classList.add("hide");

            setTimeout(() => {
                toast.remove();
            }, 350);

        }, 3000);
    }
};

// Objeto para modales
const modals = {
    open(modalId) {
        const modal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById(modalId)
        );
        modal.show();
    },

    close(modalId) {
        const modal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById(modalId)
        );
        modal.hide();
    },

    addVariantRow() {
        const container = document.getElementById('variantRows');
        const hint = document.getElementById('variantsHint');

        if (hint) hint.style.display = 'none';

        const row = document.createElement('div');
        row.className = 'variant-row';
        row.innerHTML = `
            <input type="text" placeholder="Ej: Talla M" class="variant-name">
            <input type="number" placeholder="Stock" class="variant-stock" value="0">
            <input type="number" placeholder="Precio" class="variant-price">
            <button type="button" class="btn-icon" onclick="this.closest('.variant-row').remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    }
};

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    window.modals = modals;
    app.init();
});

document.addEventListener("DOMContentLoaded", function () {

    const overlay = document.getElementById("sidebarOverlay");
    const sidebar = document.getElementById("sidebar");

    overlay?.addEventListener("click", function () {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    });
});

