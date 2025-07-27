async function handleSearch() {
    const imageInput = document.getElementById("imageInput");
    const output = document.getElementById("output");
    output.innerText = "Processing...";

    const file = imageInput.files[0];

    if (!file) {
        output.innerText = "Please select an image file";
        return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];

        try {
            //Send to OCR
            const ocrRes = await fetch('http://localhost:3000/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Image })
            });

            const ocrData = await ocrRes.json();
            const rawText = ocrData.cleaned || "";

            output.innerText = "Raw OCR Text:\n" + rawText;

            if (!rawText.trim()) {
                output.innerText += "\nNo text found in image.";
                return;
            }

            //raw text sent to ai
            const aiRes = await fetch('http://localhost:3000/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: rawText })
            });

            const aiData = await aiRes.json();
            output.innerText += "\n\nCleaned OCR Text:\n" + aiData.cleaned;

        } catch (err) {
            console.error("Error during OCR/AI processing:", err);
            output.innerText += "\n\nError processing OCR or cleaning.";
        }
    };

    reader.readAsDataURL(file);
}


async function AIonly() {
const text = document.getElementById("searchInput").value;
const output = document.getElementById("output2");

output.innerText = "Processing...";

try {
    const res = await fetch(`http://localhost:3000/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
    });

        const data = await res.json();
        document.getElementById("output2").innerText += "\nCleaned OCR: " + data.cleaned;

    } catch (err) {
        console.log("Error calling Ai API:", err)
        document.getElementById("output2").innerText += "\nError processing OCR."
    }
}
