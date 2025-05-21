// script.js
let mediaRecorder;
let audioChunks = [];
let timerInterval;
let secondsElapsed = 0;
const startBtn = document.getElementById('startRecording');
const stopBtn  = document.getElementById('stopRecording');
const audioEl  = document.getElementById('audioPreview');
const timerEl  = document.getElementById('timerDisplay');
const form     = document.getElementById('pitchForm');
const statusEl = document.getElementById('submitStatus');

function updateTimer() {
  secondsElapsed++;
  const m = String(Math.floor(secondsElapsed/60)).padStart(2,'0');
  const s = String(secondsElapsed%60).padStart(2,'0');
  timerEl.textContent = `${m}:${s}`;
  if (secondsElapsed >= 120) stopRecording();
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    audioEl.style.display = 'none';
    secondsElapsed = 0;
    timerEl.textContent = '00:00';
    timerInterval = setInterval(updateTimer, 1000);

    mediaRecorder.addEventListener('dataavailable', e => { if (e.data.size > 0) audioChunks.push(e.data); });
    mediaRecorder.addEventListener('stop', () => {
      clearInterval(timerInterval);
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      audioEl.src = URL.createObjectURL(blob);
      audioEl.style.display = 'block';
    });
  } catch(err) { alert('No se pudo acceder al micrófono. Verifica permisos.'); }
}

function stopRecording() {
  if(mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled  = true;
  }
}

startBtn.addEventListener('click', startRecording);
stopBtn .addEventListener('click', stopRecording);

form.addEventListener('submit', async e => {
  e.preventDefault();
  statusEl.textContent = '';
  if(audioChunks.length === 0) {
    document.getElementById('audioError').textContent = 'Por favor, graba tu mensaje.';
    return;
  }
  const formData = new FormData(form);
  formData.append('audio', new Blob(audioChunks, { type: 'audio/webm' }), 'pitch.webm');
  try {
    const res = await fetch('https://aagudelo.app.n8n.cloud/webhook/formulario', { method:'POST', body: formData });
    if(res.ok) {
      statusEl.className = 'status-message success';
      statusEl.textContent = '¡Mensaje enviado con éxito!';
      form.reset(); audioEl.src = ''; audioEl.style.display = 'none';
    } else throw new Error();
  } catch {
    statusEl.className = 'status-message error';
    statusEl.textContent = 'Error al enviar. Intenta de nuevo.';
  }
});
