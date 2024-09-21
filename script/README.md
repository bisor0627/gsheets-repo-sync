# Google Sheets에서 GitHub로 CSV 파일 자동 커밋 설정 가이드

이 스크립트는 Google Sheets에서 변경된 CSV 파일을 GitHub에 자동으로 커밋하는 기능을 제공합니다. Google Apps Script와 GitHub API를 사용하여 CSV 파일을 업로드하거나 업데이트하는 과정을 자동화합니다. 이 가이드에서는 스크립트를 설정하고 사용하는 방법을 단계별로 설명합니다.

## 목차

- [Google Sheets에서 GitHub로 CSV 파일 자동 커밋 설정 가이드](#google-sheets에서-github로-csv-파일-자동-커밋-설정-가이드)
  - [목차](#목차)
  - [1. GitHub Personal Access Token 생성](#1-github-personal-access-token-생성)
    - [GitHub Personal Access Token 생성 방법:](#github-personal-access-token-생성-방법)
  - [2. Google Apps Script 설정](#2-google-apps-script-설정)
  - [3. Google Sheets 매크로 설정](#3-google-sheets-매크로-설정)
  - [4. CSV 파일 커밋 방법](#4-csv-파일-커밋-방법)
  - [5. 스크립트 설명](#5-스크립트-설명)
    - [설정 스크립트](#설정-스크립트)
    - [UI 폼](#ui-폼)
    - [CSV 커밋 스크립트](#csv-커밋-스크립트)

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

1. Google Sheets에서 `확장 프로그램` > `Apps Script`로 이동하여 스크립트 편집기를 엽니다.
2. 프로젝트를 생성하고, GitHub 설정 정보를 입력받는 스크립트와 CSV 파일을 자동으로 커밋하는 스크립트를 추가합니다.
3. GitHub 설정 입력 UI를 만들고, 이를 통해 GitHub Personal Access Token, Repository 이름, 브랜치명 등을 입력받아 저장합니다.

---

## 3. Google Sheets 매크로 설정

1. **설정 폼 실행**: Google Sheets에서 설정 스크립트를 실행하여 설정 입력창을 엽니다.
2. **매크로 생성**: CSV 파일을 GitHub로 커밋하는 함수를 Google Sheets의 매크로로 등록하여 쉽게 사용할 수 있습니다.

---

## 4. CSV 파일 커밋 방법

1. Google Sheets의 데이터를 CSV 형식으로 변환하고, GitHub API를 통해 선택한 브랜치에 커밋합니다.
2. 이 과정은 설정된 GitHub Personal Access Token과 사용자 입력값을 통해 자동으로 처리됩니다.

---

## 5. 스크립트 설명

### 설정 스크립트
- GitHub Personal Access Token, Repository 정보, 브랜치명을 입력받아 저장하는 스크립트입니다.

### UI 폼
- 사용자가 GitHub 설정 정보를 입력할 수 있는 입력 폼을 제공합니다.

### CSV 커밋 스크립트
- Google Sheets의 데이터를 CSV로 변환하고, GitHub에 커밋하는 역할을 합니다.