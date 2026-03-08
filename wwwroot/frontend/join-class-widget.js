function initJoinClassWidget() {
	const toggle = document.getElementById("join-class-toggle");
	const panel = document.getElementById("join-class-panel");
	if (!toggle || !panel) return;

	const API_BASE = "http://localhost:5194";
	const AUTH_STORAGE_KEY = "myclassroom.auth";

	const codeInput = panel.querySelector("#join-class-code");
	const joinButton = panel.querySelector(".join-class-toggle-action");

	let messageEl = panel.querySelector("[data-join-class-message]");
	if (!messageEl) {
		messageEl = document.createElement("div");
		messageEl.setAttribute("data-join-class-message", "");
		messageEl.setAttribute("role", "status");
		messageEl.setAttribute("aria-live", "polite");
		messageEl.style.marginBottom = "10px";
		panel.prepend(messageEl);
	}

	function setMessage(text) {
		messageEl.textContent = text || "";
	}

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

	async function postJson(path, body) {
		const response = await fetch(`${API_BASE}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		return response;
	}

	function open() {
		setMessage("");
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

	if (joinButton instanceof HTMLButtonElement) {
		joinButton.addEventListener("click", async () => {
			setMessage("");

			const classCode = (codeInput?.value || "").trim();
			if (!classCode) {
				setMessage("Vui lòng nhập mã lớp.");
				return;
			}

			const email = (getAuthState()?.email || "").trim();
			if (!email) {
				setMessage("Bạn cần đăng nhập để tham gia lớp.");
				return;
			}

			setMessage("Đang kiểm tra mã lớp...");
			try {
				const res = await postJson("/api/classes/join", { email, classCode });
				if (res.ok) {
					const data = await res.json().catch(() => null);
					setMessage(data?.message || "Tham gia lớp thành công.");
					return;
				}
				const data = await res.json().catch(() => null);
				setMessage(data?.message || `Tham gia lớp thất bại (HTTP ${res.status}).`);
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

	close();
}

initJoinClassWidget();

