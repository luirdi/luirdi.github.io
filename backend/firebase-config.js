// firebase-config.js
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
        
        // Inicializar o Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Obter referência do banco de dados
        const database = firebase.database();