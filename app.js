// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNipGBlG1w1FlCVknNxA3WYv8TMYL85bs",
  authDomain: "finpla-c575c.firebaseapp.com",
  databaseURL: "https://finpla-c575c-default-rtdb.firebaseio.com",
  projectId: "finpla-c575c",
  storageBucket: "finpla-c575c.firebasestorage.app",
  messagingSenderId: "417838979466",
  appId: "1:417838979466:web:91481c276febd368075073",
  measurementId: "G-KS97CRRJ11"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const appContent = document.getElementById('app-content');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksList = document.getElementById('tasks');

// Authentication state observer
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        userEmail.textContent = user.email;
        userInfo.classList.remove('hidden');
        authForm.classList.add('hidden');
        appContent.classList.remove('hidden');
        loadTasks(user.uid);
    } else {
        // User is signed out
        userInfo.classList.add('hidden');
        authForm.classList.remove('hidden');
        appContent.classList.add('hidden');
        // Clear task list
        tasksList.innerHTML = '';
    }
});

// Login
loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (email && password) {
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                alert(`Login Error: ${error.message}`);
            });
    } else {
        alert('Please enter both email and password');
    }
});

// Sign Up
signupBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (email && password) {
        auth.createUserWithEmailAndPassword(email, password)
            .catch(error => {
                alert(`Sign Up Error: ${error.message}`);
            });
    } else {
        alert('Please enter both email and password');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Add a new task
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();
    const user = auth.currentUser;
    
    if (taskText && user) {
        // Create a new task in the database
        const tasksRef = database.ref(`users/${user.uid}/tasks`);
        const newTaskRef = tasksRef.push();
        
        newTaskRef.set({
            text: taskText,
            completed: false,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        taskInput.value = '';
    }
}

// Load tasks from Firebase
function loadTasks(userId) {
    const tasksRef = database.ref(`users/${userId}/tasks`);
    
    // Clear existing tasks
    tasksList.innerHTML = '';
    
    // Listen for changes in the tasks
    tasksRef.orderByChild('timestamp').on('child_added', snapshot => {
        const task = snapshot.val();
        const taskId = snapshot.key;
        
        createTaskElement(taskId, task);
    });
    
    tasksRef.on('child_changed', snapshot => {
        const task = snapshot.val();
        const taskId = snapshot.key;
        const taskElement = document.getElementById(taskId);
        
        if (taskElement) {
            taskElement.remove();
            createTaskElement(taskId, task);
        }
    });
    
    tasksRef.on('child_removed', snapshot => {
        const taskId = snapshot.key;
        const taskElement = document.getElementById(taskId);
        
        if (taskElement) {
            taskElement.remove();
        }
    });
}

// Create a task element and append it to the list
function createTaskElement(taskId, task) {
    const li = document.createElement('li');
    li.id = taskId;
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompletion(taskId, checkbox.checked));
    
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(taskId));
    
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    
    tasksList.appendChild(li);
}

// Toggle task completion status
function toggleTaskCompletion(taskId, completed) {
    const user = auth.currentUser;
    if (user) {
        database.ref(`users/${user.uid}/tasks/${taskId}`).update({
            completed: completed
        });
    }
}

// Delete a task
function deleteTask(taskId) {
    const user = auth.currentUser;
    if (user) {
        database.ref(`users/${user.uid}/tasks/${taskId}`).remove();
    }
}