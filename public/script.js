const inputText = document.getElementById("inputText");
const charCount = document.getElementById("charCount");

const clearBtn = document.getElementById("clearBtn");
const correctBtn = document.getElementById("correctBtn");
const copyBtn = document.getElementById("copyBtn");

const outputText = document.getElementById("outputText");
const explanation = document.getElementById("explanation");
const corrections = document.getElementById("corrections");
const status = document.getElementById("status");

// Character counter
inputText.addEventListener("input", () => {
  charCount.textContent = `${inputText.value.length} characters`;
});

// Clear button
clearBtn.addEventListener("click", () => {
  inputText.value = "";

  charCount.textContent = "0 characters";

  outputText.textContent = "Your corrected sentence will appear here.";

  explanation.textContent = "";

  explanation.classList.add("hidden");
  corrections.classList.add("hidden");

  status.textContent = "";

  copyBtn.disabled = true;
});

// Correct button
correctBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();

  if (!text) {
    status.textContent = "Please enter a sentence.";
    return;
  }

  //correctBtn.disabled = true;
  //correctBtn.textContent = "Correcting...";

  correctBtn.disabled = true
  correctBtn.classList.add("loading");
  correctBtn.textContent = "Correcting...";

  //status.textContent = "AI is checking your sentence...";
  status.textContent = "✨ AI is analyzing your sentence...";

  try {
    const response = await fetch("/api/correct", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: text,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Something went wrong.");
    }

    let result = data.result;

    // Remove Markdown code fences if AI adds them
    result = result
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let aiResult;

    try {
      aiResult = JSON.parse(result);
    } catch (error) {
      console.error("Invalid AI response:", result);

      status.textContent =
        "AI returned an unexpected response. Please try again.";

      status.classList.add("error");

      outputText.textContent = "Unable to generate a correction.";

      explanation.classList.add("hidden");
      corrections.classList.add("hidden");

      copyBtn.disabled = true;

      return;
    }

    // Validate AI response
    if (
      !aiResult ||
      typeof aiResult.correctedSentence !== "string" ||
      !aiResult.correctedSentence.trim()
    ) {
      console.error("Invalid correction format:", aiResult);

      status.textContent =
        "AI returned an invalid correction. Please try again.";

      status.classList.add("error");

      outputText.textContent = "Unable to generate a correction.";

      explanation.classList.add("hidden");
      corrections.classList.add("hidden");

      copyBtn.disabled = true;

      return;
    }

    // Show corrected sentence
    outputText.textContent = aiResult.correctedSentence || text;

    // Show explanation
    if (aiResult.explanation) {
      explanation.textContent = aiResult.explanation;

      explanation.classList.remove("hidden");
    } else {
      explanation.classList.add("hidden");
    }

    // Show corrections
    corrections.innerHTML = "";

    if (
      Array.isArray(aiResult.corrections) &&
      aiResult.corrections.length > 0
    ) {
      aiResult.corrections.forEach((item) => {
        const correctionItem = document.createElement("div");

        correctionItem.className = "correction-item";

        correctionItem.innerHTML = `
                    <div>
                        <strong class="original">
                            ${escapeHtml(item.original)}
                        </strong>
                        →
                        <strong class="corrected">
                            ${escapeHtml(item.corrected)}
                        </strong>
                    </div>
                `;

        corrections.appendChild(correctionItem);
      });

      corrections.classList.remove("hidden");
    } else {
      corrections.classList.add("hidden");
    }

    copyBtn.disabled = false;

    status.classList.remove("error");

    status.textContent = "Sentence corrected successfully ✓";
  } catch (error) {
    console.error(error);

    status.classList.add("error");

    if (error.message) {
      status.textContent = error.message;
    } else {
      status.textContent = "Unable to correct the sentence. Please try again.";
    }
  } finally {
    //correctBtn.disabled = false;

    //correctBtn.textContent =
    //"Correct with AI ✨";

    correctBtn.disabled = false;
    correctBtn.classList.remove("loading");

    correctBtn.textContent = "Correct with AI ✨";
  }
});

// Copy button
copyBtn.addEventListener("click", async () => {
  const text = outputText.textContent;

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    status.textContent = "Corrected sentence copied ✓";
  } catch (error) {
    status.textContent = "Unable to copy the sentence.";
  }
});

// Prevent HTML injection
function escapeHtml(text) {
  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

inputText.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();

    correctBtn.click();
  }
});
