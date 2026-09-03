"use strict";

const API_BASE = "http://127.0.0.1:8000";

const existing = JSON.parse(localStorage.getItem("su_session") || "null");
if (existing?.token) window.location.href = "superuser.html";

const emailInput = document.getElementById("su-email");
const passwordInput = document.getElementById("su-password");
const loginBtn = document.getElementById("login-btn");
const togglePwd = document.getElementById("toggle-pwd");
const errorMsg = document.getElementById("error-msg");
const errorText = document.getElementById("error-text");
let loginInProgress = false;

togglePwd.addEventListener("click", () => {
    const isText = passwordInput.type === "text";
    passwordInput.type = isText ? "password" : "text";
    togglePwd.classList.toggle("fa-eye-slash", !isText);
    togglePwd.classList.toggle("fa-eye", isText);
});

emailInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
loginBtn.addEventListener("click", attemptLogin);

function showError(msg) {
    errorText.textContent = msg;
    errorMsg.style.display = "flex";
}
function clearError() { errorMsg.style.display = "none"; }

async function attemptLogin() {
    if (loginInProgress) return;
    clearError();
    const email = emailInput.value.trim().toLowerCase();
    const pwd = passwordInput.value.trim();

    if (!email) { showError("Please enter your email address."); return; }
    if (!email.includes("@") || !email.includes(".")) {
        showError("Please enter a valid email address.");
        return;
    }
    if (!pwd) { showError("Please enter your password."); return; }

    loginInProgress = true;
    loginBtn.disabled = true;
    loginBtn.classList.add("loading");
    loginBtn.textContent = "Authenticating…";

    try {
        const res = await fetch(`${API_BASE}/auth/superuser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password: pwd }),
        });
        const data = await res.json();

        if (data.status === "success" && data.token) {
            const user = data.user;
            localStorage.setItem("su_session", JSON.stringify({
                role: "SUPERUSER",
                token: data.token,
                loginAt: new Date().toISOString(),
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            }));
            window.location.href = "superuser.html";
        } else {
            showError(data.message || "Invalid credentials. Access denied.");
        }
    } catch (err) {
        showError("Cannot connect to server. Make sure backend is running on port 8000.");
    } finally {
        loginInProgress = false;
        loginBtn.disabled = false;
        loginBtn.classList.remove("loading");
        loginBtn.textContent = "Login to Portal";
    }
}
