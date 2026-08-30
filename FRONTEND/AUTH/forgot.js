const API_BASE = "http://localhost:8000";

const step1 = document.getElementById("step-1");
const step2 = document.getElementById("step-2");
const emailInpt = document.getElementById("email-inpt");
const otpInpt = document.getElementById("otp-inpt");
const newPwdInpt = document.getElementById("new-pwd-inpt");
const confirmPwdInpt = document.getElementById("confirm-pwd-inpt");
const verifyBtn = document.getElementById("verify-btn");
const resetBtn = document.getElementById("reset-btn");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

let verifiedEmail = "";

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
}

function showSuccess(msg) {
    successMsg.textContent = msg;
    successMsg.style.display = "block";
    errorMsg.style.display = "none";
}

function clearMessages() {
    errorMsg.style.display = "none";
    successMsg.style.display = "none";
}

verifyBtn.addEventListener("click", async () => {
    clearMessages();
    const email = emailInpt.value.trim();
    if (!email) {
        showError("Please enter your email address.");
        return;
    }

    verifyBtn.textContent = "Verifying...";
    verifyBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (res.ok && data.exists) {
            verifiedEmail = email;
            step1.style.display = "none";
            step2.style.display = "block";
            showSuccess("OTP sent to your email address!");
        } else {
            showError(data.error || data.message || "Email not found in our records.");
        }
    } catch (e) {
        showError("Failed to connect to the server.");
    } finally {
        verifyBtn.textContent = "Verify Email →";
        verifyBtn.disabled = false;
    }
});

resetBtn.addEventListener("click", async () => {
    clearMessages();
    const otp = otpInpt.value.trim();
    const newPwd = newPwdInpt.value.trim();
    const confirmPwd = confirmPwdInpt.value.trim();

    if (!otp || !newPwd || !confirmPwd) {
        showError("Please fill out all fields.");
        return;
    }

    if (otp !== "000000") {
        showError("Invalid OTP. Please enter a valid 6-digit OTP.");
        return;
    }
    
    if (newPwd !== confirmPwd) {
        showError("Passwords do not match.");
        return;
    }
    
    if (newPwd.length < 6) {
        showError("Password must be at least 6 characters long.");
        return;
    }

    resetBtn.textContent = "Resetting...";
    resetBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: verifiedEmail, otp, newPassword: newPwd })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
            showSuccess("Password reset successfully! Redirecting...");
            setTimeout(() => {
                window.location.href = "home.html";
            }, 2000);
        } else {
            showError(data.error || data.message || "Failed to reset password.");
        }
    } catch (e) {
        showError("Failed to connect to the server.");
    } finally {
        resetBtn.textContent = "Reset Password ✓";
        resetBtn.disabled = false;
    }
});
