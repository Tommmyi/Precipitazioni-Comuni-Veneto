# Precipitazioni Veneto 2022/2023 ☔

Questo progetto include uno script server Node.js e una serie di pagine web che permettono di consultare i dati sulle precipitazioni (in mm) registrate nei comuni della regione Veneto durante il biennio 2022/2023.  
L’utente può visualizzare i dati aggregati, effettuare ricerche per anno o comune e visualizzare statistiche attraverso un’interfaccia web semplice e intuitiva.

[Node.js](https://nodejs.org/en/about/) è un ambiente di esecuzione popolare che consente di eseguire JavaScript lato server. Questo progetto utilizza [Express.js](https://expressjs.com/) per gestire le rotte e servire i contenuti web statici.

_Last updated: 27 Maggio 2025_

## Prerequisites

Per ottenere il massimo da questo progetto, è consigliabile avere familiarità con JavaScript, HTML e CSS. Anche se il codice JavaScript gira lato server (e non nel browser), la sintassi è la stessa del JavaScript classico.

## What's in this project?

← `README.md`: Questo file, dove spieghiamo cos’è il progetto e come funziona.

← `public/style.css`: Lo stile condiviso per le varie pagine del sito.

← `public/home.css`: Stile personalizzato per la homepage.

← `server.js`: Il server Node.js del sito. Questo file definisce le rotte per servire le pagine HTML, caricare i dati dal CSV ed eseguire filtraggi per anno e comune.

← `package.json`: Contiene le dipendenze e gli script npm del progetto.

← `src/`: Cartella che contiene le pagine HTML e i file di dati.

← `src/pages/Home.html`: La homepage del sito.

← `src/pages/Precipitazioni.html`: Visualizza tutti i dati sulle precipitazioni aggregate.

← `src/pages/RicercaValori.html`: Permette la ricerca di dati per anno e comune.

← `src/pages/dataVenetomm.csv`: Il dataset delle precipitazioni nei comuni veneti (2022/2023).

← `src/pages/seo.json`: File per la configurazione SEO del sito.

## Try this next 🏗️

Dai un’occhiata al file `TODO.md` per i prossimi miglioramenti da implementare!

**_Vuoi partire da un progetto Node.js minimal per crearne uno tuo? Dai un’occhiata a [Blank Node](https://glitch.com/edit/#!/remix/glitch-blank-node)!_**

![Glitch](https://cdn.glitch.com/a9975ea6-8949-4bab-addb-8a95021dc2da%2FLogo_Color.svg?v=1602781328576)

## You built this with Glitch!

[Glitch](https://glitch.com) è una community dove milioni di persone costruiscono insieme app e siti web.

- Serve aiuto? [Consulta il nostro Help Center](https://help.glitch.com/) per risposte alle domande più comuni.
- Vuoi rendere il progetto ufficiale? [Diventa membro premium](https://glitch.com/pricing) per ottenere condivisione privata, più memoria, dominio personalizzato e altro ancora.

