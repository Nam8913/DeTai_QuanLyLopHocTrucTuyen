const toastInputTitleForNotifyButton = document.getElementById('toastInputTitleForNotifyButton');
const toastInputContentForNotifyButton = document.getElementById('toastInputContentForNotifyButton');
const notifyButton = document.getElementById('notifyButton');
const colorSelect = document.getElementById('color');

const toastHost = document.getElementById('toastHost') ?? createToastHost();
const toastTimers = new WeakMap();

notifyButton?.addEventListener('click', () => {
    const rawTitle = toastInputTitleForNotifyButton?.value ?? '';
    let title = rawTitle.trim();

    const content = (toastInputContentForNotifyButton?.value ?? '').trim();
    const message = content.length ? `Toast content: ${content}` : 'Bạn vừa bấm nút thông báo.';

    const accent = getSelectedToastAccent();

    // Input text thường trả về string (không phải null). Muốn check null/undefined hoặc trống => trim() rồi kiểm tra.
    if (!title) {
        title = getDefaultToastTitleByColor(colorSelect?.value);
    }
    showToast({
        name: 'Thông báo',
        title: `${title}`,
        message,
        durationMs: 4000,
		accentColor: accent,
    });
});

function createToastHost() {
    const host = document.createElement('div');
    host.id = 'toastHost';
    host.className = 'toast-host';
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
    return host;
}

function showToast({ name, title, message, durationMs, accentColor }) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
	if (accentColor) toast.style.setProperty('--toast-accent', accentColor);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Đóng');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissToast(toast);
    });

    const content = document.createElement('div');
    content.className = 'toast__content';

    const nameEl = document.createElement('p');
    nameEl.className = 'toast__name';
    nameEl.textContent = name;

    const titleEl = document.createElement('p');
    titleEl.className = 'toast__title';
    titleEl.textContent = title;

    const messageEl = document.createElement('p');
    messageEl.className = 'toast__message';
    messageEl.textContent = message;

    const progressTrack = document.createElement('div');
    progressTrack.className = 'toast__progressTrack';

    const progressBar = document.createElement('div');
    progressBar.className = 'toast__progressBar';
    progressBar.style.animationDuration = `${durationMs}ms`;
    progressTrack.append(progressBar);

	content.append(nameEl, titleEl, messageEl);
	toast.append(closeBtn, content, progressTrack);

    // Toast mới luôn lên đầu; toast cũ tự bị đẩy xuống
    toastHost.prepend(toast);
    requestAnimationFrame(() => toast.classList.add('toast--in'));

    // // Nếu người dùng bấm vào toast khi chưa hết thời gian:
    // // tạo toast mới đưa lên đầu (toast hiện tại tự bị đẩy xuống vì có toast mới).
    // toast.addEventListener('click', () => {
    //     const accent = getSelectedToastAccent();
    //     showToast({
    //         name: 'Thông báo',
    //         title: `${title}`,
    //         message: 'Bạn vừa bấm vào một thông báo.',
    //         durationMs,
	// 		accentColor: accent,
    //     });
    // });

	const timer = window.setTimeout(() => dismissToast(toast), durationMs);
	toastTimers.set(toast, timer);
    toast.addEventListener(
        'transitionend',
        (e) => {
            if (toast.classList.contains('toast--out') && e.propertyName === 'transform') {
				const existing = toastTimers.get(toast);
				if (existing != null) toastTimers.delete(toast);
                toast.remove();
            }
        },
        { once: false }
    );
}

function dismissToast(toast) {
	if (toast.classList.contains('toast--out')) return;
	const timer = toastTimers.get(toast);
	if (timer != null) {
		window.clearTimeout(timer);
		toastTimers.delete(toast);
	}
    toast.classList.remove('toast--in');
    toast.classList.add('toast--out');
}

function getSelectedToastAccent() {
    const value = colorSelect?.value;
    // Dùng tone đậm hơn để dễ nhìn trên nền trắng
    if (value === 'error') return '#d32f2f';
    if (value === 'notify') return '#1976d2';
    if (value === 'warning') return '#ffea00';
    if (value === 'message') return '#9e9e9e';
    if (value === 'success') return '#388e3c';
    return value || '';
}

function getDefaultToastTitleByColor(colorValue) {
    if (colorValue === 'error') return 'Error';
    if (colorValue === 'notify') return 'Information';
    if (colorValue === 'warning') return 'Warning';
    if (colorValue === 'message') return 'Message';
    if (colorValue === 'success') return 'Success';
    return 'message';
}

export function showToastCustom({ name, title, message, durationMs, accentColor }) {
    showToast({ name, title, message, durationMs, accentColor });
}

export function showToastError(title, message, durationMs = 4000) {
    showToast({
        name: 'Lỗi',
        title,
        message,
        durationMs,
        accentColor: '#d32f2f',
    });
}

export function showToastWarning(title, message, durationMs = 4000) {
    showToast({
        name: 'Cảnh báo',
        title,
        message,
        durationMs,
        accentColor: '#ffea00',
    });
}

export function showToastSuccess(title, message, durationMs = 4000) {
    showToast({
        name: 'Thành công',
        title,
        message,
        durationMs,
        accentColor: '#388e3c',
    });
}

export function showToastMessage(title, message, durationMs = 4000) {
    showToast({
        name: 'Thông báo',
        title,
        message,
        durationMs,
        accentColor: '#9e9e9e',
    });
}

export function showToastNotify(title, message, durationMs = 4000) {
    showToast({
        name: 'Thông tin',
        title,
        message,
        durationMs,
        accentColor: '#1976d2',
    });
}