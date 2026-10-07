const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
//app.use(express.json());

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));


// Home route
// app.get("/", (req, res) => {
//     res.send("AI Sentence Corrector Backend is running!");
// });


// Sentence correction API
app.post("/api/correct", async (req, res) => {

    try {

        const { text } = req.body;

        // Validate input
        if (!text || !text.trim()) {

            return res.status(400).json({
                success: false,
                message: "Please enter a sentence."
            });
        }


        // Send request to OpenRouter
        const response = await axios.post(

            "https://openrouter.ai/api/v1/chat/completions",

            {
                model: "openrouter/free",

                messages: [

                    {
                        role: "system",

                        content: `
You are a professional English grammar and sentence correction assistant.

Your task is to analyze the user's sentence and correct:
- Grammar
- Spelling
- Punctuation
- Word usage
- Sentence structure
- Clarity

Return ONLY valid JSON.

Use exactly this format:

{
  "correctedSentence": "corrected sentence here",
  "explanation": "brief explanation of the correction",
  "corrections": [
    {
      "original": "incorrect text",
      "corrected": "correct text"
    }
  ]
}

Rules:
- Do not use Markdown.
- Do not add text outside the JSON.
- If the sentence is already correct, return the original sentence.
- If there are no corrections, return an empty corrections array.
- Keep the meaning of the user's sentence unchanged.
- Do not unnecessarily rewrite a correct sentence.
- Do not use present perfect (have/has + past participle) with finished past-time expressions such as yesterday, last week, last year, ago, or in 2020.
- When a sentence contains a finished past-time expression, use simple past when appropriate.
- Example: "I have completed my work yesterday." → "I completed my work yesterday."
- Prefer grammatically standard English over unnatural alternatives.
                        `
                    },

                    {
                        role: "user",
                        content: text
                    }

                ]
            },

            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }

        );


        const result =
            response.data.choices[0].message.content;


        // Send result to frontend
        res.json({

            success: true,
            result: result

        });


    } catch (error) {

        console.error(
            "OpenRouter Error:",
            error.response?.data || error.message
        );


        res.status(500).json({

            success: false,
            message: "Unable to correct the sentence."

        });

    }

});


// Start server
app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});