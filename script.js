document.addEventListener("DOMContentLoaded", () => {

    let items = [];
    let history = [];

    /* AUTO-LOAD CSV WHEN BROWSED */
    document.getElementById("csvInput").onchange = () => {
        const file = document.getElementById("csvInput").files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: false,
            complete: function(results) {
                items = results.data.filter(row => row.Title);
                updateWheelLabels();
                alert("CSV Loaded Successfully");
            }
        });
    };

    /* SPIN BUTTON */
    document.getElementById("startBtn").onclick = () => {
        if (items.length === 0) return alert("No items loaded");

        const speed = document.getElementById("speedSlider").value;
        const removeAfter = document.getElementById("removeAfter").checked;

        // Turn ON animations
        document.getElementById("spinnerWheel").style.display = "block";
        document.getElementById("equalizer").style.display = "flex";

        let cycles = 30;

        let interval = setInterval(() => {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            updateDisplay(randomItem, false);
            cycles--;

            if (cycles <= 0) {
                clearInterval(interval);

                const finalItem = items[Math.floor(Math.random() * items.length)];
                updateDisplay(finalItem, true);

                // Turn OFF animations
                document.getElementById("spinnerWheel").style.display = "none";
                document.getElementById("equalizer").style.display = "none";

                // Play sound automatically
                document.getElementById("dingSound").play();

                // Particle burst
                burstParticles();

                // Add to history
                history.push(finalItem);
                renderHistory();

                // Remove selected item if enabled
                if (removeAfter) {
                    items = items.filter(i => i.Title !== finalItem.Title);
                    updateWheelLabels();
                }
            }
        }, speed);
    };

    /* UPDATE DISPLAY */
    function updateDisplay(item, final) {
        document.getElementById("currentTitle").textContent = item.Title;
        document.getElementById("description").textContent = final ? item.Description : "";

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
                ${item.Description}<br>
                ${item.ImageURL ? `<img src="${item.ImageURL}" width="100">` : ""}
            `;
            container.appendChild(div);
        });
    }

    document.getElementById("clearHistory").onclick = () => {
        history = [];
        renderHistory();
    };

    /* WHEEL LABELS AROUND THE CIRCLE */
    function updateWheelLabels() {
        const container = document.getElementById("wheelLabels");
        container.innerHTML = "";

        const count = items.length;
        const radius = 110;

        items.forEach((item, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = 130 + radius * Math.cos(angle);
            const y = 130 + radius * Math.sin(angle);

            const div = document.createElement("div");
            div.className = "wheel-label";
            div.style.left = `${x}px`;
            div.style.top = `${y}px`;
            div.textContent = item.Title;

            container.appendChild(div);
        });
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
