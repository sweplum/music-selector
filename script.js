document.addEventListener("DOMContentLoaded", () => {

    let items = [];
    let history = [];
    let spinning = false;
    let currentRotation = 0;

    const wheelCanvas = document.getElementById("wheelCanvas");
    const ctx = wheelCanvas.getContext("2d");
    const spinSound = document.getElementById("spinSound");
    const dingSound = document.getElementById("dingSound");

    /* LOAD SAVED ITEMS + HISTORY */
    const savedItems = localStorage.getItem("music_items");
    if (savedItems) {
        try {
            items = JSON.parse(savedItems);
            drawWheel();
        } catch {}
    }

    const savedHistory = localStorage.getItem("music_history");
    if (savedHistory) {
        try {
            history = JSON.parse(savedHistory);
            renderHistory();
        } catch {}
    }

    /* AUTO-LOAD CSV WHEN BROWSED */
    document.getElementById("csvInput").onchange = () => {
        const file = document.getElementById("csvInput").files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: false,
            complete: function(results) {
                items = results.data.filter(row => row.Title);
                saveItems();
                drawWheel();
                alert("CSV Loaded Successfully");
            }
        });
    };

    /* SPIN BUTTON – RAFFLE WHEEL STYLE */
    document.getElementById("startBtn").onclick = () => {
        if (items.length === 0) return alert("No items loaded");
        if (spinning) return;

        spinning = true;

        const removeAfter = document.getElementById("removeAfter").checked;
        const count = items.length;
        const sliceAngleDeg = 360 / count;

        // choose target index
        const targetIndex = Math.floor(Math.random() * count);

        // pointer at -90deg (top). slice i center at -90 + i*sliceAngleDeg
        // we want center of target slice at pointer after rotation R:
        // (-90 + targetIndex*sliceAngleDeg) + R ≡ -90  => R ≡ -targetIndex*sliceAngleDeg
        const spins = 5;
        const finalRotation = 360 * spins - targetIndex * sliceAngleDeg;

        const speedFactor = document.getElementById("speedSlider").value; // 1–5
        const duration = 4000 - (speedFactor - 1) * 500; // ms

        // equalizer on
        document.getElementById("equalizer").style.display = "flex";

        // spin sound
        spinSound.currentTime = 0;
        spinSound.loop = true;
        spinSound.play();

        wheelCanvas.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`;
        wheelCanvas.style.transform = `rotate(${finalRotation}deg)`;

        setTimeout(() => {
            // stop spin sound
            spinSound.pause();
            spinSound.currentTime = 0;

            document.getElementById("equalizer").style.display = "none";

            const finalItem = items[targetIndex];
            updateDisplay(finalItem, true);

            dingSound.currentTime = 0;
            dingSound.play();

            burstParticles();

            history.push(finalItem);
            saveHistory();
            renderHistory();

            if (removeAfter) {
                items.splice(targetIndex, 1);
                saveItems();
                drawWheel();
            }

            // normalize rotation so it doesn't grow forever
            currentRotation = finalRotation % 360;
            wheelCanvas.style.transition = "none";
            wheelCanvas.style.transform = `rotate(${currentRotation}deg)`;

            // allow next spin after a tiny delay
            setTimeout(() => {
                spinning = false;
            }, 100);
        }, duration);
    };

    /* DRAW WHEEL ON CANVAS */
    function drawWheel() {
        const w = wheelCanvas.width;
        const h = wheelCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) - 10;

        ctx.clearRect(0, 0, w, h);

        if (items.length === 0) {
            // draw placeholder circle
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 4;
            ctx.stroke();
            return;
        }

        const count = items.length;
        const sliceAngle = (2 * Math.PI) / count;
        const colors = ["#00aaff", "#0044ff", "#00ddff", "#0088ff"];

        for (let i = 0; i < count; i++) {
            const startAngle = -Math.PI / 2 + i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // slice
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // slice border
            ctx.strokeStyle = "rgba(0,0,0,0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // text
            const midAngle = startAngle + sliceAngle / 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(midAngle);
            ctx.textAlign = "right";
            ctx.fillStyle = "#000";
            ctx.font = "14px Poppins";
            const text = items[i].Title || "";
            ctx.fillText(text, radius - 10, 5);
            ctx.restore();
        }

        // outer glow ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,170,255,0.8)";
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    /* UPDATE DISPLAY */
    function updateDisplay(item, final) {
        document.getElementById("currentTitle").textContent = item.Title || "";
        document.getElementById("description").textContent = final ? (item.Description || "") : "";

        const img = document.getElementById("albumArt");
        if (item.ImageURL && item.ImageURL.startsWith("http")) {
            img.src = item.ImageURL;
            img.style.display = "block";
        } else {
            img.style.display = "none";
        }
    }

    /* HISTORY PANEL */
    function renderHistory() {
        const container = document.getElementById("history");
        container.innerHTML = "";

        history.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.innerHTML = `
                <strong>${item.Title || ""}</strong><br>
                ${item.Description || ""}<br>
                ${item.ImageURL ? `<img src="${item.ImageURL}" width="100">` : ""}
            `;
            container.appendChild(div);
        });
    }

    document.getElementById("clearHistory").onclick = () => {
        history = [];
        saveHistory();
        renderHistory();
    };

    /* SAVE ITEMS + HISTORY */
    function saveItems() {
        localStorage.setItem("music_items", JSON.stringify(items));
    }

    function saveHistory() {
        localStorage.setItem("music_history", JSON.stringify(history));
    }

    /* PARTICLE BURST EFFECT */
    function burstParticles() {
        const canvas = document.getElementById("particles");
        const ctxP = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                alpha: 1
            });
        }

        function animate() {
            ctxP.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                p.alpha -= 0.02;
                ctxP.fillStyle = `rgba(0,170,255,${p.alpha})`;
                ctxP.beginPath();
                ctxP.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctxP.fill();
            });
            if (particles.some(p => p.alpha > 0)) requestAnimationFrame(animate);
        }

        animate();
    }

});
