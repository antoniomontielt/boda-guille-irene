// Configuración con TUS DATOS
const CONFIG = {
  IMGBB_API_KEY: '08be12a532ca9bfabf7d0c4927b6ab4f',
  JSONBIN_BIN_ID: '685fde5f8a456b7966b740ab',
  JSONBIN_MASTER_KEY: '$2a$10$QQIOnCzrg7bLx85nErfyX.htUR8QoNMjmgzlA/rSlj7Zter35IyCC',
  MAX_IMAGES: 200
};

// Elementos del DOM
const elements = {
  imageInput: document.getElementById('imageInput'),
  gallery: document.getElementById('gallery'),
  lightbox: document.getElementById('lightbox'),
  lightboxImage: document.getElementById('lightbox-image'),
  closeBtn: document.querySelector('.close-btn'),
  prevBtn: document.querySelector('.prev-btn'),
  nextBtn: document.querySelector('.next-btn'),
  fileNameDisplay: document.getElementById('file-name'),
  loadingIndicator: document.getElementById('loading-indicator')
};

// Estado
let state = {
  images: [],
  currentIndex: 0,
  isLoading: false
};

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  if (!validateElements()) {
    console.error('Faltan elementos del DOM');
    return;
  }
  
  setupEventListeners();
  loadInitialImages();
});

// 2. FUNCIONES PRINCIPALES
async function loadInitialImages() {
  try {
    showLoading('Cargando galería...');
    const images = await getImageUrls();
    state.images = images.slice(0, CONFIG.MAX_IMAGES);
    renderGallery();
  } catch (error) {
    console.error('Error al cargar imágenes:', error);
    showMessage('Error al cargar la galería', 'error');
  } finally {
    hideLoading();
  }
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0 || state.isLoading) return;

  try {
    state.isLoading = true;
    showLoading('Subiendo imágenes...');

    for (const file of files) {
      // 1. Subir a ImgBB
      const imgbbUrl = await uploadToImgBB(file);

      // 2. Guardar en JSONBin
      await saveImageUrl(imgbbUrl);

      // 3. Actualizar galería en memoria
      state.images.unshift(imgbbUrl);
    }

    renderGallery();
    showMessage('¡Imágenes subidas con éxito!', 'success');
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    showMessage(`Error: ${error.message}`, 'error');
  } finally {
    state.isLoading = false;
    hideLoading();
    elements.imageInput.value = '';
  }
}


// 3. FUNCIONES DE SERVICIO
async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Error al subir a ImgBB');
  
  const data = await response.json();
  return data.data.url;
}

async function getImageUrls() {
  const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
    headers: { 'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY }
  });
  
  if (!response.ok) throw new Error('Error al obtener imágenes');
  
  const data = await response.json();
  return data.record.images || [];
}

async function saveImageUrl(url) {
  const currentImages = await getImageUrls();
  const updatedImages = [url, ...currentImages];
  
  const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
    },
    body: JSON.stringify({ images: updatedImages })
  });
  
  if (!response.ok) throw new Error('Error al guardar en JSONBin');
}

// 4. FUNCIONES DE UI
function renderGallery() {
  elements.gallery.innerHTML = '';
  
  state.images.forEach((url, index) => {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Foto ${index + 1}`;
    img.loading = 'lazy';
    
    img.addEventListener('click', () => openLightbox(index));
    
    imgContainer.appendChild(img);
    elements.gallery.appendChild(imgContainer);
  });
}

function openLightbox(index) {
  state.currentIndex = index;
  elements.lightboxImage.src = state.images[index];
  elements.lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  elements.lightbox.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function navigate(direction) {
  const newIndex = (state.currentIndex + direction + state.images.length) % state.images.length;
  openLightbox(newIndex);
}

// 5. UTILIDADES
function validateElements() {
  return Object.values(elements).every(el => el !== null);
}

function setupEventListeners() {
  elements.imageInput.addEventListener('change', handleImageUpload);
  elements.closeBtn.addEventListener('click', closeLightbox);
  elements.prevBtn.addEventListener('click', () => navigate(-1));
  elements.nextBtn.addEventListener('click', () => navigate(1));
  
  // Eventos táctiles
  let touchStartX = 0;
  elements.lightboxImage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  });
  
  elements.lightboxImage.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (Math.abs(touchStartX - touchEndX) > 50) {
      navigate(touchStartX > touchEndX ? 1 : -1);
    }
  });
}

document.getElementById('download-zip').addEventListener('click', async () => {
  if (state.images.length === 0) {
    showMessage('No hay imágenes para descargar', 'error');
    return;
  }

  showLoading('Preparando descarga...');

  const zip = new JSZip();
  const folder = zip.folder('imagenes');

  try {
    for (let i = 0; i < state.images.length; i++) {
      const url = state.images[i];
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = url.split('.').pop().split('?')[0]; // Extraer extensión
      folder.file(`foto_${i + 1}.${ext}`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'galeria.zip');
    hideLoading();
    showMessage('¡Descarga lista!', 'success');
  } catch (error) {
    console.error('Error al generar el zip:', error);
    hideLoading();
    showMessage('Error al generar el ZIP', 'error');
  }
});


function showLoading(message) {
  elements.loadingIndicator.style.display = 'flex';
  elements.loadingIndicator.querySelector('p').textContent = message;
}

function hideLoading() {
  elements.loadingIndicator.style.display = 'none';
}

function showMessage(text, type) {
  elements.fileNameDisplay.textContent = text;
  elements.fileNameDisplay.className = `file-message ${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      elements.fileNameDisplay.textContent = '';
      elements.fileNameDisplay.className = 'file-message';
    }, 3000);
  }
}