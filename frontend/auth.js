// Initialize Firebase Auth
const auth = firebase.auth();

// Set authentication persistence to SESSION
// This ensures that when the browser window is closed, the user will need to login again
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authToggle = document.getElementById('authToggle');

// Toggle between login and register forms
authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.toggle('d-none');
    registerForm.classList.toggle('d-none');
    authToggle.textContent = loginForm.classList.contains('d-none') ? 'Já tem uma conta? Entre' : 'Criar uma conta';
});

// Login with email/password
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = '/index.html';
        })
        .catch((error) => {
            alert('Erro ao fazer login: ' + error.message);
        });
});

// Register with email/password
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Send email verification
            return userCredential.user.sendEmailVerification();
        })
        .then(() => {
            alert('Conta criada com sucesso! Por favor, verifique seu email para ativar sua conta.');
            window.location.href = '/verification.html';
        })
        .catch((error) => {
            alert('Erro ao criar conta: ' + error.message);
        });
});

// Google Sign In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            window.location.href = '/index.html';
        })
        .catch((error) => {
            alert('Erro ao fazer login com Google: ' + error.message);
        });
}

// Phone Authentication
function startPhoneAuth() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const appVerifier = window.recaptchaVerifier;

    auth.signInWithPhoneNumber(phoneNumber, appVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            const code = prompt('Digite o código enviado por SMS:');
            return confirmationResult.confirm(code);
        })
        .then(() => {
            window.location.href = '/index.html';
        })
        .catch((error) => {
            alert('Erro na autenticação por telefone: ' + error.message);
        });
}

// Password Reset
function resetPassword() {
    const email = prompt('Digite seu email para redefinir a senha:');
    if (email) {
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert('Email de redefinição de senha enviado! Verifique sua caixa de entrada.');
            })
            .catch((error) => {
                alert('Erro ao enviar email de redefinição: ' + error.message);
            });
    }
}

// Initialize reCAPTCHA verifier
window.onload = function() {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
            // reCAPTCHA solved, enable sign-in button
            document.getElementById('phoneSignInButton').disabled = false;
        }
    });
};

// Check auth state
auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;
    
    if (user) {
        // User is signed in
        if (currentPath === '/login.html') {
            // Redirect to index.html only if user is on login page
            if (user.emailVerified || user.providerData[0].providerId !== 'password') {
                window.location.href = '/index.html';
            } else {
                window.location.href = '/verification.html';
            }
        } else if (currentPath === '/verification.html') {
            // If on verification page and email is verified, redirect to index
            if (user.emailVerified || user.providerData[0].providerId !== 'password') {
                window.location.href = '/index.html';
            }
        } else if ((currentPath === '/index.html' || currentPath === '/') && 
                  user.providerData[0].providerId === 'password' && 
                  !user.emailVerified) {
            // If trying to access protected pages without email verification
            window.location.href = '/verification.html';
        }
    } else {
        // No user is signed in
        if (currentPath === '/index.html' || currentPath === '/' || currentPath === '/verification.html') {
            // Redirect to login page if user tries to access protected pages
            window.location.href = '/login.html';
        }
    }
});