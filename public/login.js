const form = document.getElementById("auth-form");
const title = document.getElementById("form-title");
const switchMode = document.getElementById("switch-mode");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-message");

let isLogin = true;

switchMode.addEventListener("click", () => {
	isLogin = !isLogin;

	errorMsg.classList.add("hidden");
	form.reset();

	if (isLogin) {
		title.textContent = "Login";
		submitBtn.textContent = "Masuk";
		switchMode.textContent = "Daftar";
		switchMode.parentElement.firstChild.textContent = "Belum punya akun? ";
	} else {
		title.textContent = "Sign Up";
		submitBtn.textContent = "Daftar";
		switchMode.textContent = "Login";
		switchMode.parentElement.firstChild.textContent = "Sudah punya akun? ";
	}
});

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	const BASE_URL = `${window.location.protocol}//${window.location.host}`;

	if (isLogin) {
		const request = await fetch(`${BASE_URL}/auth/login`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: username,
				password: password
			})
		});

		if (request.ok) {
			window.location.href = "chat.html";
		} else {
			errorMsg.classList.remove("hidden");
		}
	} else {
		const request = await fetch(`${BASE_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: username,
				password: password
			})
		});

		if(!request.ok){
			return alert("Gagal membuat akun: ", (await request.json()).error);
		}

		isLogin = true;
		title.textContent = "Login";
		submitBtn.textContent = "Masuk";
		switchMode.textContent = "Daftar";
		switchMode.parentElement.firstChild.textContent = "Belum punya akun? ";
		form.reset();
	}
});
