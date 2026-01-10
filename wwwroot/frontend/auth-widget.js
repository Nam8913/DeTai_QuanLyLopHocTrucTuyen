function initAuthWidget() {
	// auth-widget.js = widget đăng nhập/đăng ký dạng “popup panel”.
	// - Khi chưa đăng nhập: click icon => mở/đóng panel
	// - Khi đã đăng nhập: click icon => chuyển sang profileUser.html
	// - Khi login thành công: lưu state vào localStorage + phát event để UI cập nhật

	const toggle = document.getElementById("auth-toggle");
	const panel = document.getElementById("auth-panel");
	if (!toggle || !panel) return;

	const API_BASE = "http://localhost:5194";
	const AUTH_STORAGE_KEY = "myclassroom.auth";

	function getAuthState() {
		try {
			const raw = localStorage.getItem(AUTH_STORAGE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== "object") return null;
			return parsed;
		} catch {
			return null;
		}
	}

	function isLoggedIn() {
		const state = getAuthState();
		return Boolean(state?.email);
	}

	const viewButtons = Array.from(panel.querySelectorAll("[data-auth-view]"));
	const viewPanels = Array.from(panel.querySelectorAll("[data-auth-panel]"));

	let messageEl = panel.querySelector("[data-auth-message]");
	if (!messageEl) {
		// Tạo vùng hiển thị thông báo (success/error) trong panel.
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
		// Đổi giữa 2 view: login / register.
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
		// Mở panel, mặc định show login.
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
		// Nếu đã login thì icon account sẽ đưa thẳng tới profile.
		if (isLoggedIn()) {
			window.location.href = "profileUser.html";
			return;
		}
		if (panel.hidden) open();
		else close();
	});

	for (const btn of viewButtons) {
		btn.addEventListener("click", () => {
			setView(btn.dataset.authView);
		});
	}

	async function postJson(path, body) {
		// Helper gọi API JSON.
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

	function ensureRoleField() {
		// Đảm bảo form register có select role.
		// Mình inject bằng JS để không phải sửa tất cả HTML pages.
		if (!(registerForm instanceof HTMLFormElement)) return;
		if (registerForm.querySelector("#auth-register-role")) return;

		const wrapper = document.createElement("div");
		const label = document.createElement("label");
		label.setAttribute("for", "auth-register-role");
		label.textContent = "Chức vụ";

		const select = document.createElement("select");
		select.id = "auth-register-role";
		select.name = "role";
		select.required = true;

		const optStudent = document.createElement("option");
		optStudent.value = "student";
		optStudent.textContent = "Học sinh";
		const optTeacher = document.createElement("option");
		optTeacher.value = "teacher";
		optTeacher.textContent = "Giáo viên";
		select.append(optStudent, optTeacher);

		wrapper.append(label, select);

		// Insert sau ô FullName nếu có, không thì chèn lên đầu form.
		const fullNameInput = registerForm.querySelector("#auth-register-fullName");
		const fullNameBlock = fullNameInput?.closest("div");
		if (fullNameBlock && fullNameBlock.parentNode) {
			fullNameBlock.parentNode.insertBefore(wrapper, fullNameBlock.nextSibling);
		} else {
			registerForm.prepend(wrapper);
		}
	}

	if (loginForm instanceof HTMLFormElement) {
		loginForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			setMessage("Đang đăng nhập...");
			const email = panel.querySelector("#auth-login-email")?.value || "";
			const password = panel.querySelector("#auth-login-password")?.value || "";
			try {
				const response = await postJson("/api/auth/login", { email, password });
				if (response.ok) {
					// Backend trả về { email, fullName, role }
					let data;
					try {
						data = await response.json();
					} catch {
						data = null;
					}
					const fullName = typeof data?.fullName === "string" ? data.fullName : "";
					const normalizedEmail = (typeof data?.email === "string" ? data.email : email).trim();
					const role = typeof data?.role === "string" ? data.role : "student";
					try {
						// Lưu state để các trang khác (tabs/profile) đọc.
						localStorage.setItem(
							AUTH_STORAGE_KEY,
							JSON.stringify({ email: normalizedEmail, fullName, role, loggedInAt: Date.now() })
						);
					} catch {
						// ignore storage errors
					}
					setMessage("Đăng nhập thành công.");
					close();
					try {
						// Báo cho main.js biết auth đã đổi => render tabs/hydrate profile.
						window.dispatchEvent(new CustomEvent("myclassroom:auth-changed"));
					} catch {
						// ignore
					}
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
		ensureRoleField();
		registerForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			setMessage("Đang đăng ký...");
			const fullName = panel.querySelector("#auth-register-fullName")?.value || "";
			const email = panel.querySelector("#auth-register-email")?.value || "";
			const password = panel.querySelector("#auth-register-password")?.value || "";
			const role = panel.querySelector("#auth-register-role")?.value || "student";
			try {
				// Register hiện chỉ tạo user. Sau đó user tự login để tạo auth state.
				const response = await postJson("/api/auth/register", { fullName, email, password, role });
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
