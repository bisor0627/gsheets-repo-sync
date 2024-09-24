function exportAsTSV() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var tsv = convertRangeToTsvFile_(sheet);

  var GITHUB_TOKEN = getGitHubToken_(); // 토큰을 가져옴
  if (GITHUB_TOKEN) {
    commitTSVToGitHub_(tsv, GITHUB_TOKEN);
  }
}

function convertRangeToTsvFile_(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  var tsv = "";
  for (var i = 0; i < values.length; i++) {
    tsv += values[i].join("\t") + "\n"; // 쉼표 대신 탭을 사용하여 구분
  }
  return tsv;
}

function commitTSVToGitHub_(tsvContent, GITHUB_TOKEN) {
  var REPO_OWNER = "bisor0627";
  var REPO_NAME = "gsheets-repo-sync";
  var BRANCH_NAME = "main"; // 사용 중인 브랜치
  var FILE_PATH = "your/tsv/";
  var FILE_NAME = "file.tsv"; // 파일 확장자를 tsv로 변경

  var utf8Content = Utilities.newBlob(tsvContent).getBytes();
  var base64Content = Utilities.base64Encode(utf8Content);

  var url =
    "https://api.github.com/repos/" +
    encodeURIComponent(REPO_OWNER) +
    "/" +
    encodeURIComponent(REPO_NAME) +
    "/contents/" +
    FILE_PATH +
    encodeURIComponent(FILE_NAME) +
    "?ref=" +
    encodeURIComponent(BRANCH_NAME);

  Logger.log("Request URL: " + url);

  var response = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json",
    },
    muteHttpExceptions: true,
  });

  Logger.log("Response Code: " + response.getResponseCode());
  Logger.log("Response Content: " + response.getContentText());

  var sha = "";
  if (response.getResponseCode() == 200) {
    var fileData = JSON.parse(response.getContentText());
    sha = fileData.sha;
    Logger.log("파일이 존재하며 SHA 값은: " + sha);
  } else if (response.getResponseCode() == 404) {
    Logger.log("새 파일을 생성합니다.");
  } else {
    Logger.log("파일 상태 확인 실패: " + response.getContentText());
    return;
  }

  var payload = {
    message: "Update TSV file from Google Sheets",
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
    Logger.log("TSV 파일이 GitHub에 커밋되었습니다.");
  } else {
    Logger.log("TSV 커밋 실패: " + commitResponse.getContentText());
    if (
      commitResponse.getResponseCode() == 401 ||
      commitResponse.getResponseCode() == 403
    ) {
      Logger.log("잘못된 토큰입니다. 새 토큰을 입력하세요.");
      updateGitHubToken_();
      GITHUB_TOKEN = getGitHubToken_();
      commitTSVToGitHub_(tsvContent, GITHUB_TOKEN);
    }
  }
}

function getGitHubToken_() {
  var properties = PropertiesService.getUserProperties();
  var token = properties.getProperty("GITHUB_TOKEN");

  if (token) {
    var usePrevious = Browser.msgBox(
      "GitHub Token 선택",
      "이전 GitHub 토큰을 사용하시겠습니까?",
      Browser.Buttons.YES_NO
    );

    if (usePrevious == "yes") {
      Logger.log("이전 GitHub Token을 사용합니다.");
      return token;
    } else {
      updateGitHubToken_();
      return properties.getProperty("GITHUB_TOKEN");
    }
  } else {
    updateGitHubToken_();
    return properties.getProperty("GITHUB_TOKEN");
  }
}

function updateGitHubToken_() {
  var properties = PropertiesService.getUserProperties();
  var tokenInput = Browser.inputBox("새 GitHub Token을 입력하세요:");

  if (tokenInput) {
    properties.setProperty("GITHUB_TOKEN", tokenInput);
    Logger.log("새 GitHub Token이 저장되었습니다.");
  } else {
    Logger.log("GitHub Token 입력이 취소되었습니다.");
  }
}
