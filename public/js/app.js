import { state, setState, subscribe } from './state.js';
import { loadLanguage, switchLanguage, t, applyTranslations } from './i18n.js';
import { api } from './api.js';

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const authModalClose = document.getElementById('auth-modal-close');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userProfileArea = document.getElementById('user-profile-area');
const langKmBtn = document.getElementById('lang-km-btn');
const langEnBtn = document.getElementById('lang-en-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const navPillsContainer = document.getElementById('nav-pills-container');
const phaseContentArea = document.getElementById('phase-content-area');

/**
 * Initialize application
 */
async function init() {
  // Set initial theme
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();

  // Load language
  await loadLanguage(state.language);
  updateLanguageButtons();

  // Check current session
  await checkSession();

  // Bind events
  bindEvents();

  // Render initial view
  renderNavPills();
  renderPhase1View();
}

/**
 * Check existing authentication session
 */
async function checkSession() {
  try {
    const res = await api.getMe();
    if (res.authenticated && res.user) {
      setState({ user: res.user });
    } else {
      setState({ user: null });
    }
  } catch (err) {
    console.error('Session check error', err);
    setState({ user: null });
  }
}

/**
 * Bind DOM event listeners
 */
function bindEvents() {
  // Language Switch
  langKmBtn?.addEventListener('click', () => {
    switchLanguage('km');
    updateLanguageButtons();
    renderNavPills();
    renderPhase1View();
  });

  langEnBtn?.addEventListener('click', () => {
    switchLanguage('en');
    updateLanguageButtons();
    renderNavPills();
    renderPhase1View();
  });

  // Theme Toggle
  themeToggleBtn?.addEventListener('click', () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    setState({ theme: nextTheme });
    updateThemeIcon();
  });

  // Auth Modal trigger
  authBtn?.addEventListener('click', () => {
    if (state.user) {
      handleLogout();
    } else {
      openAuthModal();
    }
  });

  authModalClose?.addEventListener('click', closeAuthModal);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  // Login form submit
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    await handleLogin(username, password);
  });

  // Quick login cards
  document.querySelectorAll('[data-quick-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const user = btn.getAttribute('data-quick-user');
      const pass = btn.getAttribute('data-quick-pass');
      document.getElementById('login-username').value = user;
      document.getElementById('login-password').value = pass;
      handleLogin(user, pass);
    });
  });

  // State changes
  subscribe(() => {
    renderUserBadge();
    renderNavPills();
  });
}

function updateLanguageButtons() {
  if (state.language === 'km') {
    langKmBtn?.classList.add('btn-gold');
    langKmBtn?.classList.remove('btn-outline');
    langEnBtn?.classList.remove('btn-gold');
    langEnBtn?.classList.add('btn-outline');
  } else {
    langEnBtn?.classList.add('btn-gold');
    langEnBtn?.classList.remove('btn-outline');
    langKmBtn?.classList.remove('btn-gold');
    langKmBtn?.classList.add('btn-outline');
  }
}

function updateThemeIcon() {
  if (!themeToggleBtn) return;
  themeToggleBtn.innerHTML = state.theme === 'dark' 
    ? '☀️ <span class="hide-mobile">Light</span>' 
    : '🌙 <span class="hide-mobile">Dark</span>';
}

function openAuthModal() {
  loginError.style.display = 'none';
  authModal.classList.add('active');
  document.getElementById('login-username')?.focus();
}

function closeAuthModal() {
  authModal.classList.remove('active');
  loginError.style.display = 'none';
}

async function handleLogin(username, password) {
  loginError.style.display = 'none';
  try {
    const res = await api.login(username, password);
    if (res.success && res.user) {
      setState({ user: res.user });
      closeAuthModal();
      renderPhase1View();
    }
  } catch (err) {
    loginError.textContent = err.data?.message || err.message || 'Login failed';
    loginError.style.display = 'block';
  }
}

async function handleLogout() {
  try {
    await api.logout();
    setState({ user: null });
    renderPhase1View();
  } catch (err) {
    console.error('Logout error', err);
  }
}

function renderUserBadge() {
  if (!userProfileArea) return;

  if (state.user) {
    const roleBadgeClass = `badge-${state.user.role}`;
    const displayName = state.language === 'km' && state.user.nameKm ? state.user.nameKm : state.user.fullName;
    
    userProfileArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span class="badge ${roleBadgeClass}">${state.user.role.toUpperCase()}</span>
        <span style="font-weight: 600;">${escapeHtml(displayName)}</span>
        ${state.user.cardNumber ? `<span style="font-size: 0.8rem; color: #94a3b8;">(${state.user.cardNumber})</span>` : ''}
      </div>
    `;
    if (authBtn) {
      authBtn.textContent = t('app.logout', 'Log out');
      authBtn.className = 'btn btn-outline btn-sm';
    }
  } else {
    userProfileArea.innerHTML = ``;
    if (authBtn) {
      authBtn.textContent = t('app.login', 'Log in');
      authBtn.className = 'btn btn-gold btn-sm';
    }
  }
}

function renderNavPills() {
  if (!navPillsContainer) return;

  const role = state.user?.role;
  let items = [];

  if (role === 'admin') {
    items = [
      { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
      { id: 'books', label: t('nav.books', 'Books'), icon: '📚' },
      { id: 'members', label: t('nav.members', 'Members'), icon: '👥' },
      { id: 'loans', label: t('nav.loans', 'Borrow & Return'), icon: '🔄' },
      { id: 'checkin', label: t('nav.checkin', 'Daily Attendance'), icon: '🎫' },
      { id: 'reports', label: t('nav.reports', 'Reports'), icon: '📑' },
      { id: 'staff_accounts', label: t('nav.staff_accounts', 'Staff Accounts'), icon: '🛡️' },
      { id: 'settings', label: t('nav.settings', 'Settings'), icon: '⚙️' }
    ];
  } else if (role === 'librarian') {
    items = [
      { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
      { id: 'books', label: t('nav.books', 'Books'), icon: '📚' },
      { id: 'members', label: t('nav.members', 'Members'), icon: '👥' },
      { id: 'loans', label: t('nav.loans', 'Borrow & Return'), icon: '🔄' },
      { id: 'checkin', label: t('nav.checkin', 'Daily Attendance'), icon: '🎫' },
      { id: 'reports', label: t('nav.reports', 'Reports'), icon: '📑' }
    ];
  } else if (role === 'member') {
    items = [
      { id: 'books', label: t('nav.books', 'Book Catalogue'), icon: '📚' },
      { id: 'my_loans', label: t('nav.my_loans', 'My Loans & History'), icon: '📖' }
    ];
  } else {
    items = [
      { id: 'books', label: t('nav.books', 'Browse Catalogue'), icon: '📚' }
    ];
  }

  navPillsContainer.innerHTML = items.map(item => `
    <button class="nav-pill-item ${state.currentTab === item.id ? 'active' : ''}" data-tab="${item.id}">
      <span>${item.icon}</span>
      <span>${escapeHtml(item.label)}</span>
    </button>
  `).join('');

  navPillsContainer.querySelectorAll('.nav-pill-item').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ currentTab: btn.getAttribute('data-tab') });
      renderNavPills();
      renderPhase1View();
    });
  });
}

function renderPhase1View() {
  if (!phaseContentArea) return;

  const isKm = state.language === 'km';
  const user = state.user;

  phaseContentArea.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Phase 1 Verification Card -->
      <div class="card" style="border-top: 4px solid var(--duc-gold);">
        <div class="card-header">
          <div class="card-title">
            <span>🛡️</span>
            <span>${isKm ? 'ដំណាក់កាលទី ១៖ ការផ្ទៀងផ្ទាត់គណនី និងការគ្រប់គ្រងតួនាទី (Phase 1 Ready)' : 'Phase 1: Project Setup, Database & Role-Based Auth'}</span>
          </div>
          <span class="badge ${user ? 'badge-' + user.role : 'badge-overdue'}">
            ${user ? (isKm ? 'បានចូលប្រើប្រាស់' : 'Authenticated') : (isKm ? 'មិនទាន់ចូលប្រព័ន្ធ' : 'Guest')}
          </span>
        </div>

        <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">
          ${isKm 
            ? 'ប្រព័ន្ធបណ្ណាល័យ DUC ត្រូវបានដំឡើងដោយជោគជ័យជាមួយ SQLite (Node.js 24 native engine), Session Cookies (httpOnly) និងការបែងចែកសិទ្ធិតួនាទី (Admin, Librarian, Member)។' 
            : 'DUC Library Management System is initialized with SQLite, secure httpOnly session cookies, and strict Role-Based Access Control (Admin, Librarian, Member).'}
        </p>

        <!-- Quick Switcher Box -->
        <div style="background: var(--bg-muted); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--text-primary);">
            ${isKm ? '⚡ ចូលប្រើរហ័សដើម្បីសាកល្បងតួនាទីទាំងបី (Quick Switch Accounts):' : '⚡ Quick Switch Demo Accounts:'}
          </h4>
          <div class="quick-login-grid">
            <div class="quick-login-card" data-quick-user="admin" data-quick-pass="admin123">
              <div class="quick-login-role" style="color: var(--duc-gold-dark);">Admin</div>
              <div class="quick-login-user">admin / admin123</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${isKm ? 'សិទ្ធិពេញលេញ' : 'Full access'}</div>
            </div>
            <div class="quick-login-card" data-quick-user="librarian" data-quick-pass="lib123">
              <div class="quick-login-role" style="color: #0284c7;">Librarian</div>
              <div class="quick-login-user">librarian / lib123</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${isKm ? 'គ្រប់គ្រងសៀវភៅ & កម្ចី' : 'Catalog & Loans'}</div>
            </div>
            <div class="quick-login-card" data-quick-user="student1" data-quick-pass="student123">
              <div class="quick-login-role" style="color: #10b981;">Member</div>
              <div class="quick-login-user">student1 / student123</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${isKm ? 'និស្សិត ចាន់ វណ្ណា' : 'Student Account'}</div>
            </div>
          </div>
        </div>

        <!-- Session Status & Role Permissions Test -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
            <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">🔑 ${isKm ? 'ព័ត៌មានគណនីបច្ចុប្បន្ន' : 'Current Session'}</h4>
            <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8;">
              <div><strong>${isKm ? 'ឈ្មោះគណនី' : 'Username'}:</strong> ${user ? escapeHtml(user.username) : '<em>Guest</em>'}</div>
              <div><strong>${isKm ? 'ឈ្មោះពេញ' : 'Full Name'}:</strong> ${user ? escapeHtml(user.fullName) : '<em>Not logged in</em>'}</div>
              <div><strong>${isKm ? 'តួនាទី' : 'Role'}:</strong> ${user ? `<span class="badge badge-${user.role}">${user.role.toUpperCase()}</span>` : 'None'}</div>
              ${user?.cardNumber ? `<div><strong>${isKm ? 'លេខកាត' : 'Card ID'}:</strong> ${escapeHtml(user.cardNumber)}</div>` : ''}
            </div>
          </div>

          <div style="padding: 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
            <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">📊 ${isKm ? 'ទិន្នន័យគំរូក្នុងមូលដ្ឋាន' : 'Database Status'}</h4>
            <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8;">
              <div><strong>${isKm ? 'សៀវភៅសរុប' : 'Total Books'}:</strong> 35 titles (Bilingual KM/EN)</div>
              <div><strong>${isKm ? 'សមាជិកបណ្ណាល័យ' : 'Total Members'}:</strong> 25 students & faculty</div>
              <div><strong>${isKm ? 'កំណត់ត្រាកម្ចី' : 'Loan Records'}:</strong> 14 active/overdue/returned</div>
              <div><strong>${isKm ? 'សុវត្ថិភាព' : 'Security'}:</strong> bcrypt + httpOnly session cookies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Re-bind quick login cards in phase view
  phaseContentArea.querySelectorAll('[data-quick-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const u = btn.getAttribute('data-quick-user');
      const p = btn.getAttribute('data-quick-pass');
      handleLogin(u, p);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Start app
window.addEventListener('DOMContentLoaded', init);
