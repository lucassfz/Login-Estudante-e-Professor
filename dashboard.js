const requiredRole = document.body.dataset.requiredRole;
const isAuthenticated = sessionStorage.getItem('portalAuthenticated') === 'true';
const activeRole = sessionStorage.getItem('portalRole');

if (!isAuthenticated || activeRole !== requiredRole) {
  window.location.replace('index.html');
} else {
  const displayUser = document.getElementById('displayUser');
  if (displayUser) {
    displayUser.textContent = sessionStorage.getItem('portalUser') || requiredRole;
  }
}

document.getElementById('logoutButton')?.addEventListener('click', () => {
  sessionStorage.removeItem('portalAuthenticated');
  sessionStorage.removeItem('portalRole');
  sessionStorage.removeItem('portalUser');
  window.location.href = 'index.html';
});
