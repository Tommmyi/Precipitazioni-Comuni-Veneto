// --------------------------
// MODULI E CONFIGURAZIONE
// --------------------------
const fetch = require("node-fetch");
const fs = require("fs/promises");
const path = require("path");

// Percorso del file che rappresenta le coordinateComuni.json
const FILE_COORDINATE = path.resolve(__dirname, "../data/coordinateComuni.json");


// Funzione che normalizza il nome di un comune:
// trim() rimuove eventuali spazi, split() separa le parole composte e rende la prima lettera Maiuscola con Upper() e le altre in minuscolo 
// Es.: "fiRenZe  " → "Firenze"
function normalizzaComune(nome) {
  return nome
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0].toUpperCase() + parte.slice(1).toLowerCase())
    .join(" ");
}


// Funzione fondamentale che richiama l'API Nominatim di OpenStreetMap per ottenere le coordinate di un comune
// restituendo la sua latitudine e longitudine dei comuni Italiani
async function ottieniCoordinateDaAPI(comune) {
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&limit=1&q=${encodeURIComponent(comune + ", Italia")}`;
  console.log(`→ API: cerco coordinate per “${comune}”`);

  try {
    const risposta = await fetch(url, {
      headers: { "User-Agent": "MappaPrecipitazioni/1.0" },
    });
    // Se la risposta HTTP è diversa da 200 allora genera eccezione
    if (!risposta.ok) 
      throw new Error(`HTTP ${risposta.status}`);
    
    //Altrimenti mette la risposta in un formato json 
    const dati = await risposta.json();

    // Se il comune non viene trovato nel territorio Italiano
    if (!dati[0]) {
      console.warn(`↳ Nessun risultato per “${comune}”`);
      return null;
    }

    const lat = parseFloat(dati[0].lat);
    const lon = parseFloat(dati[0].lon);
    console.log(`→ Coordinate trovate per “${comune}”: lat=${lat}, lon=${lon}`);
    return [lat, lon];
  } catch (err) {
    console.error(`‼ Errore API per “${comune}”: ${err.message}`);
    return null;
  }
}

//Assicura che il JSON delle coordinate contenga il comune richiesto.
//Se il file non esiste, lo crea e se il comune è già presente, restituisce subito le sue coordinate.

async function assicuratiCoordinateComune(rawName) {
  const comune = normalizzaComune(rawName);
  console.log(`\n[AGGIORNA_COORDINATE] Elaborazione per: ${comune}`);

  // 0) Se il file non esiste, viene creato vuoto
  try {
    await fs.access(FILE_COORDINATE);
  } catch {
    console.log(`[GEO] File non trovato, lo creo vuoto in: ${FILE_COORDINATE}`);
    await fs.writeFile(FILE_COORDINATE, "{}", "utf8");
  }

  // 1) Legge JSON delle cordinate e espone errore in caso di errore lettura
  let db;
  try {
    const testo = await fs.readFile(FILE_COORDINATE, "utf8");
    db = JSON.parse(testo);
  } catch (err) {
    console.error("Errore lettura file JSON coordinate:", err);
    throw err;
  }

  // 2) Se esiste già il file, restituisci subito le coordinate del comune
  if (db[comune]) {
    console.log(`· “${comune}” già presente nel file →`, db[comune]);
    return db[comune];
  }

  // 3) Altrimenti chiama l’API per trovarla
  const coords = await ottieniCoordinateDaAPI(comune);
  if (!coords) {
    console.warn(`· Coordinate non trovate per “${comune}”.`);
    return null;
  }

  // 4) Aggiungi ed salva le coordinate nel file JSON con la funzione write
  db[comune] = coords;
  try {
    await fs.writeFile(FILE_COORDINATE, JSON.stringify(db, null, 2), "utf8");
    console.log(`· Coordinate salvate per “${comune}” in ${FILE_COORDINATE}`);
  } catch (err) {
    console.error("Errore scrittura file JSON coordinate:", err);
  }

  return coords;
}

module.exports = { assicuratiCoordinateComune };
