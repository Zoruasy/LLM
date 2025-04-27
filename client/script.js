const form = document.querySelector("form");
const chatfield = document.getElementById("chatfield");
const output = document.getElementById("response");

form.addEventListener("submit", askQuestion);

const storageKey = "PokemonChatHistoryRAG⚡";

const systemPromptTemplate = `You are a cheerful and knowledgeable Pokémon Professor.
You answer questions about Pokémon species, types, evolutions, battles, and regions.
You also know the current temperature in Rotterdam, which is {temperature}, and you may share it when asked about the weather.
If the question is about Pokémon, answer enthusiastically.
If the question is about the weather in Rotterdam, use the provided temperature information.
If the question is about anything else, politely decline and explain that you specialize only in Pokémon knowledge.`;

// Maak een markdown converter
const converter = new showdown.Converter();

let messages = [];

async function initializeMessages() {
    let currentTemperature = "data unavailable";
    try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=51.92&longitude=4.48&current_weather=true");
        if (response.ok) {
            const weatherData = await response.json();
            if (weatherData?.current_weather?.temperature !== undefined) {
                const temp = weatherData.current_weather.temperature;
                const unit = weatherData.current_weather_units?.temperature || "°C";
                currentTemperature = `${temp}${unit}`;
            }
        }
    } catch (error) {
        console.error("Weather fetch error:", error);
    }

    const finalSystemPrompt = systemPromptTemplate.replace("{temperature}", currentTemperature);

    const storedMessages = JSON.parse(localStorage.getItem(storageKey));

    if (storedMessages && Array.isArray(storedMessages) && storedMessages.length > 0) {
        messages = [
            ["system", finalSystemPrompt],
            ...storedMessages.slice(1)
        ];
    } else {
        messages = [
            ["system", finalSystemPrompt]
        ];
    }
    console.log("Chat initialized. System prompt:", messages[0][1]);
}

async function askQuestion(e) {
    e.preventDefault();

    const prompt = chatfield.value.trim();
    if (!prompt) return;

    messages.push(["human", prompt]);
    chatfield.value = "";
    chatfield.disabled = true;
    output.innerHTML = "<em>Thinking...</em>";

    const options = {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
    };

    try {
        const response = await fetch("http://localhost:3000/", options);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiReply = "";
        output.innerHTML = "";

        let done = false;
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const chunkText = decoder.decode(value, { stream: true });
                aiReply += chunkText;
                await typeText(chunkText);
            }
        }

        // Final flush
        aiReply += decoder.decode();

        if (aiReply) {
            const pokeSpeakReply = await translateToPokeSpeak(aiReply);

            messages.push(["assistant", pokeSpeakReply]);
            localStorage.setItem(storageKey, JSON.stringify(messages));
            output.innerHTML = converter.makeHtml(pokeSpeakReply);
            console.log("Received full (PokeSpeak) response:", pokeSpeakReply);
        }

    } catch (error) {
        output.innerHTML = "<strong>Something went wrong with streaming. Check console.</strong>";
        console.error("Error during fetch or streaming:", error);
    } finally {
        chatfield.disabled = false;
    }
}

// ✅ Typing Effect functie
async function typeText(text) {
    for (const char of text) {
        output.textContent += char;
        await new Promise(resolve => setTimeout(resolve, 20)); // 20ms delay per character
    }
}

// ✅ FunTranslations: PokeSpeak vertaling
async function translateToPokeSpeak(text) {
    try {
        const response = await fetch("https://api.funtranslations.com/translate/pokemon.json", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ text: text })
        });

        if (response.ok) {
            const data = await response.json();
            return data.contents.translated;
        } else {
            console.error("FunTranslations API error:", response.status);
            return text;
        }
    } catch (error) {
        console.error("Error contacting FunTranslations:", error);
        return text;
    }
}

initializeMessages();
