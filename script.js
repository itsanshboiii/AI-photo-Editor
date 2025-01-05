const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let image = null;

const filters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      loadImage(event.target.result);
    };
    reader.readAsDataURL(file);
  }
});

const uploadSection = document.querySelector(".upload-section");
uploadSection.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadSection.style.borderColor = "#1a73e8";
});

uploadSection.addEventListener("dragleave", () => {
  uploadSection.style.borderColor = "#ccc";
});

uploadSection.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadSection.style.borderColor = "#ccc";
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      loadImage(event.target.result);
    };
    reader.readAsDataURL(file);
  }
});

function loadImage(src) {
  image = new Image();
  image.onload = function () {
    const maxWidth = 800;
    const maxHeight = 600;
    let width = image.width;
    let height = image.height;

    if (width > maxWidth) {
      height = (maxWidth * height) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (maxHeight * width) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    applyFilters();
    document.getElementById("enhanceButton").disabled = false;
  };
  image.src = src;
}

function applyFilters() {
  if (!image) return;

  ctx.filter = `
                brightness(${100 + filters.brightness}%)
                contrast(${100 + filters.contrast}%)
                saturate(${100 + filters.saturation}%)
                blur(${filters.blur}px)
            `;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

["brightness", "contrast", "saturation", "blur"].forEach((filter) => {
  document.getElementById(filter).addEventListener("input", function (e) {
    filters[filter] = parseInt(e.target.value);
    applyFilters();
  });
});

function resetFilters() {
  filters.brightness = 0;
  filters.contrast = 0;
  filters.saturation = 0;
  filters.blur = 0;

  Object.keys(filters).forEach((filter) => {
    document.getElementById(filter).value = filters[filter];
  });

  applyFilters();
}

function applyPreset(type) {
  switch (type) {
    case "vintage":
      filters.brightness = 10;
      filters.contrast = 20;
      filters.saturation = -20;
      break;
    case "dramatic":
      filters.brightness = -10;
      filters.contrast = 40;
      filters.saturation = 20;
      break;
    case "bw":
      filters.contrast = 20;
      filters.saturation = -100;
      break;
  }

  Object.keys(filters).forEach((filter) => {
    document.getElementById(filter).value = filters[filter];
  });

  applyFilters();
}

function downloadImage() {
  if (!image) return;

  const link = document.createElement("a");
  link.download = "edited-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function applyAIEnhancement() {
  if (!image) return;

  const aiStatus = document.getElementById("aiStatus");
  const enhanceButton = document.getElementById("enhanceButton");

  try {
    aiStatus.className = "loading";
    aiStatus.textContent = "Enhancing image with AI...";
    enhanceButton.disabled = true;

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "Image Editor");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dvsgduyqn/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    const enhancedUrl = data.secure_url.replace(
      "/upload/",
      "/upload/e_improve,e_enhance/"
    );

    const enhancedImage = new Image();
    enhancedImage.crossOrigin = "anonymous";
    enhancedImage.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(enhancedImage, 0, 0, canvas.width, canvas.height);

      aiStatus.className = "success";
      aiStatus.textContent = "AI enhancement complete!";
      enhanceButton.disabled = false;
    };
    enhancedImage.src = enhancedUrl;
  } catch (error) {
    aiStatus.className = "error";
    aiStatus.textContent = "Error during AI enhancement. Please try again.";
    enhanceButton.disabled = false;
    console.error("AI Enhancement error:", error);
  }
}
