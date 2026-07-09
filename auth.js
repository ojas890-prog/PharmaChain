import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ================= Firebase Configuration =================
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

// Initialize App References
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Wait for DOM to load fully before binding listeners
document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const signinForm = document.getElementById("signin-form");
    const signupForm = document.getElementById("signup-form");
    const loginBtn = document.getElementById("btn-login");
    const registerBtn = document.getElementById("btn-register");

    // Helper functions inside DOM scope
    function resetLoginButton() {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Authorize Session</span> <i class="fa-solid fa-arrow-right-to-bracket"></i>';
        }
    }

    function resetRegisterButton() {
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<span>Provision Network Account</span> <i class="fa-solid fa-circle-check"></i>';
        }
    }

    // ================= HANDLER A: SIGN IN LOGIC =================
    if (signinForm) {
        signinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;

            if (!email || !password) {
                alert("Please fill out your network login credentials.");
                return;
            }

            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<span>Authorizing Access Vector...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                const snap = await get(ref(db, 'users/' + user.uid));
                
                if (snap.exists()) {
                    const userData = snap.val();
                    alert(`Authentication Approved! Welcome role: ${userData.roleParameter}`);
                    window.location.href = "dashboard.html";
                } else {
                    alert("Security Error: User profile node data does not exist in Realtime Database.");
                    resetLoginButton();
                }
            } catch (error) {
                alert("Authorization Refused: " + error.message);
                resetLoginButton();
            }
        });
    }

    // ================= HANDLER B: SIGN UP LOGIC =================
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("reg-name").value.trim();
            const role = document.getElementById("reg-role").value;
            const email = document.getElementById("reg-email").value.trim();
            const password = document.getElementById("reg-password").value;

            if (!name || !role || !email || !password) {
                alert("Please fill in all layout profile metrics.");
                return;
            }

            if (password.length < 6) {
                alert("Passphrase length requirement not met (minimum 6 signs).");
                return;
            }

            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.innerHTML = '<span>Provisioning Identity...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await set(ref(db, "users/" + user.uid), {
                    uid: user.uid,
                    fullName: name,
                    roleParameter: role,
                    emailAddress: email,
                    timestampCreated: new Date().toISOString()
                });

                alert("Registration complete! Your profile ledger node has been synchronized.");
                signupForm.reset();
                
                const signinTab = document.getElementById('tab-signin');
                if (signinTab) signinTab.click();

                resetRegisterButton();
            } catch (error) {
                alert("Registration Core Error: " + error.message);
                resetRegisterButton();
            }
        });
    }
});

// ================= MONITOR NAVIGATION SAFETY SYSTEM =================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const snap = await get(ref(db, 'users/' + user.uid));
            if (snap.exists()) {
                console.log("Session tracking found user active. Moving to routing gate...");
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            console.error("Tracking routine failed to evaluate database snapshot paths:", error);
        }
    } else {
        console.log("No authorization token parsed on runtime. Input vectors ready.");
    }
});