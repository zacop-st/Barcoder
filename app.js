// Index dosyasını yükle
async function loadIndex() {
  const response = await fetch("JsonCikti/_barkod_index.json.gz");
  const blob = await response.blob();
  const text = await blob.text();
  return JSON.parse(text);
}

// Barkod arama
async function searchByBarkod() {
  const barkod = document.getElementById("barkodInput").value;
  const index = await loadIndex();

  const fileInfo = index.find(item =>
    barkod >= item["2. Satır (A)"] && barkod <= item["Son Satır (A)"]
  );
  if (!fileInfo) {
    alert("Barkod bulunamadı");
    return;
  }

  await loadFileAndSearch(fileInfo["Dosya Adı"].replace(".xlsx",".json.gz"), "Barkod", barkod);
}

// Mal No arama
async function searchByMalNo() {
  const malno = document.getElementById("malnoInput").value;
  const index = await loadIndex();

  const fileInfo = index.find(item =>
    malno >= item["2. Satır (A)"] && malno <= item["Son Satır (A)"]
  );
  if (!fileInfo) {
    alert("Mal No bulunamadı");
    return;
  }

  await loadFileAndSearch(fileInfo["Dosya Adı"].replace(".xlsx",".json.gz"), "Mal No", malno);
}

// Ortak dosya yükleme + arama
async function loadFileAndSearch(fileName, field, value) {
  const response = await fetch(`JsonCikti/${fileName}`);
  const blob = await response.blob();
  const text = await blob.text();
  const data = JSON.parse(text);

  const result = data.find(row => row[field] == value);
  if (result) renderCard(result);
}

// Kart render
function renderCard(row) {
  const container = document.getElementById("results");
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>${row["Ürün Adı"]}</h2>
    <svg id="barcode-${row["Barkod"]}"></svg>
    <p><b>Barkod:</b> ${row["Barkod"]}</p>
    <p><b>Mal No:</b> ${row["Mal No"]}</p>
    <p><b>Kategori:</b> ${row["Kategori No"]} - ${row["Kategori Adı"]}</p>
    <p><b>Aile:</b> ${row["Aile No"]} - ${row["Aile Adı"]}</p>
    <p><b>Alt Aile:</b> ${row["Alt Aile No"]} - ${row["Alt Aile Adı"]}</p>
    <p><b>Ürün Grup:</b> ${row["Ürün Grup No"]} - ${row["Ürün Grup Adı"]}</p>
    <div class="inputs">
      <input type="number" placeholder="Depo giriş">
      <button>Ekle</button>
      <input type="number" placeholder="Mağaza giriş">
      <button>Ekle</button>
    </div>
  `;

  container.appendChild(card);

  JsBarcode(`#barcode-${row["Barkod"]}`, row["Barkod"], {format: "EAN13"});
}

// --------------------
// Filtreleme Zinciri
// --------------------
let kategoriData = {}; // Kategoriye göre JSON cache

async function loadKategoriOptions() {
  // Örnek: kategori listesi sabit veya index.json.gz’den dinamik doldurulabilir
  const kategoriSelect = document.getElementById("kategoriSelect");
  ["100","101","102","200","300"].forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    kategoriSelect.appendChild(opt);
  });
}

async function loadAileOptions() {
  const kategori = document.getElementById("kategoriSelect").value;
  if (!kategori) return;

  const response = await fetch(`JsonCikti/${kategori}.json.gz`);
  const blob = await response.blob();
  const text = await blob.text();
  const data = JSON.parse(text);
  kategoriData[kategori] = data;

  const aileSelect = document.getElementById("aileSelect");
  aileSelect.innerHTML = "<option value=''>--Aile seç--</option>";

  const aileSet = new Set(data.map(row => row["Aile No"]));
  aileSet.forEach(aile => {
    const opt = document.createElement("option");
    opt.value = aile;
    opt.textContent = aile;
    aileSelect.appendChild(opt);
  });
}

function loadAltAileOptions() {
  const kategori = document.getElementById("kategoriSelect").value;
  const aile = document.getElementById("aileSelect").value;
  if (!kategori || !aile) return;

  const data = kategoriData[kategori].filter(row => row["Aile No"] == aile);

  const altAileSelect = document.getElementById("altAileSelect");
  altAileSelect.innerHTML = "<option value=''>--Alt Aile seç--</option>";

  const altSet = new Set(data.map(row => row["Alt Aile No"]));
  altSet.forEach(alt => {
    const opt = document.createElement("option");
    opt.value = alt;
    opt.textContent = alt;
    altAileSelect.appendChild(opt);
  });
}

function loadUrunGrupOptions() {
  const kategori = document.getElementById("kategoriSelect").value;
  const aile = document.getElementById("aileSelect").value;
  const altAile = document.getElementById("altAileSelect").value;
  if (!kategori || !aile || !altAile) return;

  const data = kategoriData[kategori].filter(row => row["Aile No"] == aile && row["Alt Aile No"] == altAile);

  const urunGrupSelect = document.getElementById("urunGrupSelect");
  urunGrupSelect.innerHTML = "<option value=''>--Ürün Grup seç--</option>";

  const grupSet = new Set(data.map(row => row["Ürün Grup No"]));
  grupSet.forEach(grup => {
    const opt = document.createElement("option");
    opt.value = grup;
    opt.textContent = grup;
    urunGrupSelect.appendChild(opt);
  });
}

function searchByFilters() {
  const kategori = document.getElementById("kategoriSelect").value;
  const aile = document.getElementById("aileSelect").value;
  const altAile = document.getElementById("altAileSelect").value;
  const grup = document.getElementById("urunGrupSelect").value;

  if (!kategori) return;

  let data = kategoriData[kategori