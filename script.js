document.addEventListener("DOMContentLoaded", () => {

    let items = [];
    let history = [];
    let spinning = false;
    let currentRotation = 0;

    const wheelCanvas = document.getElementById("wheelCanvas");
    const ctx = wheelCanvas.getContext("2d");

    const spinSound = document.getElementById("spinSound");
    const dingSound = document.getElementById("dingSound");

    const liveTitle = document.getElementById("liveTitle");
    const infoPanel = document.getElementById("infoPanel");
    const wheelWrapper = document.getElementById("wheelWrapper");

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

    /* SPIN BUTTON – LIVE UPDATING RAFFLE WHEEL */
    document.getElementById("startBtn").onclick = () => {
        if (items.length === 0) return alert("No items loaded");
        if (spinning) return;

        spinning = true;
        infoPanel.classList.add("hidden");
        wheelWrapper.classList.remove("shift-left");

        const removeAfter = document.getElementById("removeAfter").checked;
        const count = items.length;
        const sliceAngleDeg = 360 / count;

        // choose target index
        const targetIndex = Math.floor(Math.random() * count);

        const spins = 6;
        const finalRotation = 360 * spins - targetIndex * sliceAngleDeg;

        const speedFactor = document.getElementById("speedSlider").value;
        const duration = 4500 - (speedFactor - 1) * 500;

        // equalizer on
        document.getElementById("equalizer").style.display = "flex";

        // spin sound
        spinSound.currentTime = 0;
        spinSound.loop = true;
        spinSound.play();

        // animate wheel
        wheelCanvas.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`;
        wheelCanvas.style.transform = `rotate(${finalRotation}deg)`;

        // LIVE UPDATE LOOP
        const startTime = performance.now();
        function updateLiveTitle(now) {
            const elapsed = now - startTime;
            if (elapsed >= duration) return;

            const progress = elapsed / duration;
            const angle = currentRotation + (finalRotation - currentRotation) * progress;

            const normalized = ((angle % 360) + 360) % 360;
            const index = Math.floor((normalized + sliceAngleDeg / 2) / sliceAngleDeg) % count;

            liveTitle.textContent = items[index].Title;

            requestAnimationFrame(updateLiveTitle);
        }
        requestAnimationFrame(updateLiveTitle);

        // FINALIZE AFTER SPIN
        setTimeout(() => {
            spinSound.pause();
            spinSound.currentTime = 0;

            document.getElementById("equalizer").style.display = "none";

            const finalItem = items[targetIndex];
            liveTitle.textContent = finalItem.Title;

            dingSound.currentTime = 0;
            dingSound.play();

            burstParticles();

            history.push(finalItem);
            saveHistory();
            renderHistory();

            // show info panel
            document.getElementById("currentTitle").textContent = finalItem.Title;
            document.getElementById("description").textContent = finalItem.Description || "";

            const img = document.getElementById("albumArt");
            if (finalItem.ImageURL && finalItem.ImageURL.startsWith("http")) {
                img.src = finalItem.ImageURL;
                img.style.display = "block";
            } else {
                img.style.display = "none";
            }

            infoPanel.classList.remove("hidden");
            wheelWrapper.classList.add("shift-left");

            if (removeAfter) {
                items.splice(targetIndex, 1);
                saveItems();
                drawWheel();
            }

            currentRotation = finalRotation % 360;
            wheelCanvas.style.transition = "none";
            wheelCanvas.style.transform = `rotate(${currentRotation}deg)`;

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
        const radius = Math.min(cx, cy) - 20;

        ctx.clearRect(0, 0, w, h);

        if (items.length === 0) return;

        const count = items.length;
        const sliceAngle = (2 * Math.PI) / count;
        const colors = ["#00aaff", "#0044ff", "#00ddff", "#0088ff"];

        for (let i = 0; i < count; i++) {
            const centerAngle = -Math.PI / 2 + i * sliceAngle;
            const startAngle = centerAngle - sliceAngle / 2;
            const endAngle = centerAngle + sliceAngle / 2;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            ctx.strokeStyle = "rgba(0,0,0,0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(centerAngle);
            ctx.textAlign = "right";
            ctx.fillStyle = "#000";
            ctx.font = "16px Poppins";
            ctx.fillText(items[i].Title, radius - 30, 6);
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,170,255,0.8)";
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    /* HISTORY PANEL */
    function renderHistory() {
        const container = document.getElementById("history");
        container.innerHTML = "";

        history.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.innerHTML = `
                <strong>${item.Title}</strong><br>
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
                ctxP.fillStyle = `rgba(0,170,255,${p
