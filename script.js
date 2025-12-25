// ==========================================
// 0. SEGURIDAD Y REDIRECCIÓN AUTOMÁTICA
// ==========================================
(function gestionarSeguridad() {
    const path = window.location.pathname;
    const sesionActiva = localStorage.getItem('mc_session_active');

    // Ajuste de rutas para GitHub Pages
    const esLogin = path.endsWith('/index.html') || path.endsWith('/comunidad-minecraft/') || path.endsWith('/comunidad-minecraft');
    const esPaginaPrivada = path.includes('home.html') || path.includes('addons.html') || 
                             path.includes('texturas.html') || path.includes('shaders.html') || 
                             path.includes('admin.html');

    if (esLogin && sesionActiva === 'true') {
        window.location.replace("home.html");
    }

    if (esPaginaPrivada && sesionActiva !== 'true') {
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
// 2. LÓGICA DEL CLIMA (Día/Noche)
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
// 3. AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            alert("¡Error!: " + error.message);
        } else {
            localStorage.setItem('mc_session_active', 'true');
            window.location.replace("home.html");
        }
    });
}

async function registrarUsuario(e) {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            // Esto evita el error 404 al redireccionar
            emailRedirectTo: 'https://jensi331.github.io/comunidad-minecraft/index.html'
        }
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("✅ ¡Cuenta creada! Si desactivaste la confirmación en Supabase, ya puedes entrar.");
        window.location.replace("index.html");
    }
}

// ==========================================
// 4. CIERRE DE SESIÓN
// ==========================================
const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('mc_session_active');
        localStorage.clear();
        window.location.replace("index.html");
    });
}

// ==========================================
// 5. PANEL MASTER Y RECURSOS
// ==========================================
async function subirRecurso() {
    const nombre = document.getElementById('nombre').value;
    const descripcion = document.getElementById('descripcion').value;
    const descarga = document.getElementById('descarga').value;
    const categoria = document.getElementById('categoria').value;
    const archivoImg = document.getElementById('archivo-imagen').files[0];
    const urlExterna = document.getElementById('imagen-url').value;

    if (!nombre || !descarga) return alert("Faltan datos");

    let urlFinalImagen = urlExterna || "https://via.placeholder.com/300x150";

    if (archivoImg) {
        const fileName = `${Date.now()}_${archivoImg.name}`;
        const { error } = await supabaseClient.storage.from('imagenes-recursos').upload(fileName, archivoImg);
        if (error) return alert("Error imagen: " + error.message);
        const { data } = supabaseClient.storage.from('imagenes-recursos').getPublicUrl(fileName);
        urlFinalImagen = data.publicUrl;
    }

    const { error: dbError } = await supabaseClient.from('recursos').insert([{
        nombre, descripcion, imagen: urlFinalImagen, descarga, categoria
    }]);

    if (dbError) alert("Error DB: " + dbError.message);
    else { alert("✅ Publicado!"); window.location.href = "home.html"; }
}

async function cargarRecursos(cat) {
    const { data: recursos } = await supabaseClient.from('recursos').select('*').eq('categoria', cat);
    const grid = document.getElementById(`grid-${cat}`);
    if (!grid) return;
    grid.innerHTML = recursos?.length ? "" : "<p>No hay contenido.</p>";
    recursos?.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.onclick = () => abrirDetalle(item.nombre, item.descripcion, item.imagen, item.descarga);
        div.innerHTML = `<img src="${item.imagen}"><h3>${item.nombre}</h3><p>Ver detalles</p>`;
        grid.appendChild(div);
    });
}

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

async function cargarListaGestion() {
    const lista = document.getElementById('lista-gestion');
    if (!lista) return;
    const { data: recursos } = await supabaseClient.from('recursos').select('*');
    lista.innerHTML = "";
    recursos?.forEach(item => {
        const div = document.createElement('div');
        div.style = "border-bottom:1px solid #795548; padding:10px; display:flex; justify-content:space-between;";
        div.innerHTML = `<span>[${item.categoria}] ${item.nombre}</span><button onclick="eliminarRecurso('${item.id}')">Borrar</button>`;
        lista.appendChild(div);
    });
}

async function eliminarRecurso(id) {
    if (confirm("¿Borrar?")) {
        await supabaseClient.from('recursos').delete().eq('id', id);
        location.reload();
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.onload = () => {
    const clima = localStorage.getItem('pref-clima');
    if (clima) aplicarClima(clima);
    
    // Verificación de Admin
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session?.user?.email === "fabianjensi@gmail.com") {
            const card = document.getElementById('admin-card');
            if (card) card.style.display = "block";
        }
    });

    if (document.getElementById('grid-addons')) cargarRecursos('addons');
    if (document.getElementById('grid-texturas')) cargarRecursos('texturas');
    if (document.getElementById('grid-shaders')) cargarRecursos('shaders');
    if (document.getElementById('lista-gestion')) cargarListaGestion();
};
