const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, orderBy, limit, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDmrlecFLITi60Lz-J_XTdM8WNgc6UQn6w",
  authDomain: "restockv3.firebaseapp.com",
  projectId: "restockv3",
  storageBucket: "restockv3.firebasestorage.app",
  messagingSenderId: "323249489841",
  appId: "1:323249489841:web:cd0ea65f0c8d128521df90"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findLastUser() {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(1));
    const snap = await getDocs(q);
    snap.forEach((doc) => {
        console.log(`Last user: ID: ${doc.id}, Email: ${doc.data().email}`);
    });
}

findLastUser();
