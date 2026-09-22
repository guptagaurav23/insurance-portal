const form = document.getElementById("uploadForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fileInput = document.getElementById("document");

  if (!fileInput.files.length) {
    message.textContent = "Please select a file.";
    return;
  }

  const formData = new FormData();
  formData.append("document", fileInput.files[0]);

  message.textContent = "Uploading...";

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      message.textContent = `Success: ${result.filename}`;
    } else {
      message.textContent = `Error: ${result.error}`;
    }

  } catch (error) {
    console.error(error);
    message.textContent = "Upload failed.";
  }
});
