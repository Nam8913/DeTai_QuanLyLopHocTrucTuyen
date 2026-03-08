const myInput = document.getElementById('myInput');
const button = document.getElementById('myButton');
const list = document.getElementById('ul_List');

button?.addEventListener('click', () => {
    // alert('Button was clicked!');

    //generateClass(myInput.value);
});

export function generateClass(nameClass, classID) {
    const createdAt = new Date(); 
    const createdAtIso = createdAt.toISOString(); 
    const createdAtText = createdAt.toLocaleString("vi-VN");

    const colorHex = stringToColorHex(nameClass);

    const card = document.createElement('li');
    card.className = 'color-card';

    const swatch = document.createElement('div');
    swatch.className = 'color-card__swatch';
    swatch.style.backgroundColor = colorHex;

    const meta = document.createElement('div');
    meta.className = 'color-card__meta';

    const nameEl = document.createElement('a');
    nameEl.className = 'color-card__name';
    nameEl.textContent = nameClass;
    nameEl.setAttribute("href", `class.html?classID=${classID}`);
    nameEl.style.cursor = "pointer";

    const hexEl = document.createElement('div');
    hexEl.className = 'color-card__hex';
    hexEl.textContent = colorHex.toUpperCase();
    hexEl.setAttribute("hidden", ""); // Ẩn phần hiển thị mã hex

    const classCodeID = document.createElement('div');
    classCodeID.className = 'color-card__hex';
    classCodeID.textContent = `#${classID}`;

    const timeEl = document.createElement('div');
    timeEl.className = 'color-card__hex';
    timeEl.textContent = `Tạo lúc: ${createdAtText}`;
    timeEl.dataset.createdAt = createdAtIso;


    meta.append(nameEl, hexEl, classCodeID, timeEl);
    card.append(swatch, meta);
    list?.append(card);
}

function stringToColorHex(str) {
    let hash = 0;
    const MOD = 16777216; // 2^24

    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % MOD;
    }

    let hex = hash.toString(16).padStart(6, '0');
    return '#' + hex;
}