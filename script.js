const USERS = {
  aluno: {
    username: 'aluno',
    password: '123456',
    destination: 'userpage.html'
  },
  professor: {
    username: 'professor',
    password: '123456',
    destination: 'professorpage.html'
  }
};

const form = document.getElementById('loginForm');
const roleInput = document.getElementById('role');
const userInput = document.getElementById('user');
const passwordInput = document.getElementById('passwd');
const rememberMe = document.getElementById('rememberMe');
const statusMessage = document.getElementById('statusMessage');
const userError = document.getElementById('userError');
const passwordError = document.getElementById('passwordError');
const submitButton = document.getElementById('verify');
const roleButtons = document.querySelectorAll('.role-button');
const togglePassword = document.getElementById('togglePassword');

const forgotPassword = document.getElementById('forgotPassword');
const recoveryModal = document.getElementById('recoveryModal');
const closeModal = document.getElementById('closeModal');
const recoveryMethods = document.querySelectorAll('.recovery-method');
const recoveryForm = document.getElementById('recoveryForm');
const recoveryContact = document.getElementById('recoveryContact');
const recoveryLabel = document.getElementById('recoveryLabel');
const recoveryError = document.getElementById('recoveryError');
const recoveryFormView = document.getElementById('recoveryFormView');
const recoverySuccess = document.getElementById('recoverySuccess');
const recoverySuccessMessage = document.getElementById('recoverySuccessMessage');
const sendRecovery = document.getElementById('sendRecovery');
const finishRecovery = document.getElementById('finishRecovery');
const recoveryFieldIcon = document.getElementById('recoveryFieldIcon');

let recoveryMethod = 'email';
let lastFocusedElement = null;

restoreRememberedLogin();

roleButtons.forEach((button) => {
  button.addEventListener('click', () => selectRole(button.dataset.role, true));
});

togglePassword.addEventListener('click', () => {
  const shouldShow = passwordInput.type === 'password';
  passwordInput.type = shouldShow ? 'text' : 'password';
  togglePassword.textContent = shouldShow ? 'Ocultar' : 'Mostrar';
  togglePassword.setAttribute('aria-label', shouldShow ? 'Ocultar senha' : 'Mostrar senha');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearLoginFeedback();

  const role = roleInput.value;
  const username = userInput.value.trim();
  const password = passwordInput.value;
  const account = USERS[role];

  let valid = true;

  if (!username) {
    showFieldError(userInput, userError, 'Informe seu usuário.');
    valid = false;
  }

  if (!password) {
    showFieldError(passwordInput, passwordError, 'Informe sua senha.');
    valid = false;
  }

  if (!valid) return;

  setButtonLoading(submitButton, true, 'Entrando…');

  window.setTimeout(() => {
    const credentialsMatch = username === account.username && password === account.password;

    if (!credentialsMatch) {
      setButtonLoading(submitButton, false, 'Entrar');
      showStatus('Dados incorretos para o perfil selecionado.', 'error');
      passwordInput.value = '';
      passwordInput.focus();
      return;
    }

    if (rememberMe.checked) {
      localStorage.setItem('portalRememberedUser', username);
      localStorage.setItem('portalRememberedRole', role);
    } else {
      localStorage.removeItem('portalRememberedUser');
      localStorage.removeItem('portalRememberedRole');
    }

    sessionStorage.setItem('portalAuthenticated', 'true');
    sessionStorage.setItem('portalRole', role);
    sessionStorage.setItem('portalUser', username);

    showStatus(`Acesso de ${role === 'professor' ? 'professor' : 'aluno'} confirmado.`, 'success');

    window.setTimeout(() => {
      window.location.href = account.destination;
    }, 350);
  }, 420);
});

forgotPassword.addEventListener('click', openRecoveryModal);
closeModal.addEventListener('click', closeRecoveryModal);
finishRecovery.addEventListener('click', closeRecoveryModal);

recoveryModal.addEventListener('click', (event) => {
  if (event.target === recoveryModal) closeRecoveryModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !recoveryModal.hidden) closeRecoveryModal();
});

recoveryMethods.forEach((button) => {
  button.addEventListener('click', () => setRecoveryMethod(button.dataset.method));
});

recoveryContact.addEventListener('input', () => {
  recoveryContact.classList.remove('input-error');
  recoveryError.textContent = '';

  if (recoveryMethod === 'sms') {
    recoveryContact.value = formatPhone(recoveryContact.value);
  }
});

recoveryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  recoveryContact.classList.remove('input-error');
  recoveryError.textContent = '';

  const value = recoveryContact.value.trim();
  const valid = recoveryMethod === 'email' ? isValidEmail(value) : isValidPhone(value);

  if (!valid) {
    recoveryContact.classList.add('input-error');
    recoveryError.textContent = recoveryMethod === 'email'
      ? 'Digite um e-mail válido.'
      : 'Digite um celular com DDD.';
    recoveryContact.focus();
    return;
  }

  setButtonLoading(sendRecovery, true, 'Enviando…');

  window.setTimeout(() => {
    setButtonLoading(sendRecovery, false, 'Enviar instruções');
    recoveryFormView.hidden = true;
    recoverySuccess.hidden = false;

    const safeDestination = recoveryMethod === 'email' ? maskEmail(value) : maskPhone(value);
    recoverySuccessMessage.textContent = `Se os dados estiverem cadastrados, as instruções serão encaminhadas para ${safeDestination}.`;
    finishRecovery.focus();
  }, 550);
});

function selectRole(role, focusUser = false) {
  if (!USERS[role]) return;

  roleInput.value = role;
  roleButtons.forEach((button) => {
    const isActive = button.dataset.role === role;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  userInput.placeholder = role === 'professor'
    ? 'Digite seu usuário de professor'
    : 'Digite seu usuário';

  clearLoginFeedback();
  passwordInput.value = '';

  if (focusUser) userInput.focus();
}

function restoreRememberedLogin() {
  const savedUsername = localStorage.getItem('portalRememberedUser');
  const savedRole = localStorage.getItem('portalRememberedRole');

  if (savedRole && USERS[savedRole]) selectRole(savedRole, false);

  if (savedUsername) {
    userInput.value = savedUsername;
    rememberMe.checked = true;
  }
}

function clearLoginFeedback() {
  [userInput, passwordInput].forEach((input) => input.classList.remove('input-error'));
  userError.textContent = '';
  passwordError.textContent = '';
  statusMessage.textContent = '';
  statusMessage.className = 'status-message';
}

function showFieldError(input, errorElement, message) {
  input.classList.add('input-error');
  errorElement.textContent = message;
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function setButtonLoading(button, isLoading, label) {
  button.disabled = isLoading;
  const labelElement = button.querySelector('.button-label');
  if (labelElement) labelElement.textContent = label;
}

function openRecoveryModal() {
  lastFocusedElement = document.activeElement;
  resetRecoveryModal();
  recoveryModal.hidden = false;
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => recoveryContact.focus(), 0);
}

function closeRecoveryModal() {
  recoveryModal.hidden = true;
  document.body.style.overflow = '';
  resetRecoveryModal();
  (lastFocusedElement || forgotPassword).focus();
}

function resetRecoveryModal() {
  recoveryForm.reset();
  recoveryFormView.hidden = false;
  recoverySuccess.hidden = true;
  recoveryContact.classList.remove('input-error');
  recoveryError.textContent = '';
  setButtonLoading(sendRecovery, false, 'Enviar instruções');
  setRecoveryMethod('email');
}

function setRecoveryMethod(method) {
  recoveryMethod = method === 'sms' ? 'sms' : 'email';

  recoveryMethods.forEach((button) => {
    const isActive = button.dataset.method === recoveryMethod;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  recoveryContact.value = '';
  recoveryContact.classList.remove('input-error');
  recoveryError.textContent = '';

  if (recoveryMethod === 'email') {
    recoveryLabel.textContent = 'E-mail cadastrado';
    recoveryContact.type = 'email';
    recoveryContact.inputMode = 'email';
    recoveryContact.autocomplete = 'email';
    recoveryContact.placeholder = 'seuemail@exemplo.com';
    recoveryFieldIcon.innerHTML = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>';
  } else {
    recoveryLabel.textContent = 'Celular cadastrado';
    recoveryContact.type = 'tel';
    recoveryContact.inputMode = 'tel';
    recoveryContact.autocomplete = 'tel';
    recoveryContact.placeholder = '(11) 99999-9999';
    recoveryFieldIcon.innerHTML = '<path d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6L17 12.5l4 1.5v3c0 2-1.5 4-4 4C9.3 21 3 14.7 3 7c0-2.5 2-4 4-4Z"/>';
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskEmail(value) {
  const [name, domain] = value.split('@');
  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, '');
  const lastFour = digits.slice(-4);
  const ddd = digits.slice(0, 2);
  return `(${ddd}) *****-${lastFour}`;
}
