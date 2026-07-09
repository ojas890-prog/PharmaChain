import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCG8Nl2pcXWR8vhQB04Z_qIT35eV7MmHHI",
    authDomain: "pharmachain-system-63ccd.firebaseapp.com",
    projectId: "pharmachain-system-63ccd",
    storageBucket: "pharmachain-system-63ccd.firebasestorage.app",
    messagingSenderId: "150034620878",
    appId: "1:150034620878:web:5a9ea66f201bc0983fcb9f",
    measurementId: "G-YDQ0G3W6FD",
    databaseURL: "https://pharmachain-system-63ccd-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("auth.html");
    } else {
        try {
            const snap = await get(ref(db, 'users/' + user.uid));
            if (snap.exists()) {
                const userData = snap.val();
                const role = userData.roleParameter;

                // Route nodes to their absolute layout directories
                if (role === "Admin") {
                    window.location.replace("admin.html");
                } else if (role === "Manufacturer") {
                    window.location.replace("manufacturer.html");
                } else if (role === "Distributor") {
                    window.location.replace("distributor.html");
                } else if (role === "Pharmacy") {
                    window.location.replace("pharmacy.html");
                } else {
                    alert("Unknown node assignment parameter profile error.");
                    window.location.replace("auth.html");
                }
            } else {
                window.location.replace("auth.html");
            }
        } catch (err) {
            console.error(err);
            window.location.replace("auth.html");
        }
    }
});