const GATEWAY = 'http://localhost:8082';

const Api = {
    // ── Token storage ────────────────────────────────────────────
    setToken(token)  { localStorage.setItem('jwt', token); },
    getToken()       { return localStorage.getItem('jwt'); },
    clearToken()     { localStorage.removeItem('jwt'); localStorage.removeItem('userId'); },
    setUserId(id)    { localStorage.setItem('userId', id); },
    getUserId()      { return localStorage.getItem('userId'); },

    // ── Base fetch ───────────────────────────────────────────────
    async request(method, path, body = null, auth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = Api.getToken();
            if (!token) { window.location.href = '/index.html'; return; }
            headers['Authorization'] = 'Bearer ' + token;
        }
        const res = await fetch(GATEWAY + path, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        if (res.status === 401) { Api.clearToken(); window.location.href = '/index.html'; return; }
        return res;
    },

    // ── Auth ─────────────────────────────────────────────────────
    async login(username, password) {
        const res = await Api.request('POST', '/auth/login', { username, password }, false);
        if (!res) return { ok: false, message: 'No response from server' };
        const data = await res.json();
        if (res.ok && data.token) {
            Api.setToken(data.token);
            Api.setUserId(data.userId);
        }
        return { ok: res.ok, ...data };
    },

    async register(username, email, password) {
        const res = await Api.request('POST', '/auth/register', { username, email, password }, false);
        if (!res) return { ok: false, message: 'No response from server' };
        const data = await res.json();
        if (res.ok && data.token) {
            Api.setToken(data.token);
            Api.setUserId(data.userId);
        }
        return { ok: res.ok, ...data };
    },

    // ── Profile ──────────────────────────────────────────────────
    async getProfile(id) {
        const res = await Api.request('GET', `/users/${id}`);
        if (!res) return null;
        return res.ok ? res.json() : null;
    },

    async updateProfile(id, data) {
        const res = await Api.request('PUT', `/users/${id}`, data);
        if (!res) return { ok: false };
        return { ok: res.ok, ...(await res.json().catch(() => ({}))) };
    },

    // ── Avatar upload ────────────────────────────────────────────
    async uploadAvatar(file) {
        const token = Api.getToken();
        if (!token) return { ok: false };
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(GATEWAY + '/files/avatar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: form
        });
        return { ok: res.ok, ...(await res.json().catch(() => ({}))) };
    },

    // ── UI helpers ───────────────────────────────────────────────
    showError(elId, msg)   { const el = document.getElementById(elId); if(el){ el.textContent = msg; el.style.display = 'block'; } },
    hideError(elId)        { const el = document.getElementById(elId); if(el) el.style.display = 'none'; },
    showSuccess(elId, msg) { const el = document.getElementById(elId); if(el){ el.textContent = msg; el.style.display = 'block'; el.className = 'alert success'; } },
};