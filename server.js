// --------------------------
// MODULI E CONFIGURAZIONE
// --------------------------
const express = require("express");
const app = express();
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const parse = require("csv-parse");
const { assicuratiCoordinateComune } = require("./src/js/ottieniCoordinate");  //Importa la funzione presente in getCoordinate.js per avere le coordinate geografiche del comune

// --------------------------
// MIDDLEWARE CHE SERVONO PER LEGGERE I DATI JSON
// --------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Tutti i file data saranno disponibili dentro a src/data
app.use("/data",
  express.static(path.join(__dirname, "src/data"), {
    setHeaders: (res) => res.set("Cache-Control", "no-store"),
  })
);

// Cartella public dove saranno disponibili i file CSS
app.use(express.static(path.join(__dirname, "public")));

// Importa EJS che serve per rendere le pagine html in maniera visiva
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "src/pages"));

// ----------------------------------------------------------------
// ROUTE STATICHE CHE INDIRIZZANO ALLE LORO PAGINE HTML SPECIFICHE
// ----------------------------------------------------------------
app.get("/", (req, res) => res.redirect("/Home"));

app.get("/Home", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/home.html"))
);

app.get("/Precipitazioni", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/precipitazioni.html"))
);

app.get("/Ricerca", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/ricercaValori.html"))
);

app.get("/Aggiunta", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/aggiungiValori.html"))
);

app.get("/Modifica", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/modificaValori.html"))
);

app.get("/Elimina", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/eliminaValori.html"))
);

app.get("/Mappa", (req, res) =>
  res.sendFile(path.join(__dirname, "src/pages/mappa.html"))
);

// --------------------------------------------------
// LETTURA DEL FILE CSV utilizzando funzione readFile
// --------------------------------------------------

// Si utilizza async perchè la funzione readFile è asincorono e per poter leggere
// il contenuto del file in modo sequenziale si usa async e di conseguenza await
app.get("/dataVenetomm", async (req, res) => {
  const percorsoCsv = path.join(__dirname, "src/data/dataVenetomm.csv");
  try {
    const contenuto = await fsp.readFile(percorsoCsv, "utf8");
    res.type("text/plain").send(contenuto);
  } catch (err) {
    res.status(500).json({
      errore: "Impossibile leggere i dati delle precipitazioni",
      dettagli: err.message,
    });
  }
});

// ------------------------------------------------
// SCARICA INTERO CSV utilizzando funzione donwload
// ------------------------------------------------

// Qui non è necessario usato async/await perchè è un semplice download è basato su callback
/// Non ce bisogno di async/await
app.get("/scaricaCSV", (req, res) => {
  const percorsoCsv = path.join(__dirname, "src/data/dataVenetomm.csv");
  res.download(percorsoCsv, "dataVenetomm.csv", (err) => {
    if (err) {
      console.error("Errore nel download:", err);
      res.status(500).send("Impossibile scaricare il file");
    }
  });
});

// ------------------------------------------
// RESTITUISCE TUTTE LE COORDINATE DEI COMUNI
// ------------------------------------------
app.get("/coordinateComuni", (req, res) => {
  const percorsoJson = path.join(__dirname, "src/data/coordinateComuni.json");
  res.type("application/json").sendFile(percorsoJson);
});

// ------------------------------------------------------------------------
// AGGIUNTA NUOVO RECORD, AZIONE FONDAMENTALE PRESENTE NEL FORM DI AGGIUNTA
// ------------------------------------------------------------------------

app.post("/inserisci", async (req, res) => {
  const { anno, comune: rawComune, ...resto } = req.body;
  const comune = rawComune?.trim();

  // Anno e Comune obbligatori
  if (!anno || !comune) {
    return res.status(400).send("Anno e Comune sono obbligatori");
  }

  // Validazione anno: deve essere intero tra 0 e 2100
  const annoNumber = Number(anno);
  if (!Number.isInteger(annoNumber) || annoNumber < 0 || annoNumber > 2100) {
    return res.status(400).send("L'anno deve essere un intero compreso tra 0 e 2100");
  }

  // Variabile campi che contiene l'array di tutti i mesi
  const campi = [
    "gennaio","febbraio","marzo","aprile","maggio","giugno",
    "luglio","agosto","settembre","ottobre","novembre","dicembre",
    "sommaTotale",
  ];

  // Default “0” per mesi non specificati
  campi.forEach((mese) => {
    if (mese !== "sommaTotale" && !resto[mese]?.trim()) {
      resto[mese] = "0";
    }
  });

  // Validazione valori mensili: devono essere interi tra 0 e 5000 senza considerare la sommaTotale visto che la fa in automatico
  for (const mese of campi.filter((m) => m !== "sommaTotale")) {
    const val = Number(resto[mese]);
    if (!Number.isInteger(val) || val < 0 || val > 5000) {
      return res.status(400).send(`Il valore di ${mese} deve essere un intero tra 0 e 5000`);  // Messaggio visualizzato su POSTMAN
    }
  }

  // Calcolo automatico sommaTotale
  const somma = campi
    .filter((m) => m !== "sommaTotale")
    .map((m) => Number(resto[m] || 0))
    .reduce((s, v) => s + v, 0);
  resto["sommaTotale"] = somma.toString();  // Inserisce la somma finale dentro al campo sommaTotale

  // Genera la riga, composta da anno;comune;mesi;sommaTotale
  const rigaCsv = `"${anno}";"${comune}";${campi.map((m) => resto[m]).join(";")}`;

  // Path al file CSV
  const percorsoCsv = path.join(__dirname, "src", "data", "dataVenetomm.csv");

  try {
    // Se il file esiste: appendo rigaCsv + "\n"
    await fsp.access(percorsoCsv);
    await fsp.appendFile(percorsoCsv, rigaCsv + "\n", "utf8");
  } catch {
    // Se il file NON esiste: ci crea l'intestazione + rigaCsv + "\n"
    const intestazione =
      "Anno;Comune;" +
      campi.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(";") +
      "\n";
    await fsp.writeFile(percorsoCsv, intestazione + rigaCsv + "\n", "utf8");
  }

  // Assicura le coordinate del comune
  try {
    await assicuratiCoordinateComune(comune);
  } catch (err) {
    return res.status(500).json({ message: "Errore nel recupero delle coordinate del comune" });
  }

  return res.status(200).json({ message: "Record aggiunto con successo!" });
});

// ----------------------------------------------------------------
// ELIMINA RECORD, AZIONE FONDAMENTALE PRESENTE NEL FORM DI ELIMINA
// ----------------------------------------------------------------
app.delete("/elimina", (req, res) => {
  const { comune, anno } = req.body;
  
  // Verifica se l'anno e il comune sono stati selezionati
  if (!comune || !anno)
    return res.status(400).json({ message: "Comune e anno obbligatori" });

  const percorsoCsv = path.join(__dirname, "src/data/dataVenetomm.csv");
  
  // Se il file CSV non c'è, serve per vedere se ce il file dei dati csv
  if (!fs.existsSync(percorsoCsv))
    return res.status(404).json({ message: "File CSV non trovato" });

  try {    
    // La fine della riga viene aggiunto il carattere terminatore \n
    const righe = fs.readFileSync(percorsoCsv, "utf8").trim().split("\n");
    const filtrate = righe.filter((riga, i) => {
      if (i === 0)
        return true;  // La prima riga corrisponde all'intestazione
      // Controlli qui se l'anno e il comune inserite dall'utente corrisponde con quelli presenti nel csv
      const [y, c] = riga.split(";").map((s) => s.replace(/"/g, "").trim());
      return !(y === anno && c.toLowerCase() === comune.toLowerCase());
    });
    
    // Finito il filtraggio, se la lunghezza del filtro è uguale alla lunghezza delle righe quindi non è stato eliminato nulla
    if (filtrate.length === righe.length)
      return res.status(404).json({ message: "Nessun record corrispondente trovato" });

    // Altrimenti il record viene trovato ed eliminato con messaggio di conferma
    fs.writeFileSync(percorsoCsv, filtrate.join("\n") + "\n", "utf8");
    res.json({ message: "Record eliminato con successo" });
  } catch (err) {
    res.status(500).json({ message: "Errore del server" });
  }
});


// ------------------------------------------------------------------
// MODIFICA RECORD, AZIONE FONDAMENTALE PRESENTE NEL FORM DI MODIFICA
// ------------------------------------------------------------------
// Ce bisogno di async perchè l'operazione di modifica del contenuto del record 
// richiede l'apertura del file, la ricerca del record specifico e la modifica di esso richiede tempo
app.put("/modifica", async (req, res) => {
  const { comune, anno, mese, nuovaQuantita } = req.body;
  
  // Se il comune/anno/mese/nuovaQuantità non sono presenti espone messaggio di errore
  if (!comune || !anno || !mese || nuovaQuantita === undefined) {
    return res.status(400).json({ message: "Comune, anno, mese e quantità obbligatori" });
  }

  // Variabile che rappresenta l'indice di ciascun mese 
  const indiceMese = {
    gennaio: 2,
    febbraio: 3,
    marzo:   4,
    aprile:  5,
    maggio:  6,
    giugno:  7,
    luglio:  8,
    agosto:  9,
    settembre: 10,
    ottobre:   11,
    novembre: 12,
    dicembre: 13
  }[mese.toLowerCase()];

  // Se non è stato assegnato l'indice specifico al mese
  if (!indiceMese) {
    return res.status(400).json({ message: "Mese non valido" });
  }

  const percorsoCsv = path.join(__dirname, "src/data/dataVenetomm.csv");

  try {
    
    const righe = (await fsp.readFile(percorsoCsv, "utf8")).trim().split("\n");

    // Variabile inizializzata a false perchè non è stata modificata al momento
    let modificato = false;

    const nuoveRighe = righe.map((riga, idx) => {
      if (idx === 0) 
        return riga; // header

      const colonne = riga.split(";").map((s) => s.replace(/"/g, ""));

      if (colonne[0] === anno && colonne[1].toLowerCase() === comune.toLowerCase()) {
        colonne[indiceMese] = nuovaQuantita;

        // ricalcola la somma totale dei mesi presenti dalla 2–13 colonna e aggiorna la somma sull'ultima colonna 14
        const totale = colonne.slice(2, 14).reduce((sum, v) => sum + Number(v), 0);
        colonne[14] = totale;

        modificato = true;
      }

      return colonne.map((val, i) => (i <= 1 ? `"${val}"` : val)).join(";");
    });

    // Se il valore non è stato modificato espone messaggio 
    if (!modificato) {
      return res.status(404).json({ message: "Record non trovato" });
    }

    await fsp.writeFile(percorsoCsv,nuoveRighe.join("\n") + "\n","utf8");

    res.json({ message: "Valore e totale ricalcolati con successo" });
    
  } catch (err) {
    console.error("Errore modifica:", err);
    res.status(500).json({ message: "Errore del server" });
  }
});


// --------------------------
// AVVIO DEL SERVER
// --------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server avviato sulla porta ${PORT}`));
