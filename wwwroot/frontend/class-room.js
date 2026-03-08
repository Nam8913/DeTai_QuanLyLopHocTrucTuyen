const API_BASE = "http://localhost:5194";

async function loadClassDetail() {
    const params = new URLSearchParams(window.location.search);
    const classID = params.get("classID");

    if (!classID) {
        setMessage("Không tìm thấy mã lớp trong URL.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/classes/getDetail`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ClassCode: classID })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        if (!text) {
            throw new Error("Empty response from server");
        }

        

        const classData = await response.json();
        //renderClass(classID, classData);
        setMessage("");
        console.log("Dữ liệu lớp học tải từ server:", classData);
    } catch (error) {
        console.error("Lỗi khi tải thông tin lớp:", error);
        const fallbackData = getFallbackClassData(classID);
        renderClass(classID, fallbackData);
        setMessage("Không tải được dữ liệu từ server, đang hiển thị dữ liệu mẫu để bạn thiết kế giao diện.");
    }
}

function setMessage(text) {
    const messageEl = document.getElementById("class-message");
    if (messageEl) {
        messageEl.textContent = text || "";
    }
}

function renderClass(classID, classData) {
    const classNameEl = document.getElementById("class-name");
    const classCodeEl = document.getElementById("class-code");
    const extraInfoEl = document.getElementById("class-extra-info");
    const ownerInfoEl = document.getElementById("owner-info");
    const studentsListEl = document.getElementById("students-list");
    const sessionsListEl = document.getElementById("sessions-list");
    const copyInviteBtn = document.getElementById("copy-invite-code");

    const normalized = normalizeClassData(classID, classData);
    const ownerExtraInfo = loadOwnerExtraInfo(normalized.classID, normalized.extraInfo);
    normalized.extraInfo = ownerExtraInfo;

    if (classNameEl) {
        classNameEl.textContent = normalized.name;
    }

    if (classCodeEl) {
        classCodeEl.textContent = `Mã lớp: ${normalized.classCode}`;
    }

    if (extraInfoEl) {
        extraInfoEl.textContent = normalized.extraInfo || "Chưa có thông tin thêm.";
    }

    if (ownerInfoEl) {
        ownerInfoEl.replaceChildren(
            buildInfoItem("Tên chủ phòng", normalized.owner.fullName),
            buildInfoItem("Email", normalized.owner.email),
            buildInfoItem("Vai trò", normalized.owner.role),
            buildInfoItem("ID chủ phòng", normalized.owner.id)
        );
    }

    if (studentsListEl) {
        studentsListEl.replaceChildren();
        if (normalized.students.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "Chưa có học sinh tham gia.";
            studentsListEl.append(emptyItem);
        } else {
            normalized.students.forEach((student, index) => {
                const item = document.createElement("li");
                item.textContent = `${index + 1}. ${student.fullName} • ${student.email}`;
                studentsListEl.append(item);
            });
        }
    }

    if (sessionsListEl) {
        sessionsListEl.replaceChildren();
        if (normalized.sessions.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "Chưa có buổi học nào.";
            sessionsListEl.append(emptyItem);
        } else {
            normalized.sessions.forEach((session, index) => {
                const item = document.createElement("li");
                const title = document.createElement("div");
                title.className = "session-title";
                title.textContent = `${index + 1}. ${session.title}`;

                const time = document.createElement("div");
                time.className = "session-time";
                time.textContent = `Lịch học: ${session.startTime} - ${session.endTime}`;

                item.append(title, time);
                sessionsListEl.append(item);
            });
        }
    }

    if (copyInviteBtn instanceof HTMLButtonElement) {
        copyInviteBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(normalized.classCode);
                setMessage("Đã sao chép mã mời.");
            } catch {
                setMessage(`Mã mời: ${normalized.classCode}`);
            }
        };
    }

    wireOwnerEditor(normalized);
}

function normalizeClassData(classID, classData) {
    return {
        classID: classData.id || classData.classID || classID,
        classCode: classData.classCode || classData.inviteCode || classID,
        name: classData.name || "Phòng học chưa đặt tên",
        extraInfo: classData.extraInfo || classData.description || "",
        isCurrentUserOwner: Boolean(classData.isCurrentUserOwner ?? true),
        owner: {
            id: classData.owner?.id || classData.ownerId || "owner-001",
            fullName: classData.owner?.fullName || classData.owner?.name || "Chủ phòng",
            email: classData.owner?.email || "owner@example.com",
            role: classData.owner?.role || "Teacher"
        },
        students: Array.isArray(classData.students)
            ? classData.students.map((student) => ({
                fullName: student.fullName || student.name || "Học sinh",
                email: student.email || "-",
                joinCode: student.joinCode || classData.classCode || classID
            }))
            : [],
        sessions: Array.isArray(classData.sessions)
            ? classData.sessions.map((session) => ({
                title: session.title || session.name || "Buổi học",
                startTime: session.startTime || "--:--",
                endTime: session.endTime || "--:--"
            }))
            : []
    };
}

function wireOwnerEditor(data) {
    const ownerEditor = document.getElementById("owner-editor");
    const infoInput = document.getElementById("class-extra-info-input");
    const saveButton = document.getElementById("save-class-info");
    const infoDisplay = document.getElementById("class-extra-info");

    if (!(ownerEditor instanceof HTMLElement) || !(infoInput instanceof HTMLTextAreaElement)) {
        return;
    }

    if (!data.isCurrentUserOwner) {
        ownerEditor.hidden = true;
        return;
    }

    ownerEditor.hidden = false;
    infoInput.value = data.extraInfo;

    if (saveButton instanceof HTMLButtonElement && infoDisplay) {
        saveButton.onclick = () => {
            const newInfo = infoInput.value.trim();
            saveOwnerExtraInfo(data.classID, newInfo);
            infoDisplay.textContent = newInfo || "Chưa có thông tin thêm.";
            setMessage("Đã lưu thông tin thêm của phòng học.");
        };
    }
}

function buildInfoItem(label, value) {
    const item = document.createElement("div");
    item.className = "info-item";

    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.className = "subtle";

    const valueEl = document.createElement("strong");
    valueEl.textContent = value || "-";

    item.append(labelEl, valueEl);
    return item;
}

function ownerExtraInfoStorageKey(classID) {
    return `class-room-extra-info:${classID}`;
}

function loadOwnerExtraInfo(classID, fallbackValue = "") {
    const stored = localStorage.getItem(ownerExtraInfoStorageKey(classID));
    return stored ?? fallbackValue;
}

function saveOwnerExtraInfo(classID, value) {
    localStorage.setItem(ownerExtraInfoStorageKey(classID), value);
}

function getFallbackClassData(classID) {
    return {
        id: classID,
        classCode: classID,
        name: "Lớp học mẫu",
        extraInfo: "Lớp học trực tuyến dành cho thực hành theo tuần.",
        isCurrentUserOwner: true,
        owner: {
            id: "teacher-100",
            fullName: "Test Teacher",
            email: "teacher@example.com",
            role: "Teacher"
        },
        students: [
            { fullName: "Test Student 1", email: "student1@example.com", joinCode: classID },
            { fullName: "Test Student 2", email: "student2@example.com", joinCode: classID }
        ],
        sessions: [
            { title: "Buổi 1 - Giới thiệu", startTime: "19:00 10/03/2026", endTime: "20:30 10/03/2026" },
            { title: "Buổi 2 - Luyện tập", startTime: "19:00 12/03/2026", endTime: "20:30 12/03/2026" }
        ]
    };
}

loadClassDetail();