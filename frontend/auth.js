// Initialize Firebase Auth
const auth = firebase.auth();

// Set authentication persistence to SESSION
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .catch(error => console.error('Error setting auth persistence:', error));

// Google Sign In
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      window.location.href = '/index.html';
    })
    .catch(error => {
      alert('Erro ao fazer login com Google: ' + error.message);
      console.error('Google Sign In Error:', error);
    });
}

// Check auth state
auth.onAuthStateChanged(user => {
  const currentPath = window.location.pathname;
  if (user) {
    if (currentPath === '/login.html') {
      window.location.href = '/index.html';
    }
  } else {
    if (currentPath === '/index.html' || currentPath === '/') {
      window.location.href = '/login.html';
    }
  }
});