const API_BASE = "http://localhost:5194";

// Hiển thị thông báo cho user (status).
function setMessage(text, kind = "") {
	const el = document.getElementById("reset-message");
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
	const form = document.getElementById("reset-form");
	const emailEl = document.getElementById("reset-email");
	const newPassEl = document.getElementById("reset-new-password");
	const confirmEl = document.getElementById("reset-confirm-password");

	if (!(form instanceof HTMLFormElement)) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const email = (emailEl?.value || "").trim();
		const newPassword = newPassEl?.value || "";
		const confirmPassword = confirmEl?.value || "";

		// Validate basic input trước khi gọi backend
		if (!email) {
			setMessage("Vui lòng nhập email.", "error");
			return;
		}
		if (newPassword.length < 6) {
			setMessage("Mật khẩu phải có ít nhất 6 ký tự.", "error");
			return;
		}
		if (newPassword !== confirmPassword) {
			setMessage("Mật khẩu nhập lại không khớp.", "error");
			return;
		}

		setMessage("Đang đổi mật khẩu...", "info");
		try {
			// Demo endpoint (chưa có OTP/token).
			const res = await postJson("/api/auth/resetPassword", { email, newPassword });
			if (res.ok) {
				const data = await res.json().catch(() => null);
				setMessage(data?.message || "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.", "success");
				// Về trang chủ để đăng nhập lại.
				setTimeout(() => window.location.assign("index.html"), 700);
				return;
			}
			const data = await res.json().catch(() => null);
			setMessage(data?.message || `Đổi mật khẩu thất bại (HTTP ${res.status}).`, "error");
		} catch (err) {
			console.error(err);
			setMessage("Không gọi được backend.", "error");
		}
	});
}

init();
