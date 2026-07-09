import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    onValue, 
    push, 
    update 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ==========================================================================
// TARGET NODE COUPLING INITIALIZATION INTERFACE
// ==========================================================================
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

// Initialize App Modules
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Runtime Scope Store Matrices
let currentCachedUserRole = null;
let networkMedicines = [];
let networkOrders = [];

// ==========================================================================
// UNFAILING VIEW NAVIGATION ROUTERS (FOR BOTH MOBILE & LAPTOP)
// ==========================================================================
const toggleView = (showCardId, hideCardId) => {
    const showCard = document.getElementById(showCardId);
    const hideCard = document.getElementById(hideCardId);
    if(showCard && hideCard) {
        hideCard.classList.add("hidden");
        showCard.classList.remove("hidden");
    }
};

// Explicit Event Binding (Works on desktop and mobile click/touch instantly)
const bindToggle = (elementId, targetShow, targetHide) => {
    const el = document.getElementById(elementId);
    if(el) {
        el.addEventListener("click", (e) => { e.preventDefault(); toggleView(targetShow, targetHide); });
        el.addEventListener("touchstart", (e) => { e.preventDefault(); toggleView(targetShow, targetHide); });
    }
};

bindToggle("go-to-signup", "signup-card", "signin-card");
bindToggle("go-to-signin", "signin-card", "signup-card");

// Mobile App Side Menu Drawer Toggle Link
const menuToggle = document.getElementById("mobile-menu-toggle");
if(menuToggle) {
    menuToggle.addEventListener("click", () => document.getElementById("app-sidebar").classList.toggle("open"));
}

// Single Page Application View Management
document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
        link.classList.add("active");
        
        const target = link.getAttribute("data-target");
        document.querySelectorAll(".tab-content").forEach(s => s.classList.add("hidden"));
        document.getElementById(target).classList.remove("hidden");
        
        document.getElementById("app-sidebar").classList.remove("open");
    });
});

// Modal Setup Interlocutors
const toggleModal = (modalId, open) => {
    const m = document.getElementById(modalId);
    if(m) open ? m.classList.remove("hidden") : m.classList.add("hidden");
};

document.getElementById("btn-open-add-med-modal")?.addEventListener("click", () => toggleModal("medicine-modal", true));
document.getElementById("close-med-modal")?.addEventListener("click", () => toggleModal("medicine-modal", false));
document.getElementById("btn-open-order-modal")?.addEventListener("click", () => toggleModal("order-modal", true));
document.getElementById("close-order-modal")?.addEventListener("click", () => toggleModal("order-modal", false));
document.getElementById("close-qr-modal")?.addEventListener("click", () => toggleModal("qr-modal", false));

// ==========================================================================
// AUTHENTICATION CONTROLLER CORE FUNCTIONS (WRITE & READ)
// ==========================================================================

// 1. SIGN-UP / REGISTRATION (WRITE TO AUTH + REALTIME DB)
document.getElementById("btn-register").addEventListener("click", async () => {
    const name = document.getElementById("reg-name").value.trim();
    const role = document.getElementById("reg-role").value;
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!name || !email || !password) { return alert("Complete all data verification fields before submission."); }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await set(ref(db, 'users/' + user.uid), {
            uid: user.uid,
            fullName: name,
            roleParameter: role,
            emailAddress: email
        });

        alert("Account provisioning verified! Opening Sign In Panel view...");
        toggleView("signin-card", "signup-card");
    } catch (error) {
        alert("Registration Block Fault: " + error.message);
    }
});

// 2. SIGN IN / AUTHORIZE METHOD
document.getElementById("btn-login").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert("Authorization Denied: " + error.message);
    }
});

// 3. LOGOUT TERMINATION INTERACTION LINK
document.getElementById("btn-logout").addEventListener("click", () => {
    signOut(auth);
});

// ==========================================================================
// STATE MANAGEMENT REACTION LISTENERS
// ==========================================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            currentCachedUserRole = userData.roleParameter;
            
            document.getElementById("user-role-badge").innerText = currentCachedUserRole;
            document.getElementById("user-display-name").innerText = userData.fullName;
            document.getElementById("user-display-email").innerText = userData.emailAddress;
            
            applyRBACPermissions(currentCachedUserRole);
            initRealtimeSyncDataStreams();
            
            document.getElementById("auth-container").classList.add("hidden");
            document.getElementById("app-container").classList.remove("hidden");
        }
    } else {
        document.getElementById("auth-container").classList.remove("hidden");
        document.getElementById("app-container").classList.add("hidden");
    }
});

function applyRBACPermissions(role) {
    const medBtn = document.getElementById("btn-open-add-med-modal");
    const orderBtn = document.getElementById("btn-open-order-modal");
    
    if(medBtn) medBtn.style.display = (role === "Admin" || role === "Manufacturer") ? "block" : "none";
    if(orderBtn) orderBtn.style.display = (role === "Distributor" || role === "Pharmacy") ? "block" : "none";
}

// ==========================================================================
// DATA STREAMING SYNCHRONIZERS (REALTIME LISTENERS)
// ==========================================================================
function initRealtimeSyncDataStreams() {
    onValue(ref(db, 'medicines'), (snapshot) => {
        networkMedicines = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                networkMedicines.push({ id: child.key, ...child.val() });
            });
        }
        processInterfaceRenderPipeline();
        populateOrderSelectOptions();
    });

    onValue(ref(db, 'orders'), (snapshot) => {
        networkOrders = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                networkOrders.push({ id: child.key, ...child.val() });
            });
        }
        processInterfaceRenderPipeline();
    });
}

// ==========================================================================
// UI PROCESSING & RENDER FLUID RE-EVALUATORS
// ==========================================================================
function processInterfaceRenderPipeline() {
    calculateSummaryMetrics();
    renderMedicineTable();
    renderInventoryLedger();
    renderOrderHubMatrix();
}

function calculateSummaryMetrics() {
    document.getElementById("stat-total-meds").innerText = networkMedicines.length;
    document.getElementById("stat-low-stock").innerText = networkMedicines.filter(m => m.stock <= 10).length;
    document.getElementById("stat-total-orders").innerText = networkOrders.length;
    document.getElementById("stat-delivered").innerText = networkOrders.filter(o => o.status === "Delivered").length;
}

function renderMedicineTable() {
    const body = document.getElementById("medicine-table-body");
    if(!body) return;
    body.innerHTML = "";
    networkMedicines.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${m.name}</strong><br><small>${m.category}</small></td>
            <td><code>${m.batch}</code></td>
            <td><small>Mfg: ${m.mfgDate}<br>Exp: ${m.expDate}</small></td>
            <td>
                <button class="action-badge badge-blue" id="qr-${m.id}"><i class="fa-solid fa-qrcode"></i> Scan</button>
            </td>
        `;
        tr.querySelector(`#qr-${m.id}`).addEventListener("click", () => triggerQRModalDisplay(m));
        body.appendChild(tr);
    });
}

function renderInventoryLedger() {
    const body = document.getElementById("inventory-table-body");
    if(!body) return;
    body.innerHTML = "";
    networkMedicines.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td><code>${m.batch}</code></td>
            <td>${m.stock} Units</td>
            <td>${m.reserved} Units</td>
            <td><strong>${m.stock - m.reserved} Units</strong></td>
        `;
        body.appendChild(tr);
    });
}

function renderOrderHubMatrix() {
    const body = document.getElementById("orders-table-body");
    if(!body) return;
    body.innerHTML = "";
    networkOrders.forEach(o => {
        let actBtns = "";
        
        if ((currentCachedUserRole === "Admin" || currentCachedUserRole === "Manufacturer") && o.status === "Ordered") {
            actBtns += `<button class="action-badge badge-green" id="pack-${o.id}">Pack Block</button>`;
        } else if ((currentCachedUserRole === "Admin" || currentCachedUserRole === "Manufacturer") && o.status === "Packed") {
            actBtns += `<button class="action-badge badge-blue" id="disp-${o.id}">Dispatch</button>`;
        } else if (currentCachedUserRole === "Distributor" && o.status === "Dispatched") {
            actBtns += `<button class="action-badge badge-orange" id="transit-${o.id}">Ship Routing</button>`;
        } else if (currentCachedUserRole === "Pharmacy" && o.status === "In Transit") {
            actBtns += `<button class="action-badge badge-green" id="deliv-${o.id}">Confirm Handover</button>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><code>${o.id.substring(1,8)}...</code></td>
            <td>${o.name}</td><td>${o.qty}</td><td>${o.buyer}</td>
            <td><span class="action-badge badge-orange">${o.status}</span></td>
            <td>${actBtns || '<em>Hold View</em>'}</td>
        `;

        if (tr.querySelector(`#pack-${o.id}`)) tr.querySelector(`#pack-${o.id}`).addEventListener("click", () => updateOrderStatusBlock(o.id, "Packed"));
        if (tr.querySelector(`#disp-${o.id}`)) tr.querySelector(`#disp-${o.id}`).addEventListener("click", () => updateOrderStatusBlock(o.id, "Dispatched"));
        if (tr.querySelector(`#transit-${o.id}`)) tr.querySelector(`#transit-${o.id}`).addEventListener("click", () => updateOrderStatusBlock(o.id, "In Transit"));
        if (tr.querySelector(`#deliv-${o.id}`)) tr.querySelector(`#deliv-${o.id}`).addEventListener("click", () => finalizeOrderDeliveryReceipt(o));
        
        body.appendChild(tr);
    });
}

// ==========================================================================
// CORE BUSINESS RECORD SYSTEM FORM TRANSACTIONS
// ==========================================================================
document.getElementById("medicine-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const medRef = push(ref(db, 'medicines'));
    
    await set(medRef, {
        name: document.getElementById("med-name").value,
        category: document.getElementById("med-category").value,
        batch: document.getElementById("med-batch").value,
        mfgDate: document.getElementById("med-mfg-date").value,
        expDate: document.getElementById("med-exp-date").value,
        stock: parseInt(document.getElementById("med-stock").value),
        reserved: 0,
        price: parseFloat(document.getElementById("med-price").value)
    });
    
    document.getElementById("medicine-form").reset();
    toggleModal("medicine-modal", false);
});

function populateOrderSelectOptions() {
    const s = document.getElementById("order-med-select");
    if (!s) return;
    s.innerHTML = "";
    networkMedicines.forEach(m => {
        s.innerHTML += `<option value="${m.id}">${m.name} (Avail: ${m.stock - m.reserved})</option>`;
    });
}

document.getElementById("order-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const targetId = document.getElementById("order-med-select").value;
    const qty = parseInt(document.getElementById("order-qty").value);
    const item = networkMedicines.find(m => m.id === targetId);

    if(qty > (item.stock - item.reserved)) return alert("Request exceeds active batch safety margin.");

    await update(ref(db, `medicines/${targetId}`), { reserved: item.reserved + qty });

    const oRef = push(ref(db, 'orders'));
    await set(oRef, {
        medId: targetId,
        name: item.name,
        qty: qty,
        buyer: auth.currentUser.email,
        status: "Ordered"
    });

    toggleModal("order-modal", false);
});

async function updateOrderStatusBlock(id, status) {
    await update(ref(db, `orders/${id}`), { status: status });
}

async function finalizeOrderDeliveryReceipt(order) {
    const item = networkMedicines.find(m => m.id === order.medId);
    const updates = {
        stock: item.stock - order.qty,
        reserved: item.reserved - order.qty
    };
    await update(ref(db, `medicines/${order.medId}`), { stock: updates.stock, reserved: updates.reserved });
    await update(ref(db, `orders/${order.id}`), { status: "Delivered" });
}

// ==========================================================================
// TRACELINK AMAZON TRACKING MAPPER & GENERATORS
// ==========================================================================
document.getElementById("btn-trace-shipment").addEventListener("click", () => {
    const val = document.getElementById("track-search-input").value.trim();
    const order = networkOrders.find(o => o.id === val || o.id.includes(val));

    if(!order) return alert("System could not match the transaction hash parameters.");

    const steps = ["Ordered", "Packed", "Dispatched", "In Transit", "Delivered"];
    const currentIdx = steps.indexOf(order.status);

    steps.forEach((s) => {
        const stepEl = document.getElementById(`step-${s.toLowerCase().replace(" ", "")}`);
        if(steps.indexOf(s) <= currentIdx) {
            stepEl.classList.add("active");
            if(stepEl.nextElementSibling) stepEl.nextElementSibling.classList.add("active");
        } else {
            stepEl.classList.remove("active");
            if(stepEl.nextElementSibling) stepEl.nextElementSibling.classList.remove("active");
        }
    });
    document.getElementById("tracking-visualizer").classList.remove("hidden");
});

function triggerQRModalDisplay(m) {
    document.getElementById("qr-data-payload").innerText = JSON.stringify({
        origin_node: "TraceLink Verified Ledger Entry",
        item_id: m.id,
        nomenclature: m.name,
        batch_hash: m.batch,
        lifecycle: `Mfg: ${m.mfgDate} | Exp: ${m.expDate}`,
        base_valuation: `$${m.price}`
    }, null, 2);
    toggleModal("qr-modal", true);
}