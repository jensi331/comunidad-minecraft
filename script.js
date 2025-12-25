// ==========================================
// 0. SEGURIDAD Y REDIRECCIÓN (PRIMERO QUE NADA)
// ==========================================
(function gestionarSeguridad() {
    const path = window.location.pathname;
    const sesionActiva = localStorage.getItem('mc_session_active');

    // Identificamos las páginas
    const esLogin = path.endsWith('/index.html') || path.endsWith('/comunidad-minecraft/') || path.endsWith('/comunidad-minecraft');
    const esPaginaProtegida = path.includes('home.html') || 
                              path.includes('addons.html') || 
                              path.includes('texturas.html') || 
                              path.includes('shaders.html') ||
                              path.includes('admin.html');

    // Si ya tiene sesión y entra al login -> Mandarlo al Home
    if (esLogin && sesionActiva === 'true') {
        window.location.replace("home.html");
    }

    // Si NO tiene sesión e intenta entrar a páginas privadas -> Expulsarlo al Login
    if (esPaginaProtegida && sesionActiva !== 'true') {
        window.location.replace("index.html");
    }
})();

// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://qiaekarmrjroahcgfuks.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpYWVrYXJtcmpyb2FoY2dmdWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDM5NjIsImV4cCI6MjA4MjE3OTk2Mn0.7_VQXlXcrHW20mqpVQE7V8jIPyhDh8Rj1FDUmsUvq68';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. LÓGICA DEL BOTÓN DE CLIMA
// ==========================================
const btnTheme = document.getElementById('theme-toggle');

function aplicarClima(tema) {
    if (tema === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (btnTheme) btnTheme.innerText = "🌙 Modo Noche";
        localStorage.setItem('pref-clima', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        if (btnTheme) btnTheme.innerText = "☀️ Modo Día";
        localStorage.setItem('pref-clima', 'light');
    }
}

if (btnTheme) {
    btnTheme.addEventListener('click', () => {
        const esNoche = document.body.hasAttribute('data-theme');
        aplicarClima(esNoche ? 'light' : 'dark');
    });
}

// ==========================================
// 3. LÓGICA DE AUTENTICACIÓN
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert("¡Error de acceso!: " + error.message);
        } else {
            localStorage.setItem('mc_session_active', 'true');
            alert("¡Conexión establecida! Entrando al mundo...");
            window.location.replace("home.html");
        }
    });
}

async function registrarUsuario(e) {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (!email || !password) {
        alert("Por favor rellena todos los campos");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        alert("Error al registrar: " + error.message);
    } else {
        alert("✅ Registro enviado. Revisa tu correo.");
        window.location.replace("index.html"); 
    }
}

// ==========================================
// 4. CIERRE DE SESIÓN (MODIFICADO)
// ==========================================
const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('mc_session_active'); // Borramos la marca
        localStorage.clear(); // Limpieza total
        window.location.replace("index.html");
    });
}

// ==========================================
// 5. FUNCIONES MODAL Y RECURSOS
// ==========================================
function abrirDetalle(nombre, desc, img, link) {
    const modal = document.getElementById('modal-recurso');
    if (modal) {
        document.getElementById('modal-titulo').innerText = nombre;
        document.getElementById('modal-desc').innerText = desc;
        document.getElementById('modal-img').src = img;
        document.getElementById('modal-download').href = link;
        modal.style.display = 'flex';
    }
}

function cerrarDetalle() {
    const modal = document.getElementById('modal-recurso');
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal-recurso');
    if (event.target == modal) { modal.style.display = "none"; }
}

async function verificarAdmin() {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session?.user;
        const ADMIN_EMAIL = "fabianjensi@gmail.com";
        if (user && user.email === ADMIN_EMAIL) {
            const adminCard = document.getElementById('admin-card');
            if (adminCard) adminCard.style.display = "block";
        }
    });
}

async function cargarRecursos(cat) {
    const { data: recursos, error } = await supabaseClient
        .from('recursos')
        .select('*')
        .eq('categoria', cat);

    const grid = document.getElementById(`grid-${cat}`);
    if (!grid) return;
    grid.innerHTML = ""; 

    if (recursos && recursos.length === 0) {
        grid.innerHTML = "<p>No hay contenido disponible todavía.</p>";
        return;
    }

    recursos.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.onclick = () => abrirDetalle(item.nombre, item.descripcion, item.imagen, item.descarga);
        div.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}">
            <h3>${item.nombre}</h3>
            <p>Ver detalles</p>
        `;
        grid.appendChild(div);
    });
}

// ==========================================
// 6. PANEL MASTER
// ==========================================
async function subirRecurso() {
    const nombre = document.getElementById('nombre').value;
    const descarga = document.getElementById('descarga').value;
    // ... resto de tu lógica de subida (se mantiene igual)
}

async function cargarListaGestion() {
    const lista = document.getElementById('lista-gestion');
    if (!lista) return;
    const { data: recursos } = await supabaseClient.from('recursos').select('*');
    lista.innerHTML = "";
    if(recursos) {
        recursos.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "admin-item-row";
            itemDiv.style = "border-bottom: 1px solid #795548; padding: 10px; display: flex; justify-content: space-between; align-items: center;";
            itemDiv.innerHTML = `
                <span><strong>[${item.categoria.toUpperCase()}]</strong> ${item.nombre}</span>
                <button onclick="eliminarRecurso('${item.id}')" class="btn-eliminar">Borrar</button>
            `;
            lista.appendChild(itemDiv);
        });
    }
}

async function eliminarRecurso(id) {
    if (confirm("¿Seguro que quieres borrar este recurso?")) {
        await supabaseClient.from('recursos').delete().eq('id', id);
        location.reload();
    }
}

// INICIALIZACIÓN
window.onload = () => {
    const climaGuardado = localStorage.getItem('pref-clima');
    if (climaGuardado) aplicarClima(climaGuardado);
    verificarAdmin();
    if (document.getElementById('grid-addons')) cargarRecursos('addons');
    if (document.getElementById('grid-texturas')) cargarRecursos('texturas');
    if (document.getElementById('grid-shaders')) cargarRecursos('shaders');
    if (document.getElementById('lista-gestion')) cargarListaGestion();
};
