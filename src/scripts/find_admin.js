const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

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

async function findAdmin() {
    const q = query(collection(db, "users"), where("isAdmin", "==", true));
    const snap = await getDocs(q);
    snap.forEach((doc) => {
        console.log(`Admin found! Email: ${doc.data().email}`);
    });
}

findAdmin();
