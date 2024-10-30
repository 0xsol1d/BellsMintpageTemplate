const fs = require("fs");

async function fetchAllPages(baseUrl) {
  let allInscriptions = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await fetch(`${baseUrl}&page=${currentPage}`);
    const data = await response.json();

    // Füge die Inschriften der aktuellen Seite zur Gesamtmenge hinzu
    allInscriptions = allInscriptions.concat(data.inscriptions);

    // Setze die Gesamtzahl der Seiten (wird nur beim ersten Durchlauf benötigt)
    totalPages = data.pages;
    currentPage++;
  }

  return allInscriptions;
}

function processInscriptions(inscriptions) {
  return inscriptions.map((inscription) => ({
    id: inscription.id,
    edition: 1,
  }));
}

async function main() {
  const baseUrl =
    "https://content.nintondo.io/api/pub/search?page_size=60&account=BBvRQhoH1312VQ7RuXJsMZRDJfVRzuwmne";
  const allInscriptions = await fetchAllPages(baseUrl);
  const processedData = processInscriptions(allInscriptions);

  // Um das Array als JSON-String zu erhalten
  const jsonString = JSON.stringify(processedData, null, 2);

  // Schreibe das JSON in eine Datei
  fs.writeFile("inscriptions.json", jsonString, "utf8", (err) => {
    if (err) {
      console.error("Ein Fehler ist aufgetreten:", err);
      return;
    }
    console.log('Die Datei "inscriptions.json" wurde erfolgreich erstellt.');
  });
}

main();
