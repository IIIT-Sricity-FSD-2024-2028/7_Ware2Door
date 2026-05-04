"use strict";

const API_BASE = "http://localhost:8000";
const emailInput = document.getElementById("su-email");
const passwordInput = document.getElementById("su-password");
const loginBtn = document.getElementById("login-btn");
const togglePwd = document.getElementById("toggle-pwd");

togglePwd.addEventListener("click", () => {
    const isText = passwordInput.type === "text";
    passwordInput.type = isText ? "password" : "text";
    togglePwd.classList.toggle("fa-eye-slash", !isText);
    togglePwd.classList.toggle("fa-eye", isText);
});
emailInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
loginBtn.addEventListener("click", attemptLogin);

async function attemptLogin() {
    const email = emailInput.value.trim().toLowerCase();
    const pwd = passwordInput.value.trim();
    if (!email && !pwd) { alert("Email and Password are required"); return; }
    if (!email) { alert("Please enter Email"); return; }
    if (!pwd) { alert("Please enter Password"); return; }
    if (!email.includes("@") || !email.includes(".")) { alert("Invalid Email format"); return; }

    loginBtn.classList.add("loading");
    loginBtn.textContent = "Authenticating...";

    try {
        const res = await fetch(`${API_BASE}/auth/superuser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: pwd }),
        });
        const data = await res.json();
        if (data.status === "success") {
            const user = data.message;
            localStorage.setItem("session", JSON.stringify({
                role: "SuperUser",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || "+91 9000000000",
                    address: user.address || "Ware2Door HQ, Chennai",
                    suId: user.id,
                },
            }));
            window.location.href = "superuser.html";
        } else {
            loginBtn.classList.remove("loading");
            loginBtn.textContent = "Login";
            alert(data.message || "Invalid credentials. Access denied.");
        }
    } catch (e) {
        loginBtn.classList.remove("loading");
        loginBtn.textContent = "Login";
        alert("Failed to connect to the server. Is the backend running?");
    }
}
