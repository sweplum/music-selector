document.addEventListener("DOMContentLoaded", () => {

    let items = [];
    let history = [];

    /* LOAD SAVED ITEMS + HISTORY */
    const savedItems = localStorage.getItem("music_items");
    if (savedItems) {
        try {
            items = JSON.parse(savedItems);
            updateWheelLabels();
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
                updateWheelLabels();
                alert("CSV Loaded Successfully");
            }
        });
    };

    /* SPIN BUTTON – RAFFLE WHEEL STYLE */
    document.getElementById("startBtn").onclick = () => {
        if (items.length === 0) return alert("No items loaded");

        const removeAfter = document.getElementById("removeAfter").checked;
        const wheel = document.getElementById("spinnerWheel");
        const spinSound = document.getElementById("spinSound");
        const dingSound = document.getElementById("dingSound");

        const count = items.length;
        const slotAngle = 360 / count;

        // pick target index
        const targetIndex = Math.floor(Math.random() * count);

        // base offset so slot 0 is at pointer (top)
        const baseOffset = -90; // pointer at top
        const fullSpins = 5;    // number of full rotations

        const finalRotation =
            360 * fullSpins +
            baseOffset -
            targetIndex * slotAngle;

        // show equalizer while spinning
        document.getElementById("equalizer").style.display = "flex";

        // start spin sound
        spinSound.currentTime = 0;
        spinSound.loop = true;
        spinSound.play();

        wheel.style.transform = `rotate(${finalRotation}deg)`;

        const speedFactor = document.getElementById("speedSlider").value; // 1–5
        const duration = 3000 - (speedFactor - 1) * 400; // faster at higher speed

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
                updateWheelLabels();
            }
        }, duration);
    };

    /* UPDATE DISPLAY */
    function updateDisplay(item, final) {
        document.getElementById("currentTitle").textContent = item.Title;
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

    /* WHEEL LABELS – SLOTS AROUND CENTER */
    function updateWheelLabels() {
        const container = document.getElementById("wheelLabels");
        container.innerHTML = "";

        const count = items.length;
        if (count === 0) return;

        const radius = 100;

        items.forEach((item, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = 130 + radius * Math.cos(angle);
            const y = 130 + radius * Math.sin(angle);

            const div = document.createElement("div");
            div.className = "wheel-label";
            div.style.left = `${x - 40}px`;
            div.style.top = `${y - 10}px`;
            div.style.transform = `rotate(${(angle * 180 / Math.PI) + 90}deg)`;
            div.textContent = item.Title;

            container.appendChild(div);
        });
    }

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
        const ctx = canvas.getContext("2d");
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                p.alpha -= 0.02;
                ctx.fillStyle = `rgba(0,170,255,${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            if (particles.some(p => p.alpha > 0)) requestAnimationFrame(animate);
        }

        animate();
    }

});
