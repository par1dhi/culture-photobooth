const camera = document.querySelector("#camera");
const photoButton = document.querySelector("#photoButton");
const counter = document.querySelector("#counter");
const countdown = document.querySelector("#countdown");
const preview = document.querySelector("#preview");
const downloadButton = document.querySelector("#downloadButton");
const retakeButton = document.querySelector("#retakeButton");
const templateChoice = document.querySelector("#templateChoice");

const photos = [];

let capturing = false;
let finalPhoto = null;


// =========================
// LOAD IMAGES (warns in console if a file is missing)
// =========================

function loadImage(src) {
    const img = new Image();
    img.onerror = function () {
        console.warn("Could not load image: " + src + " (check the filename and its capitalization)");
    };
    img.src = src;
    return img;
}

function isReady(img) {
    return img.complete && img.naturalWidth > 0;
}


// =========================
// SPAIN STICKERS
// =========================

const fanSticker = loadImage("assets/fan.png");
const iloveSpainSticker = loadImage("assets/ilovesp.png");
const iloveEspanaSticker = loadImage("assets/iloveesp.png");
const stampSticker = loadImage("assets/stamp.png");


// =========================
// START CAMERA
// =========================

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        camera.srcObject = stream;
    } catch (error) {
        console.error(error);
        alert("Please allow camera access to use the photobooth!");
    }
}


// =========================
// HELPERS
// =========================

function delay(milliseconds) {
    return new Promise(function (resolve) {
        setTimeout(resolve, milliseconds);
    });
}

// Draws an image into a box, cropping the edges instead of stretching it
function drawCover(ctx, img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}


// =========================
// COUNTDOWN
// =========================

async function startCountdown() {
    for (let number = 3; number > 0; number--) {
        countdown.textContent = number;
        await delay(1000);
    }
    countdown.textContent = "";
}


// =========================
// TAKE ONE PHOTO (mirrored to match the live preview)
// =========================

function takePhoto() {
    const picture = document.createElement("canvas");
    picture.width = camera.videoWidth;
    picture.height = camera.videoHeight;

    const context = picture.getContext("2d");
    context.translate(picture.width, 0);
    context.scale(-1, 1);
    context.drawImage(camera, 0, 0, picture.width, picture.height);

    return picture;
}


// =========================
// SHOW PHOTOS + DECORATIONS
// =========================

function updatePreview() {
    if (!finalPhoto) {
        finalPhoto = document.createElement("canvas");
    }

    const selectedLayout = templateChoice ? templateChoice.value : "strip";

    if (selectedLayout === "strip") {
        renderClassicStrip();
    } else if (selectedLayout === "scrapbook") {
        renderScrapbookTemplate();
    }

    preview.innerHTML = "";
    preview.appendChild(finalPhoto);
}


// =========================
// RENDER CLASSIC STRIP
// =========================

function renderClassicStrip() {
    // Every photo is drawn at a fixed 4:3 size so the strip stays a sensible size
    const photoWidth = 600;
    const photoHeight = 450;

    const gap = 70;
    const border = 70;
    const topSpace = 170;
    const bottomSpace = 210;

    finalPhoto.width = photoWidth + (border * 2);
    finalPhoto.height =
        topSpace +
        (photoHeight * photos.length) +
        (gap * (photos.length - 1)) +
        bottomSpace;

    const context = finalPhoto.getContext("2d");

    // COLORS
    const cream = "#fff7ea";
    const red = "#a82222";
    const gold = "#d6a53a";
    const darkRed = "#731515";

    // BACKGROUND
    context.fillStyle = cream;
    context.fillRect(0, 0, finalPhoto.width, finalPhoto.height);

    // SIDE DOTS
    context.fillStyle = "#d95a5a";
    for (let y = 20; y < finalPhoto.height; y += 28) {
        context.beginPath();
        context.arc(22, y, 3, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.arc(finalPhoto.width - 22, y, 3, 0, Math.PI * 2);
        context.fill();
    }

    // DRAW PHOTOS
    photos.forEach(function (picture, index) {
        const y = topSpace + index * (photoHeight + gap);

        drawCover(context, picture, border, y, photoWidth, photoHeight);

        // PHOTO BORDER
        context.strokeStyle = red;
        context.lineWidth = 4;
        context.strokeRect(border, y, photoWidth, photoHeight);
    });

    // TOP FAN
    if (isReady(fanSticker)) {
        const fanWidth = 120;
        const fanHeight = fanSticker.naturalHeight / fanSticker.naturalWidth * fanWidth;
        context.drawImage(fanSticker, 20, 20, fanWidth, fanHeight);
    }

    // TOP I LOVE ESPAÑA
    if (isReady(iloveSpainSticker)) {
        const stickerWidth = 300;
        const stickerHeight = iloveSpainSticker.naturalHeight / iloveSpainSticker.naturalWidth * stickerWidth;
        context.drawImage(iloveSpainSticker, (finalPhoto.width - stickerWidth) / 2, 20, stickerWidth, stickerHeight);
    }

    // BETWEEN PHOTOS
    for (let index = 0; index < photos.length - 1; index++) {
        const y = topSpace + (index + 1) * photoHeight + index * gap + gap / 2;

        context.fillStyle = gold;
        context.beginPath();
        context.arc(finalPhoto.width / 2 - 45, y, 4, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.arc(finalPhoto.width / 2 + 45, y, 4, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = darkRed;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(finalPhoto.width / 2 - 30, y);
        context.lineTo(finalPhoto.width / 2 + 30, y);
        context.stroke();
    }

    // BOTTOM I LOVE ESPAÑA
    if (isReady(iloveEspanaSticker)) {
        const stickerWidth = 260;
        const stickerHeight = iloveEspanaSticker.naturalHeight / iloveEspanaSticker.naturalWidth * stickerWidth;
        context.drawImage(
            iloveEspanaSticker,
            (finalPhoto.width - stickerWidth) / 2,
            finalPhoto.height - bottomSpace + 15,
            stickerWidth,
            stickerHeight
        );
    }

    // BOTTOM GOLD DOTS
    context.fillStyle = gold;
    for (let x = 80; x < finalPhoto.width - 80; x += 30) {
        context.beginPath();
        context.arc(x, finalPhoto.height - 18, 2.5, 0, Math.PI * 2);
        context.fill();
    }

    // OUTER BORDER
    context.strokeStyle = darkRed;
    context.lineWidth = 6;
    context.strokeRect(3, 3, finalPhoto.width - 6, finalPhoto.height - 6);

    // INNER BORDER
    context.strokeStyle = gold;
    context.lineWidth = 2;
    context.strokeRect(12, 12, finalPhoto.width - 24, finalPhoto.height - 24);
}


// =========================
// RENDER SCRAPBOOK TEMPLATE
// =========================

const SCRAP_FONT = '"Pacifico", "Brush Script MT", cursive';

// Re-render once the handwriting font has loaded, so the first result isn't in a fallback font
if (document.fonts) {
    document.fonts.load("40px Pacifico").then(function () {
        if (finalPhoto && photos.length > 0 && !capturing) {
            updatePreview();
        }
    });
}


// ---------- one azulejo (Spanish ceramic tile), drawn in code ----------

function drawAzulejo(ctx, x, y, s) {
    const blue = "#1f4e8c";
    const gold = "#f2b632";
    const terra = "#c4452d";
    const white = "#fffaf0";

    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    ctx.rect(0, 0, s, s);
    ctx.clip();

    ctx.fillStyle = white;
    ctx.fillRect(0, 0, s, s);

    // corner "petals"
    const corners = [[0, 0], [s, 0], [0, s], [s, s]];
    ctx.fillStyle = blue;
    corners.forEach(function (c) {
        ctx.beginPath();
        ctx.arc(c[0], c[1], s * 0.34, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = white;
    corners.forEach(function (c) {
        ctx.beginPath();
        ctx.arc(c[0], c[1], s * 0.2, 0, Math.PI * 2);
        ctx.fill();
    });

    // centre flower
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = terra;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // thin tile edge
    ctx.strokeStyle = blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);

    ctx.restore();
}

function drawTileBorder(ctx, width, height, s) {
    for (let x = 0; x < width; x += s) {
        drawAzulejo(ctx, x, 0, s);
        drawAzulejo(ctx, x, height - s, s);
    }
    for (let y = s; y < height - s; y += s) {
        drawAzulejo(ctx, 0, y, s);
        drawAzulejo(ctx, width - s, y, s);
    }
}


// ---------- bunting (little flags on a string) ----------

function drawBunting(ctx, x1, x2, y, count) {
    const colors = ["#c4452d", "#f2b632", "#f4a6a0", "#1f4e8c"];
    const step = (x2 - x1) / count;

    function sag(x) {
        const t = (x - x1) / (x2 - x1);
        return y + Math.sin(t * Math.PI) * 28;
    }

    // string
    ctx.strokeStyle = "#492b2a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, sag(x1));
    for (let x = x1; x <= x2; x += 5) {
        ctx.lineTo(x, sag(x));
    }
    ctx.stroke();

    // flags
    for (let i = 0; i < count; i++) {
        const left = x1 + i * step + 6;
        const right = x1 + (i + 1) * step - 6;
        const mid = (left + right) / 2;

        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(left, sag(left));
        ctx.lineTo(right, sag(right));
        ctx.lineTo(mid, sag(mid) + 62);
        ctx.closePath();
        ctx.fill();
    }
}


// ---------- one polaroid ----------

function drawPolaroid(ctx, picture, centerX, top, angle, caption, tapeColor) {
    const photoW = 360;
    const photoH = 270;
    const pad = 18;
    const bottom = 64;
    const w = photoW + pad * 2;
    const h = photoH + pad + bottom;

    ctx.save();
    ctx.translate(centerX, top + h / 2);
    ctx.rotate(angle);

    // paper with soft shadow
    ctx.shadowColor = "rgba(73, 43, 42, 0.30)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#fffdf6";
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // photo
    drawCover(ctx, picture, -w / 2 + pad, -h / 2 + pad, photoW, photoH);
    ctx.strokeStyle = "rgba(73, 43, 42, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 + pad, -h / 2 + pad, photoW, photoH);

    // handwritten caption
    ctx.fillStyle = "#c4452d";
    ctx.textAlign = "center";
    ctx.font = "26px " + SCRAP_FONT;
    ctx.fillText(caption, 0, h / 2 - 22, w - 30);

    // tape
    ctx.fillStyle = tapeColor;
    ctx.save();
    ctx.translate(0, -h / 2 + 2);
    ctx.rotate(-0.06);
    ctx.fillRect(-55, -13, 110, 28);
    ctx.restore();

    ctx.restore();
}


// ---------- the full scrapbook ----------

function renderScrapbookTemplate() {
    finalPhoto.width = 1000;
    finalPhoto.height = 1500;

    const context = finalPhoto.getContext("2d");

    const cream = "#fff4df";
    const terra = "#c4452d";
    const blue = "#1f4e8c";
    const gold = "#f2b632";
    const ink = "#492b2a";
    const tapePink = "rgba(244, 166, 160, 0.85)";
    const tapeGold = "rgba(242, 182, 50, 0.85)";

    // BACKGROUND
    context.fillStyle = cream;
    context.fillRect(0, 0, 1000, 1500);

    // soft dots on the paper
    context.fillStyle = "rgba(196, 69, 45, 0.10)";
    for (let i = 0; i < 60; i++) {
        const x = 70 + (i * 137) % 860;
        const y = 70 + (i * 193) % 1360;
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
    }

    // AZULEJO TILE BORDER
    drawTileBorder(context, 1000, 1500, 50);

    // BUNTING
    drawBunting(context, 60, 940, 62, 11);

    // TITLE (blue shadow + terracotta text = retro postcard look)
    context.textAlign = "center";
    context.font = "100px " + SCRAP_FONT;
    context.fillStyle = blue;
    context.fillText("¡Hola España!", 505, 305, 800);
    context.fillStyle = terra;
    context.fillText("¡Hola España!", 500, 300, 800);

    context.fillStyle = ink;
    context.font = "italic 28px Georgia, serif";
    context.fillText("~ recuerdos de verano ~", 500, 352);

    // POLAROIDS (2 x 2)
    const captions = ["¡Olé!", "Qué bonito", "Sol y sangría", "Hasta pronto ♡"];
    const tapes = [tapePink, tapeGold, tapeGold, tapePink];
    const angles = [-0.05, 0.04, 0.035, -0.04];
    const centersX = [275, 725, 275, 725];
    const tops = [405, 425, 800, 785];

    photos.forEach(function (picture, index) {
        drawPolaroid(
            context,
            picture,
            centersX[index],
            tops[index],
            angles[index],
            captions[index],
            tapes[index]
        );
    });

    // FLAMENCO-DRESS BAND (polka dots + ruffle edge)
    const bandTop = 1235;
    const bandBottom = 1450;

    context.fillStyle = terra;
    for (let x = 50; x < 950; x += 44) {
        context.beginPath();
        context.arc(x + 22, bandTop, 24, 0, Math.PI * 2);
        context.fill();
    }
    context.fillRect(50, bandTop, 900, bandBottom - bandTop);

    context.fillStyle = "#fffaf0";
    for (let row = 0; row < 5; row++) {
        const y = bandTop + 22 + row * 42;
        for (let x = 75 + (row % 2) * 25; x < 940; x += 50) {
            context.beginPath();
            context.arc(x, y, 7, 0, Math.PI * 2);
            context.fill();
        }
    }

    // ribbon with sign-off
    context.fillStyle = cream;
    context.fillRect(170, 1290, 660, 100);
    context.strokeStyle = gold;
    context.lineWidth = 5;
    context.strokeRect(170, 1290, 660, 100);

    context.fillStyle = terra;
    context.font = "50px " + SCRAP_FONT;
    context.fillText("con cariño, España", 500, 1357, 600);

    // date, in Spanish format
    const today = new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    context.fillStyle = cream;
    context.font = "italic 26px Georgia, serif";
    context.fillText(today, 500, 1428);

    // EMOJI STICKERS in the gaps between photos
    context.font = "64px serif";
    context.fillText("🌹", 500, 440);
    context.fillText("🍊", 505, 790);
    context.fillText("💃", 500, 1170);

    // IMAGE STICKERS (only drawn if the files loaded)
    if (isReady(fanSticker)) {
        const w = 120;
        const h = fanSticker.naturalHeight / fanSticker.naturalWidth * w;
        context.save();
        context.translate(95, 440);
        context.rotate(-0.25);
        context.drawImage(fanSticker, -w / 2, -h / 2, w, h);
        context.restore();
    }

    if (isReady(stampSticker)) {
        const w = 150;
        const h = stampSticker.naturalHeight / stampSticker.naturalWidth * w;
        context.save();
        context.translate(870, 1135);
        context.rotate(0.15);
        context.drawImage(stampSticker, -w / 2, -h / 2, w, h);
        context.restore();
    }

    if (isReady(iloveEspanaSticker)) {
        const w = 150;
        const h = iloveEspanaSticker.naturalHeight / iloveEspanaSticker.naturalWidth * w;
        context.drawImage(iloveEspanaSticker, 70, 1135, w, h);
    }
}


// =========================
// SWITCH LAYOUT AFTER PHOTOS ARE TAKEN
// =========================

if (templateChoice) {
    templateChoice.addEventListener("change", function () {
        if (photos.length === 4 && !capturing) {
            updatePreview();
        }
    });
}


// =========================
// TAKE FOUR PHOTOS
// =========================

photoButton.addEventListener("click", async function () {
    if (!camera.srcObject) {
        alert("Camera hasn't started yet!");
        return;
    }

    if (capturing) {
        return;
    }

    capturing = true;
    photos.length = 0;
    finalPhoto = null;

    counter.textContent = "Photos: 0 / 4";
    preview.innerHTML = "";
    downloadButton.style.display = "none";
    retakeButton.style.display = "none";

    for (let number = 0; number < 4; number++) {
        await startCountdown();

        const picture = takePhoto();
        photos.push(picture);

        counter.textContent = `Photos: ${photos.length} / 4`;
        updatePreview();

        if (number < 3) {
            await delay(1000);
        }
    }

    downloadButton.style.display = "inline-block";
    retakeButton.style.display = "inline-block";
    capturing = false;
});


// =========================
// DOWNLOAD
// =========================

downloadButton.addEventListener("click", function () {
    if (!finalPhoto) {
        return;
    }

    const layout = templateChoice ? templateChoice.value : "strip";

    const link = document.createElement("a");
    link.download = `spain-${layout}.png`;
    link.href = finalPhoto.toDataURL("image/png");
    link.click();
});


// =========================
// RETAKE
// =========================

retakeButton.addEventListener("click", function () {
    photos.length = 0;
    finalPhoto = null;

    counter.textContent = "Photos: 0 / 4";
    preview.innerHTML = "";

    downloadButton.style.display = "none";
    retakeButton.style.display = "none";
});

startCamera();