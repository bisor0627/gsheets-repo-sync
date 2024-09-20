function showConfigInputForm() {
  var html = HtmlService.createHtmlOutputFromFile("InputForm")
    .setWidth(600) // 기본 크기는 설정하되,
    .setHeight(400); // 반응형 스타일링은 CSS로 처리
  SpreadsheetApp.getUi().showModalDialog(html, "GitHub Configuration");
}

function saveGitHubConfig_(data) {
  // HTML 폼에서 받아온 데이터를 스크립트 속성에 저장
  PropertiesService.getScriptProperties().setProperty(
    "GITHUB_TOKEN",
    data.githubToken
  );
  PropertiesService.getScriptProperties().setProperty(
    "REPO_OWNER",
    data.repoOwner
  );
  PropertiesService.getScriptProperties().setProperty(
    "REPO_NAME",
    data.repoName
  );
  PropertiesService.getScriptProperties().setProperty(
    "BRANCH_NAME",
    data.branchName
  );
  PropertiesService.getScriptProperties().setProperty(
    "FILE_PATH",
    data.filePath
  );
  PropertiesService.getScriptProperties().setProperty(
    "FILE_NAME",
    data.fileName
  );
  return "Configuration saved successfully!";
}
