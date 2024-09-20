function exportAsCSV() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var csv = convertRangeToCsvFile_(sheet);

  commitCSVToGitHub_(csv);
}

function convertRangeToCsvFile_(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  var csv = "";
  for (var i = 0; i < values.length; i++) {
    csv += values[i].join(",") + "\n";
  }
  return csv;
}

function commitCSVToGitHub_(csvContent) {
  // Token 및 기본 설정을 PropertiesService로 가져옴
  var properties = PropertiesService.getScriptProperties();
  var GITHUB_TOKEN = properties.getProperty("GITHUB_TOKEN");
  var REPO_OWNER = properties.getProperty("REPO_OWNER");
  var REPO_NAME = properties.getProperty("REPO_NAME");
  var BRANCH_NAME = properties.getProperty("BRANCH_NAME");
  var FILE_PATH = properties.getProperty("FILE_PATH");
  var FILE_NAME = properties.getProperty("FILE_NAME");
  // CSV 내용을 UTF-8로 변환 및 Base64 인코딩
  var utf8Content = Utilities.newBlob(csvContent).getBytes();
  var base64Content = Utilities.base64Encode(utf8Content);

  // GitHub API URL
  var url =
    "https://api.github.com/repos/" +
    REPO_OWNER +
    "/" +
    REPO_NAME +
    "/contents/" +
    FILE_PATH +
    FILE_NAME;

  // 파일 상태 확인 (GET 요청)
  var response = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json",
    },
    muteHttpExceptions: true,
  });

  var sha = "";
  if (response.getResponseCode() == 200) {
    var fileData = JSON.parse(response.getContentText());
    sha = fileData.sha; // 파일이 존재하면 SHA 값을 가져옴
  }

  // GitHub API에 파일 업로드 (커밋) 요청
  var payload = {
    message: "Update CSV file from Google Sheets",
    content: base64Content,
    branch: BRANCH_NAME,
  };

  if (sha) {
    payload.sha = sha;
  }

  var options = {
    method: "PUT",
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json",
    },
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  var commitResponse = UrlFetchApp.fetch(url, options);

  if (
    commitResponse.getResponseCode() == 201 ||
    commitResponse.getResponseCode() == 200
  ) {
    Logger.log("CSV 파일이 GitHub에 커밋되었습니다.");
  } else {
    Logger.log("CSV 커밋 실패: " + commitResponse.getContentText());
  }
}
