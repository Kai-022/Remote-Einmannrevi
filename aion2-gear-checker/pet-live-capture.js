/* AION 2 Pet-Spezieskenntnisse: freiwillige Fensterfreigabe und lokaler Live-Bild-Import.
 * Bilder bleiben im Browser. Die vorhandene OCR/Bestätigung aus pet-screenshot.js
 * wird weiterverwendet; keine wiederholte Aufnahme im Hintergrund.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('pet-screenshot');
  const upload = $('pet-ocr-upload');
  const read = $('pet-ocr-read');
  const canvas = $('pet-ocr-canvas');
  if (!panel || !upload || !read || !canvas) return;

  const section = document.createElement('div');
  section.className = 'pet-live-capture';
  section.style.cssText = 'border:1px solid #776344;border-radius:10px;padding:15px;margin:16px 0;background:#202c3a';
  section.innerHTML =
    '<strong style="color:#f1d19b">Empfohlen: Direkt aus Aion 2 einlesen</strong>' +
    '<p style="margin:8px 0">1. Spiel-Fenster freigeben. 2. Im Spiel Pet → Spezieskenntnisse öffnen. 3. „Jetzt erkennen“ klicken und die erkannten Werte bestätigen.</p>' +
    '<div class="actions">' +
    '<button type="button" class="primary" id="pet-live-start">🎮 Spiel-Fenster freigeben</button>' +
    '<button type="button" id="pet-live-scan" disabled>Jetzt Pet-Talente erkennen</button>' +
    '<button type="button" id="pet-live-stop" disabled>Freigabe beenden</button>' +
    '</div>' +
    '<div id="pet-live-status" role="status" aria-live="polite" style="margin-top:10px;font-size:13px"></div>' +
    '<details style="margin-top:12px"><summary>Kein Fensterbild? Tipps</summary>' +
    '<p>Nutze Chrome oder Edge auf dem PC. Wähle bei der Freigabe möglichst das Aion-2-Fenster. Bei schwarzem Bild probiere den randlosen Fenstermodus. ' +
    'Wenn die Texterkennung nicht alle Werte liest, kannst du den angezeigten Bildausschnitt markieren und erneut auslesen.</p></details>';
  const heading = panel.querySelector('h2');
  if (heading) heading.insertAdjacentElement('afterend', section);
  else panel.prepend(section);
  const start = $('pet-live-start'), scan = $('pet-live-scan'), stop = $('pet-live-stop');
  const message = $('pet-live-status');
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  let stream = null;
  let busy = false;
  function status(text, error) {
    message.textContent = text;
    message.style.color = error ? '#ffadb8' : '#cbd5e1';
  }
  function controls() {
    const active = !!stream && stream.getVideoTracks().some(t => t.readyState === 'live');
    start.disabled = active || busy;
    scan.disabled = !active || busy;
    stop.disabled = !active;
  }
  function release() {
    const current = stream;
    stream = null;
    if (current) current.getTracks().forEach(t => t.stop());
    video.pause();
    video.srcObject = null;
    controls();
  }
  start.addEventListener('click', async () => {
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      status('Fensterfreigabe wird hier nicht unterstützt. Nutze Chrome/Edge über HTTPS oder den Screenshot-Upload.', true);
      return;
    }
    busy = true; controls();
    try {
      const chosen = await navigator.mediaDevices.getDisplayMedia({video: {frameRate: 8}, audio: false});
      release();
      stream = chosen;
      const track = chosen.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        if (stream !== chosen) return;
        release();
        status('Fensterfreigabe beendet. Du kannst sie jederzeit neu starten.');
      }, {once: true});
      video.srcObject = chosen;
      await video.play();
      const surface = track.getSettings && track.getSettings().displaySurface;
      status(surface === 'browser'
        ? 'Du teilst einen Browser-Tab. Für Aion 2 bitte stattdessen das Spiel-Fenster freigeben.'
        : 'Freigabe aktiv. Öffne jetzt die neun Spezieskenntnisse im Spiel und klicke auf „Jetzt Pet-Talente erkennen“.');
    } catch (err) {
      if (stream) release();
      if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
        status('Keine Freigabe erfolgt. Du kannst es erneut versuchen oder einen Screenshot verwenden.');
      } else {
        status('Spielbild konnte nicht freigegeben werden: ' + String(err && err.message || err), true);
      }
    } finally { busy = false; controls(); }
  });

  scan.addEventListener('click', async () => {
    if (!stream) return;
    busy = true; controls();
    try {
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2)
        throw Error('Noch kein Spielbild empfangen. Bitte das Spiel öffnen und erneut versuchen.');
      const frame = document.createElement('canvas');
      frame.width = video.videoWidth;
      frame.height = video.videoHeight;
      const context = frame.getContext('2d', {willReadFrequently: true});
      if (!context) throw Error('Die Bildaufnahme wird von diesem Browser nicht unterstützt.');
      context.drawImage(video, 0, 0, frame.width, frame.height);
      let blob = await new Promise(resolve => frame.toBlob(resolve, 'image/png'));
      let extension = 'png';
      if (blob && blob.size > 16e6) {
        blob = await new Promise(resolve => frame.toBlob(resolve, 'image/jpeg', 0.90));
        extension = 'jpg';
      }
      if (!blob || blob.size > 16e6) throw Error('Das Spielbild ist zu groß. Bitte eine niedrigere Spielauflösung wählen.');
      const file = new File([blob], 'aion2-pet-fenster.' + extension, {type: blob.type});
      const files = new DataTransfer();
      files.items.add(file);
      read.disabled = true;
      upload.files = files.files;
      upload.dispatchEvent(new Event('change', {bubbles: true}));
      // pet-screenshot.js lädt das Bild asynchron. Erst starten, wenn es einsatzbereit ist.
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const timer = setInterval(() => {
          if (!read.disabled && canvas.style.display !== 'none') {
            clearInterval(timer); resolve();
          } else if (++attempts > 150) {
            clearInterval(timer); reject(Error('Bild konnte nicht in den Pet-Scanner übernommen werden.'));
          }
        }, 80);
      });
      status('Spielbild aufgenommen. Die Talent-Texterkennung läuft; kontrolliere danach die Werte im Formular.');
      read.click();
    } catch (err) {
      status('Automatische Aufnahme nicht möglich: ' + String(err && err.message || err) + ' Du kannst alternativ einen Screenshot hochladen.', true);
    } finally {
      busy = false;
      controls();
    }
  });
  stop.addEventListener('click', () => {
    release();
    status('Fensterfreigabe beendet. Die erkannten Werte kannst du weiter bearbeiten.');
  });
  window.addEventListener('pagehide', release);
  controls();
  status('Dein Spielbild wird erst nach deiner Freigabe gelesen. Es wird nicht an unseren Server hochgeladen.');
})();