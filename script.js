let items = [];
let history = [];

document.getElementById("loadBtn").onclick = () => {
    const file = document.getElementById("csvInput").files[0];
    if (!file) return alert("Please upload a CSV");

    Papa.parse(file, {
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            items = results.data.filter(row => row.Title);
            alert("CSV Loaded Successfully");
        }
    });
};

document.getElementById("startBtn").onclick = () => {
    if (items.length === 0) return alert("No items loaded");

    const speed = document.getElementById("speedSlider").value;
    const removeAfter = document.getElementById("removeAfter").checked;
    const playSound = document.getElementById("playSound").checked;
    
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

            if (playSound) {
                document.getElementById("dingSound").play();
            }

            history.push(finalItem);
            renderHistory();

            if (removeAfter) {
                items = items.filter(i => i.Title !== finalItem.Title);
            }
        }
    }, speed);
};

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
