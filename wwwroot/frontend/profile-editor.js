const API_BASE = "http://localhost:5194";
const AUTH_STORAGE_KEY = "myclassroom.auth";

// Đọc auth state đã lưu (email/fullName/role...).
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

// Trang editor bắt buộc phải login.
// Nếu chưa login => đẩy về trang chủ.
function requireLogin() {
	const state = getAuthState();
	if (!state?.email) {
		window.location.replace("index.html");
		return null;
	}
	return state;
}

// Hiển thị thông báo cho user (status).
function setMessage(text, kind = "info") {
	const el = document.getElementById("editor-message");
	if (!el) return;
	el.textContent = text || "";
	el.dataset.kind = kind;
}

// Helper gọi API JSON.
async function postJson(path, body) {
	const response = await fetch(`${API_BASE}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return response;
}

function init() {
	// 1) Check login
	const state = requireLogin();
	if (!state) return;

	const emailInput = document.getElementById("edit-email");
	const fullNameInput = document.getElementById("edit-fullName");
	const roleSelect = document.getElementById("edit-role");
	const form = document.getElementById("profile-editor-form");

	// 2) Hydrate giá trị hiện tại từ localStorage lên form
	if (emailInput) emailInput.value = state.email || "";
	if (fullNameInput) fullNameInput.value = state.fullName || "";
	if (roleSelect) roleSelect.value = state.role || "student";

	if (form instanceof HTMLFormElement) {
		form.addEventListener("submit", async (e) => {
			e.preventDefault();

			const fullName = (fullNameInput?.value || "").trim();
			const role = roleSelect?.value || "student";

			setMessage("Đang lưu...", "info");

			// 3) Update localStorage ngay để UI cập nhật liền
			const nextState = {
				...state,
				fullName,
				role,
				updatedAt: Date.now(),
			};
			try {
				localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
				window.dispatchEvent(new CustomEvent("myclassroom:auth-changed"));
			} catch {
				// ignore
			}

			// 4) Best-effort: gọi backend để update dữ liệu server (demo)
			// (Nếu backend lỗi vẫn giữ localStorage để bạn thấy UI đổi.)
			try {
				const res = await postJson("/api/users/updateProfile", {
					email: state.email,
					fullName,
					role,
				});
				if (res.ok) {
					const data = await res.json().catch(() => null);
					setMessage(data?.message || "Cập nhật thành công.", "success");
					// 5) Quay về trang profile
					setTimeout(() => window.location.assign("profileUser.html"), 400);
					return;
				}
				const data = await res.json().catch(() => null);
				setMessage(data?.message || `Cập nhật thất bại (HTTP ${res.status}).`, "error");
			} catch (err) {
				console.error(err);
				setMessage("Không gọi được backend (đã lưu tạm trên trình duyệt).", "warn");
			}
		});
	}
}

init();
