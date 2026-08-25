/**
 * HiroshimaGomiSute - iCalendar (.ics) Generator
 * ECMAScript 2025/2026 Modern Vanilla JS Implementation
 */

/** @type {Readonly<Record<string, { name: string, katei: string, ogata: string, chomei: string }>>} */
const WARD_MAP = Object.freeze({
  naka: { name: "中区", katei: "1-1家庭ごみ収集日（中区）.csv", ogata: "1-1大型ごみ収集日（中区）.csv", chomei: "3-1中区町名.csv" },
  higashi: { name: "東区", katei: "1-2家庭ごみ収集日（東区）.csv", ogata: "1-2大型ごみ収集日（東区）.csv", chomei: "3-2東区町名.csv" },
  minami: { name: "南区", katei: "1-3家庭ごみ収集日（南区）.csv", ogata: "1-3大型ごみ収集日（南区）.csv", chomei: "3-3南区町名.csv" },
  nishi: { name: "西区", katei: "1-4家庭ごみ収集日（西区）.csv", ogata: "1-4大型ごみ収集日（西区）.csv", chomei: "3-4西区町名.csv" },
  asaminami: { name: "安佐南区", katei: "1-5家庭ごみ収集日（安佐南区）.csv", ogata: "1-5大型ごみ収集日（安佐南区）.csv", chomei: "3-5安佐南区町名.csv" },
  asakita: { name: "安佐北区", katei: "1-6家庭ごみ収集日（安佐北区）.csv", ogata: "1-6大型ごみ収集日（安佐北区）.csv", chomei: "3-6安佐北区町名.csv" },
  aki: { name: "安芸区", katei: "1-7家庭ごみ収集日（安芸区）.csv", ogata: "1-7大型ごみ収集日（安芸区）.csv", chomei: "3-7安芸区町名.csv" },
  saeki: { name: "佐伯区", katei: "1-8家庭ごみ収集日（佐伯区）.csv", ogata: "1-8大型ごみ収集日（佐伯区）.csv", chomei: "3-8佐伯区町名.csv" }
});

const dataStore = {
  kateigomiData: null,
  OgatagomiData: null,
  ChomeiData: null
};

/**
 * CSVテキストを2次元配列にパースする
 * @param {string} text 
 * @returns {string[][]}
 */
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  for (const line of lines) {
    if (line === "") break;
    result.push(line.split(",").map((cell) => cell.replaceAll(/["#]/g, "")));
  }
  return result;
}

/**
 * CSVファイルを非同期取得する
 * @param {string} fileName 
 * @returns {Promise<string[][]>}
 */
async function fetchCSV(fileName) {
  const response = await fetch(`data/csv/${encodeURIComponent(fileName)}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseCSV(text);
}

/**
 * 日付文字列から DTSTART (YYYYMMDD) と DTEND (翌日 YYYYMMDD) を算出
 * @param {string} dateStr 
 * @returns {{ dtstart: string, dtend: string } | null}
 */
function getStartAndEndDates(dateStr) {
  const cleanStr = dateStr.replaceAll(/[^0-9]/g, "");
  if (cleanStr.length !== 8) return null;

  const year = Number.parseInt(cleanStr.slice(0, 4), 10);
  const month = Number.parseInt(cleanStr.slice(4, 6), 10) - 1;
  const day = Number.parseInt(cleanStr.slice(6, 8), 10);

  const startDate = new Date(year, month, day);
  const endDate = new Date(year, month, day + 1);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${date}`;
  };

  return {
    dtstart: formatDate(startDate),
    dtend: formatDate(endDate)
  };
}

/**
 * イベント情報配列から iCalendar (.ics) テキスト形式文字列を生成する
 * @param {Array<{ summary: string, dateStr: string }>} events 
 * @returns {string}
 */
function generateICS(events) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HiroshimaGomiSute//JA",
    "CALSCALE:GREGORIAN"
  ];

  for (const evt of events) {
    const dates = getStartAndEndDates(evt.dateStr);
    if (!dates) continue;

    lines.push(
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${dates.dtstart}`,
      `DTEND;VALUE=DATE:${dates.dtend}`,
      `SUMMARY:${evt.summary}`,
      "DESCRIPTION:ごみ出しカレンダー",
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * 区の選択肢が変更された時のハンドラー
 * @param {Event} event 
 */
async function handleWardChange(event) {
  const selectWard = /** @type {HTMLSelectElement} */ (event.target);
  const selectChomei = /** @type {HTMLSelectElement} */ (document.querySelector("#slctChomei"));
  const btnGenerate = /** @type {HTMLButtonElement} */ (document.querySelector("#btnGenerate"));

  const wardKey = selectWard.value;

  selectChomei.disabled = true;
  btnGenerate.disabled = true;
  selectChomei.replaceChildren();

  if (!wardKey || !(wardKey in WARD_MAP)) {
    selectChomei.options.add(new Option("先に区を選択してください", ""));
    return;
  }

  selectChomei.options.add(new Option("データを読み込み中...", ""));

  try {
    const info = WARD_MAP[wardKey];
    const [katei, ogata, chomei] = await Promise.all([
      fetchCSV(info.katei),
      fetchCSV(info.ogata),
      fetchCSV(info.chomei)
    ]);

    dataStore.kateigomiData = katei;
    dataStore.OgatagomiData = ogata;
    dataStore.ChomeiData = chomei;

    selectChomei.replaceChildren();
    selectChomei.options.add(new Option("町名を選択してください", ""));

    for (let i = 1; i < chomei.length; i++) {
      const row = chomei[i];
      if (row?.[0] && row?.[2]) {
        selectChomei.options.add(new Option(row[0], row[2]));
      }
    }

    selectChomei.disabled = false;
  } catch (err) {
    console.error("CSV loading error:", err);
    alert("ごみ収集日データの読み込みに失敗しました。時間をおいて再度お試しください。");
    selectChomei.replaceChildren();
    selectChomei.options.add(new Option("データの読み込みに失敗しました", ""));
  }
}

/**
 * 町名の選択肢が変更された時のハンドラー
 * @param {Event} event 
 */
function handleChomeiChange(event) {
  const selectChomei = /** @type {HTMLSelectElement} */ (event.target);
  const btnGenerate = /** @type {HTMLButtonElement} */ (document.querySelector("#btnGenerate"));
  btnGenerate.disabled = !selectChomei.value;
}

/**
 * カレンダー生成・ダウンロードボタンのクリックハンドラー
 */
function handleGenerate() {
  const selectChomei = /** @type {HTMLSelectElement} */ (document.querySelector("#slctChomei"));
  const selectedNum = selectChomei.value;

  if (!selectedNum || !dataStore.kateigomiData || !dataStore.OgatagomiData) {
    return;
  }

  const events = [];

  // 家庭ごみデータ抽出
  let rowVal = 0;
  const kateiHeader = dataStore.kateigomiData[0];
  for (let i = 0; i < kateiHeader.length; i++) {
    if (Number.parseInt(kateiHeader[i], 10) === Number.parseInt(selectedNum, 10)) {
      rowVal = i;
      break;
    }
  }

  for (let j = 1; j < dataStore.kateigomiData.length; j++) {
    const row = dataStore.kateigomiData[j];
    const dateStr = row[0];
    const gomiName = row[rowVal];
    if (gomiName) {
      if (gomiName === "リプラ") {
        events.push({ summary: "ペットボトル", dateStr });
      }
      if (gomiName === "資源") {
        events.push({ summary: "有害", dateStr });
      }
      events.push({ summary: gomiName, dateStr });
    }
  }

  // 大型ごみデータ抽出
  let rowValOgata = 0;
  const ogataHeader = dataStore.OgatagomiData[0];
  for (let i = 0; i < ogataHeader.length; i++) {
    if (Number.parseInt(ogataHeader[i], 10) === Number.parseInt(selectedNum, 10)) {
      rowValOgata = i;
      break;
    }
  }

  for (let j = 1; j < dataStore.OgatagomiData.length; j++) {
    const row = dataStore.OgatagomiData[j];
    const dateStr = row[0];
    const gomiNameOgata = row[rowValOgata];
    if (gomiNameOgata) {
      events.push({ summary: gomiNameOgata, dateStr });
    }
  }

  // iCalendar (.ics) テキスト生成
  const icsData = generateICS(events);

  // Blob 作成
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const fileName = "GomiCalendar.ics";

  // ダウンロードリンクの動的生成と自動クリーンアップ
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  
  // メモリ解放
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

// DOM構築完了後にイベントを登録
document.addEventListener("DOMContentLoaded", () => {
  const selectWard = document.querySelector("#slctWard");
  const selectChomei = document.querySelector("#slctChomei");
  const btnGenerate = document.querySelector("#btnGenerate");

  selectWard?.addEventListener("change", handleWardChange);
  selectChomei?.addEventListener("change", handleChomeiChange);
  btnGenerate?.addEventListener("click", handleGenerate);
});
