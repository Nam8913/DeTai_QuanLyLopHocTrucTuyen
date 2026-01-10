import { callHelloFuncFromBackend } from "./api/client.js";

// main.js = “glue code” chạy trên hầu hết các trang.
// Nhiệm vụ chính:
// 1) Đọc trạng thái đăng nhập từ localStorage
// 2) Render thanh tab theo role (khách / học sinh / giáo viên)
// 3) Guard các trang cần đăng nhập
// 4) Hydrate dữ liệu lên UI (profile)
// 5) Lắng nghe sự kiện auth thay đổi để cập nhật UI ngay lập tức

const AUTH_STORAGE_KEY = "myclassroom.auth";

// Đọc thông tin đăng nhập đã lưu trên trình duyệt.
// Format (ví dụ): { email, fullName, role, loggedInAt }
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

// Người dùng được coi là “đã đăng nhập” nếu có email trong auth state.
function isLoggedIn() {
	return Boolean(getAuthState()?.email);
}

// Role dùng để quyết định tab nào được hiển thị.
// Mặc định: student
function getRole() {
	const role = getAuthState()?.role;
	return typeof role === "string" && role ? role : "student";
}

// Chặn truy cập các trang “private” (ví dụ courses.html) nếu chưa đăng nhập.
// (Đây là guard ở client. Backend vẫn nên có auth thật nếu triển khai production.)
function guardProtectedPages() {
	const page = (window.location.pathname.split("/").pop() || "").toLowerCase();
	if (page === "courses.html" && !isLoggedIn()) {
		window.location.replace("index.html");
	}
}

// Render tabs động dựa theo trạng thái đăng nhập và role.
// - Khách: Trang chủ
// - Học sinh: Trang chủ + Lớp học
// - Giáo viên: Trang chủ + Dạy lớp
function renderTabs() {
	const tabLists = Array.from(document.querySelectorAll("ul.tabs"));
	if (tabLists.length === 0) return;

	const page = window.location.pathname.split("/").pop() || "index.html";
	const authed = isLoggedIn();
	const role = getRole();

	const items = [{ href: "index.html", label: "Trang chủ" }];
	if (authed) {
		items.push({
			href: "courses.html",
			label: role === "teacher" ? "Dạy lớp" : "Lớp học",
		});
	}

	for (const ul of tabLists) {
		ul.innerHTML = "";
		for (const item of items) {
			const li = document.createElement("li");
			const a = document.createElement("a");
			a.href = item.href;
			a.textContent = item.label;
			if (page.toLowerCase() === item.href.toLowerCase()) {
				a.setAttribute("aria-current", "page");
			}
			li.appendChild(a);
			ul.appendChild(li);
		}
	}
}

// Nếu trang hiện tại là profile (có các element đặc trưng), bắt buộc phải đăng nhập.
function guardProfilePage() {
	const emailEl = document.getElementById("profileEmail");
	const fullNameEl = document.getElementById("profileFullName");
	const sidebarNameEl = document.getElementById("profileSidebarName");
	const isProfilePage = Boolean(emailEl || fullNameEl || sidebarNameEl);
	if (!isProfilePage) return;

	if (!isLoggedIn()) {
		window.location.replace("index.html");
	}
}

// Link “Thoát” ở sidebar: xóa auth state và quay về trang chủ.
function initLogoutLink() {
	const logoutLink = document.getElementById("logout-link");
	if (!(logoutLink instanceof HTMLAnchorElement)) return;

	logoutLink.addEventListener("click", (e) => {
		e.preventDefault();
		try {
			localStorage.removeItem(AUTH_STORAGE_KEY);
		} catch {
			// ignore
		}
		try {
			window.dispatchEvent(new CustomEvent("myclassroom:auth-changed"));
		} catch {
			// ignore
		}
		window.location.href = logoutLink.getAttribute("href") || "index.html";
	});
}

// Nếu là trang profile, đổ dữ liệu từ auth state ra giao diện.
// Lưu ý: profile hiện không gọi backend để load user, chỉ dùng localStorage.
function hydrateProfileFromAuth() {
	const emailEl = document.getElementById("profileEmail");
	const fullNameEl = document.getElementById("profileFullName");
	const sidebarNameEl = document.getElementById("profileSidebarName");
	const roleEl = document.getElementById("profileRole");
	if (!emailEl && !fullNameEl && !sidebarNameEl) return;

	try {
		const state = getAuthState();
		const email = typeof state?.email === "string" ? state.email : "";
		const fullName = typeof state?.fullName === "string" ? state.fullName : "";
		const role = typeof state?.role === "string" ? state.role : "student";
		const displayName = (fullName || email).trim();
		if (emailEl && email) emailEl.textContent = email;
		if (fullNameEl) fullNameEl.textContent = displayName;
		if (sidebarNameEl) sidebarNameEl.textContent = displayName.toUpperCase();
		if (roleEl) roleEl.textContent = role === "teacher" ? "Giáo viên" : "Học sinh";
	} catch {
		// ignore
	}
}

const button = document.getElementById("call-backend");
const result = document.getElementById("result");

// Demo/test: gọi backend /api/hello ở trang chủ.
if (button && result) {
	button.addEventListener("click", async () => {
		result.textContent = "Đang gọi backend...";

		try {
			const message = await callHelloFuncFromBackend();
			result.textContent = message;
		} catch (err) {
			result.textContent = "Gọi backend thất bại. Xem console.";
			console.error(err);
		}
	});
}

// Khi load trang, chạy các hook phù hợp (tùy trang có element nào).
hydrateProfileFromAuth();
initLogoutLink();
guardProfilePage();
guardProtectedPages();
renderTabs();

// Auth widget sẽ bắn event này sau khi login/logout.
// => UI (tabs/profile/guards) được cập nhật ngay, không cần refresh.
window.addEventListener("myclassroom:auth-changed", () => {
	hydrateProfileFromAuth();
	guardProfilePage();
	guardProtectedPages();
	renderTabs();
});