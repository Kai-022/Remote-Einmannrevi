/* Schnellzugriff auf die manuelle Pet-Eingabe, auch ohne Gear-Import.
   Daten werden unter dem ausdrücklich gewählten Charakternamen lokal gespeichert. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const hero = document.querySelector('.hero');
  if (!hero || !$('pet-list') || !$('dash')) return;
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.id = 'pet-scanner-start';
  panel.innerHTML =
    '<div class="eyebrow">PET-SPEZIESKENNTNISSE</div>' +
    '<h2>✎ Pet-Talente selbst eintragen</h2>' +
    '<p>Kein Scanner und keine Fensterfreigabe mehr nötig. Gib deinen Charakternamen ein und trage die neun Talentwerte pro Spezies direkt in der Armory ein. Alles wird lokal gespeichert.</p>' +
    '<div class="grid" style="align-items:end">' +
    '<div class="field"><label for="pet-scanner-name">Charaktername für die lokale Speicherung</label>' +
    '<input id="pet-scanner-name" maxlength="45" placeholder="Dein Aion-2-Charaktername" autocomplete="off"></div>' +
    '<div class="field"><button type="button" class="primary" id="pet-scanner-open">✎ Pet-Werte eingeben</button></div>' +
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
      $('type').textContent = 'PET-WERTE · MANUELLE EINGABE';
    }
    $('dash').classList.remove('hidden');
    $('current').textContent = data.name;
    $('charname').value = data.name;
    // Tabs mit ihren vorhandenen Event-Handlern öffnen (kein doppeltes Tab-System).
    const petTab = document.querySelector('button[data-tab="pets"]');
    if (petTab) petTab.click();
    else { $('tab-pets')?.classList.remove('hidden'); }
    render();
    const petPanel = $('pet-list');
    petPanel?.scrollIntoView({behavior:'smooth', block:'start'});
    status.textContent = 'Pet-Eingabe für ' + data.name + ' geöffnet. Trage die Talente und Zahlenwerte in den jeweiligen Slots ein.';
    status.classList.remove('error');
  });
  // Direkt-Link zum Eingabebereich ohne Charakterimport ermöglichen.
  if (window.location.hash === '#pet-scanner') {
    panel.scrollIntoView({block:'start'});
  }
})();