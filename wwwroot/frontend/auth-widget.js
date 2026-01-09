function initAuthWidget() {
	const toggle = document.getElementById("auth-toggle");
	const panel = document.getElementById("auth-panel");
	if (!toggle || !panel) return;

	const API_BASE = "http://localhost:5194";

	const viewButtons = Array.from(panel.querySelectorAll("[data-auth-view]"));
	const viewPanels = Array.from(panel.querySelectorAll("[data-auth-panel]"));

	let messageEl = panel.querySelector("[data-auth-message]");
	if (!messageEl) {
		messageEl = document.createElement("div");
		messageEl.setAttribute("data-auth-message", "");
		messageEl.setAttribute("role", "status");
		messageEl.setAttribute("aria-live", "polite");
		messageEl.style.marginBottom = "10px";
		const actions = panel.querySelector(".auth-actions");
		if (actions && actions.parentNode) {
			actions.parentNode.insertBefore(messageEl, actions.nextSibling);
		} else {
			panel.prepend(messageEl);
		}
	}

	function setMessage(text) {
		messageEl.textContent = text || "";
	}

	function setView(viewName) {
		for (const btn of viewButtons) {
			const pressed = btn.dataset.authView === viewName;
			btn.setAttribute("aria-pressed", String(pressed));
		}
		for (const p of viewPanels) {
			const isVisible = p.dataset.authPanel === viewName;
			p.hidden = !isVisible;
			p.style.display = isVisible ? "" : "none";
		}
	}

	function open() {
		setMessage("");
		setView("login");
		panel.hidden = false;
		toggle.setAttribute("aria-expanded", "true");
	}

	function close() {
		panel.hidden = true;
		toggle.setAttribute("aria-expanded", "false");
	}

	toggle.addEventListener("click", () => {
		if (panel.hidden) open();
		else close();
	});

	for (const btn of viewButtons) {
		btn.addEventListener("click", () => {
			setView(btn.dataset.authView);
		});
	}

	async function postJson(path, body) {
		const response = await fetch(`${API_BASE}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		return response;
	}

	const loginForm = panel.querySelector('form[data-auth-panel="login"]');
	const registerForm = panel.querySelector('form[data-auth-panel="register"]');

	if (loginForm instanceof HTMLFormElement) {
		loginForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			setMessage("Đang đăng nhập...");
			const email = panel.querySelector("#auth-login-email")?.value || "";
			const password = panel.querySelector("#auth-login-password")?.value || "";
			try {
				const response = await postJson("/api/auth/login", { email, password });
				if (response.ok) {
					setMessage("Đăng nhập thành công.");
					return;
				}
				if (response.status === 401) {
					setMessage("Sai email hoặc mật khẩu.");
					return;
				}
				let data;
				try {
					data = await response.json();
				} catch {
					data = null;
				}
				setMessage(data?.message || `Đăng nhập thất bại (HTTP ${response.status}).`);
			} catch (err) {
				console.error(err);
				setMessage("Không gọi được backend.");
			}
		});
	}

	if (registerForm instanceof HTMLFormElement) {
		registerForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			setMessage("Đang đăng ký...");
			const fullName = panel.querySelector("#auth-register-fullName")?.value || "";
			const email = panel.querySelector("#auth-register-email")?.value || "";
			const password = panel.querySelector("#auth-register-password")?.value || "";
			try {
				const response = await postJson("/api/auth/register", { fullName, email, password });
				if (response.ok) {
					setView("login");
					setMessage("Đăng ký thành công.");
					return;
				}
				let data;
				try {
					data = await response.json();
				} catch {
					data = null;
				}
				if (response.status === 409) {
					setMessage(data?.message || "Email đã được đăng ký.");
					return;
				}
				setMessage(data?.message || `Đăng ký thất bại (HTTP ${response.status}).`);
			} catch (err) {
				console.error(err);
				setMessage("Không gọi được backend.");
			}
		});
	}

	document.addEventListener("mousedown", (e) => {
		if (panel.hidden) return;
		const target = e.target;
		if (!(target instanceof Node)) return;
		if (panel.contains(target) || toggle.contains(target)) return;
		close();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !panel.hidden) close();
	});

	setView("login");
	close();
}

initAuthWidget();
