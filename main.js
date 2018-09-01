function checkAPISupport() {
  // File API サポートの確認.
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    alert(
      "ブラウザがFile APIをサポートしていないようです。最新バージョンのGoogle Chromeなどのブラウザを使用してください。"
    );
  }
}

function getDataFromCSV(evt, dataName) {
  return new Promise(function(resolve, reject) {
    var csvFile = evt.target.files[0];

    var reader = new FileReader();

    reader.onerror = function() {
      alert("" + dataName + "のファイル読み取りに失敗しました");
      reject();
    };

    reader.onload = function() {
      // 行単位の配列
      var arryLine = reader.result.split("\n");
      // 二次元配列
      var arryResult = [];

      for (var i = 0; i < arryLine.length; i++) {
        //空白行で終了
        if (arryLine[i] == "") {
          break;
        }

        //","ごとに配列化
        arryResult[i] = arryLine[i].split(",");
        for (let j = 0; j < arryResult[i].length; j++) {
          arryResult[i][j] = arryResult[i][j].replace(/"|#/g, "");
        }
      }
      resolve(arryResult);
    };

    // ファイル読み取りを実行
    reader.readAsText(csvFile, "Shift_JIS");
  });
}

function controlActivity(flg) {
  var valKateigomi = $("#inptKateigomi").val();
  var valOgatagomi = $("#inptOgatagomi").val();
  var valChomei = $("#inptChomei").val();

  if (
    valKateigomi !== undefined &&
    valKateigomi !== "" &&
    valKateigomi !== null &&
    (valOgatagomi !== undefined &&
      valOgatagomi !== "" &&
      valOgatagomi !== null) &&
    (valChomei !== undefined && valChomei !== "" && valChomei !== null)
  ) {
    $("#btnUpload").prop("disabled", false);
  } else {
    $("#btnUpload").prop("disabled", true);
  }

  $("#slctChomei").prop("disabled", !flg);

  if ($("#slctChomei").val() === "") {
    $("#btnGenerate").prop("disabled", false);
  } else {
    $("#btnGenerate").prop("disabled", !flg);
  }
}

var HIROSHIMAGOMISUTECSV = {};

HIROSHIMAGOMISUTECSV.kateigomiData = null;
HIROSHIMAGOMISUTECSV.OgatagomiData = null;
HIROSHIMAGOMISUTECSV.ChomeiData = null;

$(window).on("load", function() {
  checkAPISupport();
  HIROSHIMAGOMISUTECSV.kateigomiData = null;
  HIROSHIMAGOMISUTECSV.OgatagomiData = null;
  HIROSHIMAGOMISUTECSV.ChomeiData = null;
  $("#inptKateigomi").val(null);
  $("#inptOgatagomi").val(null);
  $("#inptChomei").val(null);
  controlActivity(false);
  $("#downloadLink").attr("href", "#");
});

$("#inptKateigomi").on("change", async function(event) {
  $("#slctChomei").empty();
  $("#btnGenerate").prop("disabled", true);
  controlActivity(false);
  HIROSHIMAGOMISUTECSV.kateigomiData = await getDataFromCSV(
    event,
    "家庭ごみ収集日"
  );
});

$("#inptOgatagomi").on("change", async function(event) {
  $("#slctChomei").empty();
  $("#btnGenerate").prop("disabled", true);
  controlActivity(false);
  HIROSHIMAGOMISUTECSV.OgatagomiData = await getDataFromCSV(
    event,
    "大型ごみ収集日"
  );
});

$("#inptChomei").on("change", async function(event) {
  $("#slctChomei").empty();
  $("#btnGenerate").prop("disabled", true);
  controlActivity(false);
  HIROSHIMAGOMISUTECSV.ChomeiData = await getDataFromCSV(event, "町名");
});

$("#btnUpload").on("click", function() {
  controlActivity(true);
  $("#slctChomei").empty();
  var $option;
  for (let i = 1; i < HIROSHIMAGOMISUTECSV.ChomeiData.length; i++) {
    $option = $("<option>")
      .val(HIROSHIMAGOMISUTECSV.ChomeiData[i][2])
      .text(HIROSHIMAGOMISUTECSV.ChomeiData[i][0]);
    $("#slctChomei").append($option);
  }
});

$(document).on("click", "#btnGenerate", function() {
  var selectedNum = $("#slctChomei").val();
  var generatedData = [["Subject", "Start Date", "All Day Event"]];
  var rowVal = 0;
  for (let i = 0; i < HIROSHIMAGOMISUTECSV.kateigomiData[0].length; i++) {
    if (
      parseInt(HIROSHIMAGOMISUTECSV.kateigomiData[0][i], 10) ===
      parseInt(selectedNum, 10)
    ) {
      rowVal = i;
      break;
    }
  }
  var gomiName = "";
  for (let j = 1; j < HIROSHIMAGOMISUTECSV.kateigomiData.length; j++) {
    if (HIROSHIMAGOMISUTECSV.kateigomiData[j][rowVal] !== "") {
      gomiName = HIROSHIMAGOMISUTECSV.kateigomiData[j][rowVal];
      if (gomiName === "リプラ") {
        generatedData.push([
          "ペットボトル",
          HIROSHIMAGOMISUTECSV.kateigomiData[j][0],
          "TRUE"
        ]);
      }
      if (gomiName === "資源") {
        generatedData.push([
          "有害",
          HIROSHIMAGOMISUTECSV.kateigomiData[j][0],
          "TRUE"
        ]);
      }
      generatedData.push([
        gomiName,
        HIROSHIMAGOMISUTECSV.kateigomiData[j][0],
        "TRUE"
      ]);
    }
  }
  var rowValOgata = 0;
  for (let i = 0; i < HIROSHIMAGOMISUTECSV.OgatagomiData[0].length; i++) {
    if (
      parseInt(HIROSHIMAGOMISUTECSV.OgatagomiData[0][i], 10) ===
      parseInt(selectedNum, 10)
    ) {
      rowValOgata = i;
      break;
    }
  }
  for (let j = 1; j < HIROSHIMAGOMISUTECSV.OgatagomiData.length; j++) {
    if (HIROSHIMAGOMISUTECSV.OgatagomiData[j][rowValOgata] !== "") {
      generatedData.push([
        HIROSHIMAGOMISUTECSV.OgatagomiData[j][rowValOgata],
        HIROSHIMAGOMISUTECSV.OgatagomiData[j][0],
        "TRUE"
      ]);
    }
  }

  var bom = new Uint8Array([0xef, 0xbb, 0xbf]);

  var csvData = generatedData
    .map(function(l) {
      return l.join(",");
    })
    .join("\r\n");

  var blob = new Blob([bom, csvData], {
    type: "text/csv"
  });

  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, "GomiCalendar.csv");
    window.navigator.msSaveOrOpenBlob(blob, "GomiCalendar.csv");
  } else {
    var $downloadLink = $("#downloadLink");
    $downloadLink.attr("href", window.URL.createObjectURL(blob));
    $downloadLink[0].click();
  }
});
