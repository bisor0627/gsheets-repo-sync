function exportAsXML() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var xmlContent = convertRangeToXMLFile_(sheet);

  var GITHUB_TOKEN = getGitHubToken_(); // 토큰을 가져옴
  if (GITHUB_TOKEN) {
    commitXMLToGitHub_(xmlContent, GITHUB_TOKEN);
  }
}

// Google Sheets 데이터를 XML로 변환
function convertRangeToXMLFile_(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0]; // str, en_US, ar_DZ, de_DE, etc.

  // XML 시작
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<langs>\n';

  // 각 언어별로 데이터 처리
  for (var col = 2; col < headers.length; col++) {
    var langCode = headers[col];
    xml += `  <${langCode}>\n`;

    // 트리 구조를 위한 빈 객체 생성
    var tree = {};

    // 행(row) 순회
    for (var row = 1; row < data.length; row++) {
      var keyParts = data[row][0].split("."); // '.'을 기준으로 분리하여 트리 생성
      var value = data[row][col];

      // 트리에 키와 값을 삽입
      insertIntoTree(tree, keyParts, value);
    }

    // 트리를 XML로 변환
    xml += treeToXML(tree, "    ");

    xml += `  </${langCode}>\n`;
  }

  xml += "</langs>";
  return xml;
}

function insertIntoTree(tree, keyParts, value) {
  var current = tree;
  for (var i = 0; i < keyParts.length; i++) {
    var part = keyParts[i];
    if (!current[part]) {
      current[part] = i === keyParts.length - 1 ? value : {};
    }
    current = current[part];
  }
}

function treeToXML(tree, indent) {
  var xml = "";
  for (var key in tree) {
    if (typeof tree[key] === "object") {
      xml += `${indent}<${key}>\n`;
      xml += treeToXML(tree[key], indent + "  ");
      xml += `${indent}</${key}>\n`;
    } else {
      xml += `${indent}<${key}>${tree[key]}</${key}>\n`;
    }
  }
  return xml;
}

// GitHub에 XML 파일 커밋
function commitXMLToGitHub_(xmlContent, GITHUB_TOKEN) {
  var REPO_OWNER = "bisor0627";
  var REPO_NAME = "gsheets-repo-sync";
  var BRANCH_NAME = "main"; // 사용 중인 브랜치
  var FILE_PATH = "assets/";
  var FILE_NAME = "translations.xml"; // XML 파일명으로 변경

  var utf8Content = Utilities.newBlob(xmlContent).getBytes();
  var base64Content = Utilities.base64Encode(utf8Content);

  // 브랜치를 ref 쿼리 매개 변수로 추가
  var url =
    "https://api.github.com/repos/" +
    encodeURIComponent(REPO_OWNER) +
    "/" +
    encodeURIComponent(REPO_NAME) +
    "/contents/" +
    FILE_PATH +
    encodeURIComponent(FILE_NAME) +
    "?ref=" +
    encodeURIComponent(BRANCH_NAME); // 브랜치 추가

  // 파일 상태 확인 (GET 요청)
  var response = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json",
    },
    muteHttpExceptions: true, // 예외 발생 시 전체 응답 확인
  });

  Logger.log("Response Code: " + response.getResponseCode());
  Logger.log("Response Content: " + response.getContentText());

  var sha = "";
  if (response.getResponseCode() == 200) {
    // 파일이 존재하는 경우 SHA 값을 가져옴
    var fileData = JSON.parse(response.getContentText());
    sha = fileData.sha;
    Logger.log("파일이 존재하며 SHA 값은: " + sha);
  } else if (response.getResponseCode() == 404) {
    // 파일이 존재하지 않으면 새로 생성 (sha 없이)
    Logger.log("새 파일을 생성합니다.");
  } else {
    Logger.log("파일 상태 확인 실패: " + response.getContentText());
    return;
  }

  // 파일을 업데이트하거나 새로 생성할 수 있도록 요청
  var payload = {
    message: "Update XML file from Google Sheets",
    content: base64Content,
    branch: BRANCH_NAME,
  };

  // sha가 존재하면 파일을 업데이트할 때 추가
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

  // GitHub에 파일 업데이트/생성 요청
  var commitResponse = UrlFetchApp.fetch(url, options);

  if (
    commitResponse.getResponseCode() == 201 ||
    commitResponse.getResponseCode() == 200
  ) {
    Logger.log("XML 파일이 GitHub에 커밋되었습니다.");
  } else {
    Logger.log("XML 커밋 실패: " + commitResponse.getContentText());
    if (
      commitResponse.getResponseCode() == 401 ||
      commitResponse.getResponseCode() == 403
    ) {
      Logger.log("잘못된 토큰입니다. 새 토큰을 입력하세요.");
      updateGitHubToken_(); // 새 토큰 입력
      GITHUB_TOKEN = getGitHubToken_();
      commitXMLToGitHub_(xmlContent, GITHUB_TOKEN);
    }
  }
}
function getGitHubToken_() {
  var properties = PropertiesService.getUserProperties();
  var token = properties.getProperty("GITHUB_TOKEN");

  if (token) {
    // 이전 토큰을 사용할지 물어봄
    var usePrevious = Browser.msgBox(
      "GitHub Token 선택",
      "이전 GitHub 토큰을 사용하시겠습니까?",
      Browser.Buttons.YES_NO
    );

    if (usePrevious == "yes") {
      Logger.log("이전 GitHub Token을 사용합니다.");
      return token;
    } else {
      updateGitHubToken_(); // 새 토큰 입력
      return properties.getProperty("GITHUB_TOKEN"); // 새 토큰 반환
    }
  } else {
    // 저장된 토큰이 없으면 새 토큰 입력
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
