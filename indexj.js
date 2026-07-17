// indexj.js - Versión con Listas, Categorías, Temporadas, Edición y barra de navegación completa

let currentUser = null;
let animes = [];
let listas = ["General"];
let editMode = false;
let activeListFilter = null;

// ==================== BASE DE DATOS DE USUARIOS (nuevo) ====================
// Guarda { email: { name, password } } para poder validar la contraseña en el login.
function loadUsersDB() {
    const saved = localStorage.getItem('usuarios_db');
    return saved ? JSON.parse(saved) : {};
}

function saveUsersDB(db) {
    localStorage.setItem('usuarios_db', JSON.stringify(db));
}

// ==================== INICIALIZACIÓN ====================
function loadData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

// ==================== CAMBIO DE PANTALLAS ====================
function showLogin() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('register-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.remove('active');
}

function showRegister() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('register-screen').classList.add('active');
    document.getElementById('dashboard-screen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('register-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');

    // Cargar animes y listas del usuario
    const savedAnimes = localStorage.getItem('animes_' + currentUser.email);
    animes = savedAnimes ? JSON.parse(savedAnimes) : [];

    loadListas();
    activeListFilter = null;
    editMode = false;
    updateEditButtonUI();
    renderAnimes();
}

// ==================== LOGIN Y REGISTRO ====================
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) {
        alert("Por favor ingresa un correo");
        return;
    }

    const usersDB = loadUsersDB();
    const registeredUser = usersDB[email];

    if (!registeredUser) {
        // Este correo aún no tiene cuenta creada
        alert("No existe una cuenta con ese correo. Por favor regístrate.");
        document.getElementById('reg-email').value = email;
        showRegister();
        return;
    }

    if (registeredUser.password !== password) {
        alert("Contraseña incorrecta.");
        return;
    }

    currentUser = {
        name: registeredUser.name || email.split('@')[0] || "Usuario",
        email: email
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showDashboard();
});

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (name && email && password) {
        const usersDB = loadUsersDB();

        if (usersDB[email]) {
            alert("Ya existe una cuenta con ese correo. Por favor inicia sesión.");
            document.getElementById('login-email').value = email;
            showLogin();
            return;
        }

        usersDB[email] = { name, password };
        saveUsersDB(usersDB);

        currentUser = { name, email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        alert("Por favor completa todos los campos");
    }
});

// ==================== LISTAS ====================
function loadListas() {
    const saved = localStorage.getItem('listas_' + currentUser.email);
    listas = saved ? JSON.parse(saved) : ["General"];
    if (!listas.includes("General")) listas.unshift("General");
}

function saveListas() {
    if (currentUser) {
        localStorage.setItem('listas_' + currentUser.email, JSON.stringify(listas));
    }
}

function populateListSelect(selected) {
    const select = document.getElementById('list-select');
    select.innerHTML = '';
    listas.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        select.appendChild(opt);
    });
    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = '+ Crear nueva lista';
    select.appendChild(newOpt);

    select.value = selected && listas.includes(selected) ? selected : listas[0];
}

function handleListSelectChange() {
    const select = document.getElementById('list-select');
    if (select.value === '__new__') {
        const nombre = prompt('Nombre de la nueva lista:');
        if (nombre && nombre.trim()) {
            const nombreLimpio = nombre.trim();
            if (!listas.includes(nombreLimpio)) {
                listas.push(nombreLimpio);
                saveListas();
            }
            populateListSelect(nombreLimpio);
        } else {
            select.value = listas[0];
        }
    }
}

function showListasModal() {
    renderListasInfo();
    document.getElementById('listas-modal').style.display = 'flex';
}

function closeListasModal() {
    document.getElementById('listas-modal').style.display = 'none';
}

function renderListasInfo() {
    const container = document.getElementById('listas-info');
    container.innerHTML = '';

    listas.forEach(l => {
        const count = animes.filter(a => (a.list || 'General') === l).length;
        const item = document.createElement('div');
        item.className = 'lista-item';
        item.innerHTML = `
            <span>${l} (${count})</span>
            <div class="lista-actions">
                <button onclick="filtrarPorLista('${l.replace(/'/g, "\\'")}')">Ver</button>
                ${l !== 'General' ? `<button onclick="eliminarLista('${l.replace(/'/g, "\\'")}')">Eliminar</button>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

function crearNuevaLista() {
    const nombre = prompt('Nombre de la nueva lista:');
    if (nombre && nombre.trim()) {
        const nombreLimpio = nombre.trim();
        if (!listas.includes(nombreLimpio)) {
            listas.push(nombreLimpio);
            saveListas();
            renderListasInfo();
        } else {
            alert('Ya existe una lista con ese nombre.');
        }
    }
}

function eliminarLista(nombre) {
    if (!confirm(`¿Eliminar la lista "${nombre}"? Los animes que estén en ella pasarán a "General".`)) return;

    animes.forEach(a => {
        if ((a.list || 'General') === nombre) a.list = 'General';
    });
    saveAnimes();

    listas = listas.filter(l => l !== nombre);
    saveListas();

    if (activeListFilter === nombre) clearListFilter();
    renderListasInfo();
    renderAnimes();
}

function filtrarPorLista(nombre) {
    activeListFilter = nombre;
    closeListasModal();
    const banner = document.getElementById('active-list-banner');
    document.getElementById('active-list-text').textContent = `Mostrando lista: ${nombre}`;
    banner.style.display = 'flex';
    filterAnimes();
}

function clearListFilter() {
    activeListFilter = null;
    document.getElementById('active-list-banner').style.display = 'none';
    document.getElementById('search-input').value = '';
    renderAnimes();
}

// ==================== DASHBOARD / GRID ====================
function getFilteredBase() {
    if (!activeListFilter) return animes;
    return animes.filter(a => (a.list || 'General') === activeListFilter);
}

function renderAnimes(filteredAnimes = getFilteredBase()) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '';

    if (filteredAnimes.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; color:#ddd;">
            No tienes animes registrados aún.<br>¡Presiona + Añadir!
        </p>`;
        return;
    }

    filteredAnimes.forEach((anime) => {
        const realIndex = animes.indexOf(anime);
        const card = document.createElement('div');
        card.className = 'anime-card';

        const editControls = editMode ? `
            <div class="card-actions">
                <button onclick="event.stopPropagation(); editAnime(${realIndex})" title="Editar">✏️</button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteAnime(${realIndex})" title="Eliminar">🗑️</button>
            </div>
        ` : '';

        card.innerHTML = `
            ${editControls}
            <img src="${anime.image || 'https://via.placeholder.com/300x400/2a0055/ffffff?text=Anime'}" alt="${anime.title}">
            <div class="anime-info">
                <h3>${anime.title}</h3>
                <span class="status">${anime.status}</span>
                <p>${anime.episodes} episodios</p>
                <div class="tags">
                    <span class="badge">📋 ${anime.list || 'General'}</span>
                    ${anime.category ? `<span class="badge">${anime.category}</span>` : ''}
                    ${anime.season ? `<span class="badge">Temp. ${anime.season}</span>` : ''}
                </div>
            </div>
        `;
        card.onclick = () => showAnimeDetail(realIndex);
        grid.appendChild(card);
    });
}

function filterAnimes() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const base = getFilteredBase();
    const filtered = base.filter(a => a.title.toLowerCase().includes(term));
    renderAnimes(filtered);
}

// ==================== MODO EDICIÓN ====================
function toggleEditMode() {
    editMode = !editMode;
    updateEditButtonUI();
    renderAnimes();
}

function updateEditButtonUI() {
    const btn = document.getElementById('edit-toggle-btn');
    if (editMode) {
        btn.textContent = '✅ Listo';
        btn.classList.add('active');
    } else {
        btn.textContent = '✏️ Editar';
        btn.classList.remove('active');
    }
}

function editAnime(index) {
    const anime = animes[index];
    document.getElementById('modal-title').textContent = 'Editar Anime';
    document.getElementById('edit-index').value = index;
    document.getElementById('title').value = anime.title;
    document.getElementById('image').value = anime.image || '';
    document.getElementById('status').value = anime.status;
    document.getElementById('episodes').value = anime.episodes;
    document.getElementById('notes').value = anime.notes || '';
    document.getElementById('category').value = anime.category || 'Acción';
    document.getElementById('season').value = anime.season || '1';
    populateListSelect(anime.list || 'General');
    document.getElementById('anime-modal').style.display = 'flex';
}

function deleteAnime(index) {
    const anime = animes[index];
    if (!confirm(`¿Eliminar "${anime.title}" de tu lista?`)) return;
    animes.splice(index, 1);
    saveAnimes();
    renderAnimes();
}

// ==================== MODALES ANIME ====================
function showAddModal() {
    document.getElementById('modal-title').textContent = 'Añadir Anime';
    document.getElementById('anime-form').reset();
    document.getElementById('edit-index').value = -1;
    populateListSelect('General');
    document.getElementById('anime-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('anime-modal').style.display = 'none';
}

function showAnimeDetail(index) {
    if (editMode) {
        editAnime(index);
        return;
    }
    const anime = animes[index];
    alert(
        `📺 ${anime.title}\n\n` +
        `Estado: ${anime.status}\n` +
        `Episodios: ${anime.episodes}\n` +
        `Lista: ${anime.list || 'General'}\n` +
        `Categoría: ${anime.category || 'Sin categoría'}\n` +
        `Temporada: ${anime.season || '1'}\n\n` +
        `Notas: ${anime.notes || 'Sin notas'}`
    );
}

// Guardar anime (añadir o editar)
document.getElementById('anime-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const index = parseInt(document.getElementById('edit-index').value);

    let listValue = document.getElementById('list-select').value;
    if (listValue === '__new__' || !listValue) listValue = 'General';

    const newAnime = {
        title: document.getElementById('title').value,
        image: document.getElementById('image').value,
        status: document.getElementById('status').value,
        episodes: parseInt(document.getElementById('episodes').value) || 0,
        list: listValue,
        category: document.getElementById('category').value,
        season: document.getElementById('season').value,
        notes: document.getElementById('notes').value
    };

    if (index >= 0) animes[index] = newAnime;
    else animes.push(newAnime);

    saveAnimes();
    closeModal();
    renderAnimes();
});

function saveAnimes() {
    if (currentUser) {
        localStorage.setItem('animes_' + currentUser.email, JSON.stringify(animes));
    }
}

// ==================== CUENTA ====================
function showAccount() {
    const info = document.getElementById('account-info');
    info.innerHTML = `
        <p style="margin-bottom:10px;"><strong>Nombre:</strong> ${currentUser.name}</p>
        <p style="margin-bottom:20px;"><strong>Correo:</strong> ${currentUser.email}</p>
        <p style="color:#ccc; font-size:14px;">Total de animes registrados: ${animes.length}</p>
    `;
    document.getElementById('account-modal').style.display = 'flex';
}

function closeAccountModal() {
    document.getElementById('account-modal').style.display = 'none';
}

// ==================== CONFIGURACIÓN ====================
function showConfigModal() {
    document.getElementById('config-modal').style.display = 'flex';
}

function closeConfigModal() {
    document.getElementById('config-modal').style.display = 'none';
}

function confirmarBorrarDatos() {
    if (!confirm('Esto eliminará todos tus animes guardados. ¿Deseas continuar?')) return;
    animes = [];
    saveAnimes();
    renderAnimes();
    closeConfigModal();
}

// ==================== QUIÉNES SOMOS ====================
function showAboutModal() {
    document.getElementById('about-modal').style.display = 'flex';
}

function closeAboutModal() {
    document.getElementById('about-modal').style.display = 'none';
}

// ==================== SESIÓN ====================
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    animes = [];
    listas = ["General"];
    activeListFilter = null;
    editMode = false;
    showLogin();
}

// ==================== INICIAR ====================
loadData();