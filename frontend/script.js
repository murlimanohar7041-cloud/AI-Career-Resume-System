const API =
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "http://localhost:5000/api/auth"
        : "/api/auth";


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {
    document.getElementById("registerBox").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
    document.getElementById("message").innerText = "";
}


// ===============================
// SHOW REGISTER
// ===============================

function showRegister() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("registerBox").classList.remove("hidden");
    document.getElementById("message").innerText = "";
}


// ===============================
// REGISTER
// ===============================

async function registerUser() {

    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {

        const response = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        document.getElementById("message").innerText = data.message;

        if (response.ok) {
            showLogin();
        }

    } catch (error) {

        console.error(error);

        document.getElementById("message").innerText =
            "Server connection failed";
    }
}


// ===============================
// NORMAL LOGIN
// ===============================

async function loginUser() {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        document.getElementById("message").innerText = data.message;

        if (response.ok) {

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            window.location.href = "dashboard.html";
        }

    } catch (error) {

        console.error(error);

        document.getElementById("message").innerText =
            "Server connection failed";
    }
}


// ===============================
// GOOGLE LOGIN
// ===============================

window.onload = function () {

    if (
        typeof google !== "undefined" &&
        document.getElementById("googleBtn")
    ) {

        google.accounts.id.initialize({
            client_id: "945939555909-vpjva6uob18lfs5n2q17j0aeelst5sqd.apps.googleusercontent.com",
            callback: handleGoogleLogin
        });

        google.accounts.id.renderButton(
            document.getElementById("googleBtn"),
            {
                theme: "outline",
                size: "large",
                width: 400,
                text: "continue_with"
            }
        );
    }
};


// ===============================
// GOOGLE LOGIN CALLBACK
// ===============================

async function handleGoogleLogin(response) {

    try {

        const result = await fetch(`${API}/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        const data = await result.json();

        console.log("Google Backend Response:", data);

        if (result.ok) {

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            window.location.href = "dashboard.html";

        } else {

            document.getElementById("message").innerText =
                data.message || "Google Login failed";
        }

    } catch (error) {

        console.error("Google Login Error:", error);

        document.getElementById("message").innerText =
            "Server connection failed";
    }
}