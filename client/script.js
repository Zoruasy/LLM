const form = document.querySelector("form");
const chatfield = document.querySelector("#chatfield");
const responseDiv = document.querySelector("#response");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    askQuestion();
});

async function askQuestion() {
    const prompt = chatfield.value;
    const options = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
    };

    const response = await fetch("http://localhost:3000/", options);
    if (response.ok) {
        const data = await response.json();
        responseDiv.textContent = data.message;
    } else {
        console.error(response.status);
    }
}
