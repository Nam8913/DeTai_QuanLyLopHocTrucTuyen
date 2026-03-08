import { generateClass } from "./courses.js";
import { showToastSuccess } from "./utility/toast.js";
const API_BASE = "http://localhost:5194";

function initCreateClassWidget()
{
const panel = document.getElementById('create-class-panel');
const toggle = document.getElementById('create-class-toggle');

const nameOfNewClass = panel?.querySelector('#name-class-code');
const actionButton = panel?.querySelector('.create-class-toggle-action');

let messageEl = panel.querySelector("[data-create-class-message]");
if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.setAttribute("data-create-class-message", "");
    messageEl.setAttribute("role", "status");
    messageEl.setAttribute("aria-live", "polite");
    messageEl.style.marginBottom = "10px";
    panel.prepend(messageEl);
}

function setMessage(text) {
    messageEl.textContent = text || "";
}
toggle?.addEventListener('click', () => {
    // const event = new CustomEvent('myclassroom:toggle-join-class-panel');
    // window.dispatchEvent(event);
    if (panel.hidden) open();
		else close();
});

if (actionButton instanceof HTMLButtonElement) {
    actionButton?.addEventListener('click', async () => {

        const className = (nameOfNewClass?.value || "").trim();
        if (!className) {
            setMessage("Vui lòng nhập tên lớp.");
            return;
        }
        if (className) {
            try
            {
                const response = await fetch(`${API_BASE}/api/classes/create`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: className }),
                    }
                );
                if (!response.ok) {
                    setMessage("Có lỗi xảy ra khi tạo lớp.");
                    return;
                }
                const data = await response.json();
                // const classCode = data.classCode;
                console.log(data.classCode);
                //setMessage(`Lớp "${className}" đã được tạo thành công. Mã lớp: ${classCode}`);
                generateClass(className, data.classCode);
                showToastSuccess("Tạo lớp thành công", `Lớp "${className}" đã được tạo thành công.`);
            }catch(err)
            {
                setMessage("Có lỗi xảy ra khi tạo lớp.");
                console.error(err);
                return;
            }
            
            
        }
    });
}
function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
}

function close() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
}

    if(panel == null)
        return;
}
initCreateClassWidget();