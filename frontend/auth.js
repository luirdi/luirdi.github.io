// Initialize Firebase Auth
const auth = firebase.auth();

// Set authentication persistence to SESSION
// This ensures that when the browser window is closed, the user will need to login again
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

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

// Check auth state
auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;
    
    if (user) {
        // User is signed in
        if (currentPath === '/login.html') {
            // Redirect to index.html if user is on login page
            window.location.href = '/index.html';
        }
    } else {
        // No user is signed in
        if (currentPath === '/index.html' || currentPath === '/') {
            // Redirect to login page if user tries to access protected pages
            window.location.href = '/login.html';
        }
    }
});