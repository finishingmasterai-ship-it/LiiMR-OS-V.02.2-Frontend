// frontend/js/api.js
// LiiMR OS - Production API Client

const API_BASE = "http://localhost:8000/api"; // ব্যাকএন্ডের ঠিকানা

// --- কোর ফাংশন: সব API কল এখানে হ্যান্ডেল হয় ---
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { 
            ...options, 
            headers 
        });

        // টোকেন এক্সপায়ার্ড হলে লগইন পেজে পাঠান
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login.html';
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Call Failed:', error);
        throw error;
    }
}

// --- অথেন্টিকেশন API ---
export async function login(email, password) {
    const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
    }
    return data;
}

export async function getCurrentUser() {
    return apiCall('/auth/me');
}

export function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/login.html';
}

// --- ড্যাশবোর্ড API ---
export async function loadFilters() {
    return apiCall('/dashboard/filters');
}

export async function loadDashboardData(engineId, entityId, brandId = null, roleId = null) {
    let url = `/dashboard/data?engine_id=${engineId}&entity_id=${entityId}`;
    if (brandId) url += `&brand_id=${brandId}`;
    if (roleId) url += `&role_id=${roleId}`;
    return apiCall(url);
}

// --- অ্যাডমিন API (শুধু সিস্টেম অ্যাডমিনদের জন্য) ---
export async function createTenant(data) {
    return apiCall('/admin/tenants', { method: 'POST', body: JSON.stringify(data) });
}

export async function createUser(data) {
    return apiCall('/admin/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function assignEngines(tenantId, engineIds) {
    return apiCall(`/admin/tenants/${tenantId}/engines`, {
        method: 'PUT',
        body: JSON.stringify({ engine_ids: engineIds })
    });
}

export async function listTenants() {
    return apiCall('/admin/tenants');
}

export async function listUsers() {
    return apiCall('/admin/users');
}