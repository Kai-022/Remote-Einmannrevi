/* Schnellzugriff auf den Pet-Scanner, auch wenn noch kein Gear importiert ist.
   Daten werden unter dem ausdrücklich gewählten Charakternamen lokal gespeichert. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const hero = document.querySelector('.hero');
  if (!hero || !$('pet-screenshot') || !$('dash')) return;
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.id = 'pet-scanner-start';
  panel.innerHTML =
    '<div class="eyebrow">NEU · DIREKT ZUM PET-SCANNER</div>' +
    '<h2>🎮 Spezieskenntnisse aus Aion 2 scannen</h2>' +
    '<p>Funktioniert auch ohne vorherigen Charakterimport. Gib deinen Charakternamen ein, öffne den Scanner und gib im Browser das Spiel-Fenster frei. Die Werte werden erst nach deiner Bestätigung gespeichert.</p>' +
    '<div class="grid" style="align-items:end">' +
    '<div class="field"><label for="pet-scanner-name">Charaktername für die lokale Speicherung</label>' +
    '<input id="pet-scanner-name" maxlength="45" placeholder="Dein Aion-2-Charaktername" autocomplete="off"></div>' +
    '<div class="field"><button type="button" class="primary" id="pet-scanner-open">🎮 Pet-Scanner jetzt öffnen</button></div>' +
    '</div><div id="pet-scanner-start-status" class="status" role="status" aria-live="polite"></div>';
  // Unmittelbar unter dem Titel sichtbar, unabhängig von Charakterimport oder aktiver Registerkarte.
  hero.after(panel);
  const nameInput = $('pet-scanner-name');
  const status = $('pet-scanner-start-status');
  const hasImportedCharacter = () => !isDemo &&
    (!!data?.sourceRef || Object.keys(data?.gear || {}).length > 0);
  function syncProfile() {
    if (data?.name && data.name !== 'Mein Kleriker' && (!nameInput.value.trim() || hasImportedCharacter()))
      nameInput.value = data.name;
    nameInput.readOnly = hasImportedCharacter();
    if (hasImportedCharacter())
      status.textContent = 'Aktuell geladener Charakter: ' + data.name + '. Für einen anderen Charakter zuerst dessen Profil laden.';
  }
  syncProfile();
  $('pet-scanner-open').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name.length < 2) {
      status.textContent = 'Bitte zuerst deinen Charakternamen eingeben (mindestens 2 Zeichen).';
      status.classList.add('error');
      nameInput.focus();
      return;
    }
    if (hasImportedCharacter() && name !== data.name) {
      status.textContent = 'Es ist bereits ein anderer Charakter geladen. Bitte zuerst den richtigen Charakter importieren.';
      status.classList.add('error');
      return;
    }
    if (!hasImportedCharacter()) {
      if (isDemo) data = {name, mode:'hybrid', gear:{}};
      else {data.name = name; data.gear = data.gear || {};}
      isDemo = false;
      store();
      $('type').textContent = 'PET-SCAN · LOKALE WERTE';
    }
    $('dash').classList.remove('hidden');
    $('current').textContent = data.name;
    $('charname').value = data.name;
    // Tabs mit ihren vorhandenen Event-Handlern öffnen (kein doppeltes Tab-System).
    const petTab = document.querySelector('button[data-tab="pets"]');
    if (petTab) petTab.click();
    else { $('tab-pets')?.classList.remove('hidden'); }
    render();
    const petPanel = $('pet-screenshot');
    petPanel?.scrollIntoView({behavior:'smooth', block:'start'});
    status.textContent = 'Pet-Scanner für ' + data.name + ' geöffnet. Starte jetzt die Fensterfreigabe.';
    status.classList.remove('error');
  });
  // Direkt-Link zum Eingabebereich ohne Charakterimport ermöglichen.
  if (window.location.hash === '#pet-scanner') {
    panel.scrollIntoView({block:'start'});
  }
})();