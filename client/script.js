const form = document.querySelector("form");
const chatfield = document.getElementById("chatfield");
const output = document.getElementById("response"); // Gebruik nu 'response'!

form.addEventListener("submit", askQuestion);

const storageKey = "PokemonChatHistoryRAG⚡";

const systemPromptTemplate = `You are a cheerful and knowledgeable Pokémon Professor.
You answer questions about Pokémon species, types, evolutions, battles, and regions.
If the question is not about Pokémon, politely decline and explain that you specialize only in Pokémon knowledge.
Always be enthusiastic, and speak as if you are guiding a new Pokémon Trainer.`;

// Maak een markdown converter
const converter = new showdown.Converter();

let messages = [];

async function initializeMessages() {
    const storedMessages = JSON.parse(localStorage.getItem(storageKey));

    if (storedMessages && Array.isArray(storedMessages) && storedMessages.length > 0) {
        messages = [
            ["system", systemPromptTemplate],
            ...storedMessages.slice(1)
        ];
    } else {
        messages = [
            ["system", systemPromptTemplate]
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
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
    };

    try {
        const response = await fetch("http://localhost:3000/", options);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiReply = "";
        output.innerHTML = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            const chunkText = decoder.decode(value, { stream: true });
            aiReply += chunkText;
            output.innerHTML = converter.makeHtml(aiReply); // Gebruik Markdown!
        }

        if (aiReply) {
            messages.push(["assistant", aiReply]);
            localStorage.setItem(storageKey, JSON.stringify(messages));
            console.log("Received full response:", aiReply);
        }

    } catch (error) {
        output.innerHTML = "<strong>Something went wrong with streaming. Check console.</strong>";
        console.error("Error during fetch or streaming:", error);
    }
    finally {
        chatfield.disabled = false;
    }
}

initializeMessages();
