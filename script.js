// ==========================================
// 0. SEGURIDAD Y REDIRECCIÓN
// ==========================================
(function gestionarSeguridad() {
    const path = window.location.pathname;
    const sesionActiva = localStorage.getItem('mc_session_active');

    const esLogin = path.endsWith('/index.html') || path.endsWith('/comunidad-minecraft/') || path.endsWith('/comunidad-minecraft');
    const esPaginaProtegida = path.includes('home.html') || 
                              path.includes('addons.html') || 
                              path.includes('texturas.html') || 
                              path.includes('shaders.html') ||
                              path.includes('admin.html');

    if (esLogin && sesionActiva === 'true') {
        window.location.replace("home.html");
    }

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
// 2. LÓGICA DEL CLIMA
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
// 3. AUTENTICACIÓN
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) alert("¡Error de acceso!: " + error.message);
        else {
            localStorage.setItem('mc_session_active', 'true');
            window.location.replace("home.html");
        }
    });
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
// 5. FUNCIONES MODAL Y CARGA
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

async function cargarRecursos(cat) {
    const { data: recursos } = await supabaseClient.from('recursos').select('*').eq('categoria', cat);
    const grid = document.getElementById(`grid-${cat}`);
    if (!grid) return;
    grid.innerHTML = ""; 
    if (!recursos || recursos.length === 0) {
        grid.innerHTML = "<p>No hay contenido disponible.</p>";
        return;
    }
    recursos.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.onclick = () => abrirDetalle(item.nombre, item.descripcion, item.imagen, item.descarga);
        div.innerHTML = `<img src="${item.imagen}"><h3>${item.nombre}</h3><p>Ver detalles</p>`;
        grid.appendChild(div);
    });
}

// ==========================================
// 6. PANEL MASTER (EL ARREGLO ESTÁ AQUÍ)
// ==========================================
async function subirRecurso() {
    const nombre = document.getElementById('nombre').value;
    const descripcion = document.getElementById('descripcion').value;
    const descarga = document.getElementById('descarga').value;
    const categoria = document.getElementById('categoria').value;
    const archivoImg = document.getElementById('archivo-imagen').files[0];
    const urlExterna = document.getElementById('imagen-url').value;

    if (!nombre || !descarga) {
        alert("¡El nombre y el link de descarga son obligatorios!");
        return;
    }

    let urlFinalImagen = urlExterna || "https://via.placeholder.com/300x150";

    // Si hay un archivo seleccionado, subirlo a Storage
    if (archivoImg) {
        const fileName = `${Date.now()}_${archivoImg.name}`;
        const { data, error } = await supabaseClient.storage
            .from('imagenes-recursos')
            .upload(fileName, archivoImg);

        if (error) {
            alert("Error al subir imagen: " + error.message);
            return;
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('imagenes-recursos')
            .getPublicUrl(fileName);
        
        urlFinalImagen = publicUrlData.publicUrl;
    }

    // Insertar en la base de datos
    const { error: dbError } = await supabaseClient
        .from('recursos')
        .insert([{
            nombre: nombre,
            descripcion: descripcion,
            imagen: urlFinalImagen,
            descarga: descarga,
            categoria: categoria
        }]);

    if (dbError) {
        alert("Error en la base de datos: " + dbError.message);
    } else {
        alert("✅ ¡Recurso publicado con éxito!");
        window.location.href = "home.html";
    }
}

async function cargarListaGestion() {
    const lista = document.getElementById('lista-gestion');
    if (!lista) return;
    const { data: recursos } = await supabaseClient.from('recursos').select('*');
    lista.innerHTML = "";
    if(recursos) {
        recursos.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style = "border-bottom: 1px solid #795548; padding: 10px; display: flex; justify-content: space-between;";
            itemDiv.innerHTML = `<span>[${item.categoria}] ${item.nombre}</span>
                                 <button onclick="eliminarRecurso('${item.id}')">Borrar</button>`;
            lista.appendChild(itemDiv);
        });
    }
}

async function eliminarRecurso(id) {
    if (confirm("¿Borrar recurso?")) {
        await supabaseClient.from('recursos').delete().eq('id', id);
        location.reload();
    }
}

async function verificarAdmin() {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session?.user;
        if (user && user.email === "fabianjensi@gmail.com") {
            const adminCard = document.getElementById('admin-card');
            if (adminCard) adminCard.style.display = "block";
        }
    });
}

window.onload = () => {
    const climaGuardado = localStorage.getItem('pref-clima');
    if (climaGuardado) aplicarClima(climaGuardado);
    verificarAdmin();
    if (document.getElementById('grid-addons')) cargarRecursos('addons');
    if (document.getElementById('grid-texturas')) cargarRecursos('texturas');
    if (document.getElementById('grid-shaders')) cargarRecursos('shaders');
    if (document.getElementById('lista-gestion')) cargarListaGestion();
};
