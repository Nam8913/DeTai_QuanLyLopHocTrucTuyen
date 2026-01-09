import { callHelloFuncFromBackend } from "./api/client.js";

const button = document.getElementById("call-backend");
const result = document.getElementById("result");

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