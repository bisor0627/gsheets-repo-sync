# Google Sheets에서 GitHub로 CSV 파일 자동 커밋 설정 가이드

이 스크립트는 Google Sheets에서 변경된 CSV 파일을 GitHub에 자동으로 커밋하는 기능을 제공합니다. Google Apps Script와 GitHub API를 사용하여, CSV 파일을 업로드하거나 업데이트하는 과정을 자동화합니다. 이 가이드에서는 스크립트를 설정하고 사용하는 방법을 단계별로 설명합니다.

## 목차

1. [GitHub Personal Access Token 생성](#1-github-personal-access-token-생성)
2. [Google Apps Script 설정](#2-google-apps-script-설정)
3. [Google Sheets 매크로 설정](#3-google-sheets-매크로-설정)
4. [CSV 파일 커밋 방법](#4-csv-파일-커밋-방법)
5. [스크립트 설명](#5-스크립트-설명)

---

## 1. GitHub Personal Access Token 생성

Google Apps Script가 GitHub에 접근하려면 Personal Access Token(PAT)이 필요합니다. 이 토큰은 GitHub API를 통해 CSV 파일을 업로드하고 업데이트하는 데 사용됩니다.

### GitHub Personal Access Token 생성 방법:
1. GitHub에 로그인합니다.
2. 오른쪽 상단의 프로필 아이콘을 클릭하고 `Settings`로 이동합니다.
3. 왼쪽 사이드바에서 `Developer settings` > `Personal access tokens` > `Tokens (classic)`로 이동합니다.
4. `Generate new token` 버튼을 클릭합니다.
5. **repo** 권한을 선택하고, **Generate token**을 클릭하여 새로운 토큰을 생성합니다.
6. 생성된 토큰을 복사하여 안전한 곳에 저장합니다. 이 토큰은 이후 Google Apps Script에서 사용됩니다.

---

## 2. Google Apps Script 설정

### 2.1 스크립트 편집기 열기
1. Google Sheets에서 상단 메뉴에서 `확장 프로그램` > `Apps Script`를 클릭하여 스크립트 편집기를 엽니다.
2. 새로운 프로젝트를 생성하고, 아래 파일 구조에 맞춰 스크립트를 추가합니다.

### 2.2 스크립트 파일 추가
다음의 파일을 스크립트 편집기에 추가하세요.

#### **1. SetConfig.gs (스크립트 설정)**

이 스크립트는 GitHub 연결 정보를 입력할 수 있는 설정 UI를 제공하고, 입력된 정보를 저장합니다.

```javascript
function showConfigInputForm() {
  var html = HtmlService.createHtmlOutputFromFile("InputForm")
    .setWidth(600) // 기본 크기는 설정하되,
    .setHeight(400); // 반응형 스타일링은 CSS로 처리
  SpreadsheetApp.getUi().showModalDialog(html, "GitHub Configuration");
}

function saveGitHubConfig_(data) {
  // HTML 폼에서 받아온 데이터를 스크립트 속성에 저장
  PropertiesService.getScriptProperties().setProperty("GITHUB_TOKEN", data.githubToken);
  PropertiesService.getScriptProperties().setProperty("REPO_OWNER", data.repoOwner);
  PropertiesService.getScriptProperties().setProperty("REPO_NAME", data.repoName);
  PropertiesService.getScriptProperties().setProperty("BRANCH_NAME", data.branchName);
  PropertiesService.getScriptProperties().setProperty("FILE_PATH", data.filePath);
  PropertiesService.getScriptProperties().setProperty("FILE_NAME", data.fileName);
  return "Configuration saved successfully!";
}
```

#### **2. InputForm.html (설정 입력 폼)**

```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f4f4f4;
      }

      h2 {
        text-align: center;
        color: #333;
      }

      form {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        width: 100%;
        margin: 0 auto;
      }

      label {
        display: block;
        margin-bottom: 8px;
        color: #555;
      }

      input[type="text"] {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }

      button {
        width: 100%;
        background-color: #4CAF50;
        color: white;
        padding: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 10px;
      }

      button:hover {
        background-color: #45a049;
      }

      .form-container {
        margin-top: 30px;
      }

      .footer {
        text-align: center;
        margin-top: 20px;
        color: #777;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <h2>GitHub Configuration</h2>
    <div class="form-container">
      <form id="configForm">
        <label for="githubToken">GitHub Token:</label>
        <input type="text" id="githubToken" name="githubToken" required>
        <label for="repoOwner">GitHub Username:</label>
        <input type="text" id="repoOwner" name="repoOwner" required>
        <label for="repoName">Repository Name:</label>
        <input type="text" id="repoName" name="repoName" required>
        <label for="branchName">Branch Name:</label>
        <input type="text" id="branchName" name="branchName" required>
        <label for="filePath">File Path (e.g., assets/translations/):</label>
        <input type="text" id="filePath" name="filePath" required>
        <label for="fileName">File Name (e.g., a_table.csv):</label>
        <input type="text" id="fileName" name="fileName" required>
        <button type="button" onclick="submitForm()">Submit</button>
      </form>
    </div>
  </body>
</html>
```

#### **3. CommitCSV.gs (CSV 파일 GitHub로 커밋)**

```javascript
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
  var properties = PropertiesService.getScriptProperties();
  var GITHUB_TOKEN = properties.getProperty("GITHUB_TOKEN");
  var REPO_OWNER = properties.getProperty("REPO_OWNER");
  var REPO_NAME = properties.getProperty("REPO_NAME");
  var BRANCH_NAME = properties.getProperty("BRANCH_NAME");
  var FILE_PATH = properties.getProperty("FILE_PATH");
  var FILE_NAME = properties.getProperty("FILE_NAME");

  var utf8Content = Utilities.newBlob(csvContent).getBytes();
  var base64Content = Utilities.base64Encode(utf8Content);

  var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + FILE_PATH + FILE_NAME;
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
    sha = fileData.sha;
  }

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

  if (commitResponse.getResponseCode() == 201 || commitResponse.getResponseCode() == 200) {
    Logger.log("CSV 파일이 GitHub에 커밋되었습니다.");
  } else {
    Logger.log("CSV 커밋 실패: " + commitResponse.getContentText());
  }
}
```

---

## 3. Google Sheets 매크로 설정

1. **설정 폼 실행**: Google Sheets에서 `SetConfig.gs` 스크립트의 `showConfigInputForm()` 함수를 실행하면

 설정 입력창이 나타납니다.
2. **매크로 생성**: `exportAsCSV()` 함수를 Google Sheets의 매크로로 등록하여 쉽게 CSV 파일을 커밋할 수 있습니다.

---

## 4. CSV 파일 커밋 방법

1. **설정 완료 후**: Google Sheets에 입력한 데이터를 GitHub 설정을 완료한 후, `exportAsCSV()` 함수를 실행하여 CSV 파일을 커밋할 수 있습니다.
2. **GitHub로 자동 업로드**: 이 함수는 Google Sheets의 데이터를 자동으로 GitHub에 커밋합니다.

---

## 5. 스크립트 설명

### SetConfig.gs
- GitHub의 Personal Access Token, Repository 정보, 브랜치명 등을 입력받아 저장하는 스크립트입니다.
  
### InputForm.html
- 사용자가 설정을 입력할 수 있는 폼 UI를 제공합니다.

### CommitCSV.gs
- Google Sheets에서 CSV 파일을 생성하고, GitHub에 업로드 또는 업데이트하는 기능을 담당합니다.

