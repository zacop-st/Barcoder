async function loadIndex() {
  const response = await fetch("index.json.gz"); // index dosyanı buraya koy
  const blob = await response.blob();
  const text = await blob.text();
  return JSON.parse(text);
}

async function searchByBarkod() {
  const barkod = document.getElementById("barkodInput").value;
  const index = await loadIndex();

  // index dosyasında hangi parçaya düşüyor bul
  const fileInfo = index.find(item => barkod >= item["2. Satır (A)"] && barkod <= item["Son Satır (A)"]);
  if (!fileInfo) {
    alert("Bulunamadı");
    return;
  }

  // ilgili parçayı yükle
  const response = await fetch(`JsonCikti/${fileInfo["Dosya Adı"].replace(".xlsx",".json.gz")}`);
  const blob = await response.blob();
  const text = await blob.text();
  const data = JSON.parse(text);

  const result = data.find(row => row.A == barkod);
  if (result) renderCard(result);
}

function renderCard(row) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>${row["Ürün Adı"]}</h2>
    <svg id="barcode"></svg>
    <p>Barkod: ${row["Barkod"]}</p>
    <p>Mal No: ${row["Mal No"]}</p>
    <p>Kategori: ${row["Kategori No"]} - ${row["Kategori Adı"]}</p>
    <p>Aile: ${row["Aile No"]} - ${row["Aile Adı"]}</p>
    <p>Alt Aile: ${row["Alt Aile No"]} - ${row["Alt Aile Adı"]}</p>
    <p>Ürün Grup: ${row["Ürün Grup No"]} - ${row["Ürün Grup Adı"]}</p>
    <div class="inputs">
      <input type="number" placeholder="Depo giriş">
      <button>Ekle</button>
      <input type="number" placeholder="Mağaza giriş">
      <button>Ekle</button>
    </div>
  `;

  container.appendChild(card);

  JsBarcode("#barcode", row["Barkod"], {format: "EAN13"});
}
