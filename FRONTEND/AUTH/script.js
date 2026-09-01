const role_opt = document.querySelectorAll(".role-option"); 
const toggle = document.querySelector(".fa-eye");
const login_btn = document.querySelector(".login-btn");
const email = document.querySelector(".email-input");
const password = document.querySelector(".password-input");

let state = "WareHouse";
toggle.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        toggle.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        password.type = "password";
        toggle.classList.replace("fa-eye-slash", "fa-eye");
    }
});
login_btn.addEventListener("click", () => {
    CredentialVerification();
});
role_opt[0].addEventListener("click", () => {
    WareHouseAdmin();
});
role_opt[1].addEventListener("click", () => {
    TransitHubManager();
});
role_opt[2].addEventListener("click", () => {
    LocalDeliveryAgency();
});
function clearActive() { 
    role_opt.forEach((opt) => (opt.className = "role-option"));
}
function WareHouseAdmin() {
    clearActive();
    state = "WareHouse";
    role_opt[0].className = "role-option active";
}
function TransitHubManager() {
    clearActive();
    state = "TransitHub";
    role_opt[1].className = "role-option active";
}
function LocalDeliveryAgency() {
    clearActive();
    state = "LocalAgency";
    role_opt[2].className = "role-option active";
}

const endpointMap = {
    WareHouse: "http://127.0.0.1:8000/auth/warehouse",
    TransitHub: "http://127.0.0.1:8000/auth/transit",
    LocalAgency: "http://127.0.0.1:8000/auth/agency",
};

const redirectMap = {
    WareHouse: "../WAREHOUSE/warehouse.html",
    TransitHub: "../TRANSIT_HUB/hub.html",
    LocalAgency: "../LOCAL_AGENCY/agency.html",
};

async function CredentialVerification() {
    let email_val = email.value.trim();
    let password_val = password.value.trim();
    if (!email_val && !password_val) { alert("Email and Password are required"); return; }
    if (!email_val) { alert("Please enter Email"); return; }
    if (!password_val) { alert("Please enter Password"); return; }
    if (!email_val.includes("@") || !email_val.includes(".")) { alert("Invalid Email format"); return; }

    try {
        const res = await fetch(endpointMap[state], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: email_val, password: password_val }),
        });
        const data = await res.json();
        if (data.status === "success") {
            localStorage.setItem("session", JSON.stringify({ role: state, token: data.token, user: data.user }));
            window.location.href = redirectMap[state];
        } else {
            alert(data.message || "Invalid credentials.");
        }
    } catch (e) {
        console.error("Backend login error:", e);
        alert("Backend connection failed.");
    }
}
