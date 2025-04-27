import express from 'express'
import cors from 'cors'
import { AzureChatOpenAI } from "@langchain/openai";

const model = new AzureChatOpenAI({ temperature: 1 });

const app = express()
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GET request
app.get('/', async (req, res) => {
    const result = await tellJoke();
    res.json({ message: result });
});

// POST request
app.post('/', async (req, res) => {
    const prompt = req.body.prompt;
    console.log("The user asked for: " + prompt);
    const result = await model.invoke(prompt);
    res.json({ message: result.content });
});

async function tellJoke() {
    const joke = await model.invoke("Tell me a JavaScript joke!");
    return joke.content;
}

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
