// 1. CONFIGURACIÓN DE CONEXIÓN A SUPABASE
const SUPABASE_URL = 'https://qiaekarmrjroahcgfuks.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpYWVrYXJtcmpyb2FoY2dmdWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDM5NjIsImV4cCI6MjA4MjE3OTk2Mn0.7_VQXlXcrHW20mqpVQE7V8jIPyhDh8Rj1FDUmsUvq68';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. LÓGICA DEL BOTÓN DE CLIMA (Día/Noche con Memoria)
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

// 3. LÓGICA DE AUTENTICACIÓN (Login, Registro, Recuperación)
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
            alert("¡Conexión establecida! Entrando al mundo...");
            window.location.href = "./home.html";
        }
    });
}

// Función para registrar nuevos usuarios (Compatible con registro.html)
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
        alert("✅ ¡Registro enviado! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.");
        window.location.href = "index.html"; 
    }
}

// Función para recuperar contraseña
async function recuperarContrasena() {
    const email = prompt("Introduce tu correo electrónico para recibir el enlace de restauración:");
    if (email) {
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html',
        });

        if (error) alert("Error: " + error.message);
        else alert("📩 Enlace de recuperación enviado a tu correo.");
    }
}

// 4. LÓGICA DE CIERRE DE SESIÓN
const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "./index.html";
    });
}

// 5. FUNCIONES PARA EL MODAL DE DETALLES
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

// 6. VERIFICACIÓN DE ADMIN
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

// 7. LÓGICA DEL PANEL MASTER (Subida de Archivos)
async function subirRecurso() {
    const nombre = document.getElementById('nombre').value;
    const descripcion = document.getElementById('descripcion').value;
    const descarga = document.getElementById('descarga').value;
    const categoria = document.getElementById('categoria').value;
    const archivoImg = document.getElementById('archivo-imagen').files[0];
    const urlExterna = document.getElementById('imagen-url').value;

    if (!nombre || !descarga) {
        alert("Faltan datos obligatorios (Nombre o Link)");
        return;
    }

    let urlFinalImagen = urlExterna || "https://via.placeholder.com/300x150";

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
        alert("Error en DB: " + dbError.message);
    } else {
        alert("✅ ¡Recurso publicado con éxito!");
        window.location.href = "home.html";
    }
}

// 8. CARGAR RECURSOS AUTOMÁTICAMENTE
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

// 9. GESTIÓN DE ELIMINACIÓN
async function cargarListaGestion() {
    const lista = document.getElementById('lista-gestion');
    if (!lista) return;

    const { data: recursos } = await supabaseClient.from('recursos').select('*');
    lista.innerHTML = "";

    if(recursos) {
        recursos.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "admin-item-row"; // Puedes darle estilo en CSS
            itemDiv.style = "border-bottom: 1px solid #795548; padding: 10px; display: flex; justify-content: space-between; align-items: center;";
            itemDiv.innerHTML = `
                <span><strong>[${item.categoria.toUpperCase()}]</strong> ${item.nombre}</span>
                <button onclick="eliminarRecurso('${item.id}')" class="btn-eliminar" style="width: auto; padding: 5px 10px; margin:0;">Borrar</button>
            `;
            lista.appendChild(itemDiv);
        });
    }
}

async function eliminarRecurso(id) {
    if (confirm("¿Seguro que quieres borrar este recurso permanentemente?")) {
        const { error } = await supabaseClient.from('recursos').delete().eq('id', id);
        if (error) alert("Error: " + error.message);
        else location.reload();
    }
}

// INICIALIZACIÓN POR PÁGINA
window.onload = () => {
    const climaGuardado = localStorage.getItem('pref-clima');
    if (climaGuardado) {
        aplicarClima(climaGuardado);
    }

    verificarAdmin();
    if (document.getElementById('grid-addons')) cargarRecursos('addons');
    if (document.getElementById('grid-texturas')) cargarRecursos('texturas');
    if (document.getElementById('grid-shaders')) cargarRecursos('shaders');
    if (document.getElementById('lista-gestion')) cargarListaGestion();
};

// --- RECUPERACIÓN DE CONTRASEÑA ---

// 1. Envío del correo (Se activa desde el enlace en index.html)
async function recuperarContrasena() {
    const email = prompt("Introduce tu correo electrónico para recibir el enlace de restauración:");
    if (email) {
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            // Esta URL la cambiaremos cuando publiques la página
            redirectTo: window.location.origin + '/recuperar.html', 
        });

        if (error) alert("Error: " + error.message);
        else alert("📩 Enlace de recuperación enviado. Revisa tu correo.");
    }
}

// 2. Acción de guardar la nueva contraseña (En recuperar.html)
const updatePasswordForm = document.getElementById('form-update-password');
if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;

        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("✅ ¡Contraseña actualizada! Ya puedes entrar con tu nueva clave.");
            window.location.href = "index.html";
        }
    });
}