# CSV 파일을 Google Sheets로 동기화하기

이 프로젝트는 **GitHub Actions**를 사용하여 CSV 파일의 내용을 **Google Sheets**로 자동 동기화합니다. CSV 파일의 변경 사항이 GitHub에 푸시될 때마다 Google Sheets가 업데이트됩니다.

## 1. 프로젝트 설정

### 1.1 필수 요구 사항
- **Google Cloud 프로젝트**: Google Sheets API를 활성화한 프로젝트가 필요합니다.
- **서비스 계정**: Google Cloud에서 서비스 계정을 생성하고, 해당 계정을 Google Sheets의 편집자로 추가해야 합니다.
- **JSON 키**: 서비스 계정의 JSON 키를 생성하고, 이를 GitHub Secrets에 추가합니다.

### 1.2 서비스 계정 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성하고, **Google Sheets API**를 활성화합니다.
2. **서비스 계정**을 생성한 후, JSON 키 파일을 다운로드합니다.
3. Google Sheets에서 동기화하려는 스프레드시트에 서비스 계정 이메일을 편집자로 추가합니다.
4. GitHub 리포지토리의 **Settings > Secrets**에서 다음과 같은 비밀 변수를 추가합니다:
   - `GOOGLE_SERVICE_ACCOUNT_DATA`: 서비스 계정 JSON 키의 내용
   - `SPREADSHEET_ID`: Google 스프레드시트 ID

---

## 2. GitHub Actions 워크플로 설정

`.github/workflows/csv_update_to_google_sheets.yml` 파일을 사용하여 **SHEET_NAME**과 **CSV_FILE_PATH**를 직접 지정합니다.

### 2.1 워크플로 파일 설정

```yaml
name: Sync CSV to Google Sheets

on:
  push:  # CSV 파일이 변경되면 실행
    branches:
      - gsheet-sync  # 변경 사항이 적용될 브랜치

jobs:
  update_google_sheet:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.x'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2

      - name: Sync CSV to Google Sheets
        env:
          GOOGLE_SERVICE_ACCOUNT_DATA: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_DATA }}
          SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
          SHEET_NAME: 'sheet_1' # TODO: 동기화할 Google Sheets의 시트 이름으로 변경
          CSV_FILE_PATH: 'your/csv/file.csv' # TODO: CSV 파일 경로로 변경
        run: python .github/scripts/update_sheets.py
```

### 2.2 주요 구성 요소
- **GOOGLE_SERVICE_ACCOUNT_DATA**: Google Sheets에 접근하기 위한 서비스 계정 JSON 키를 GitHub Secrets에서 가져옵니다.
- **SPREADSHEET_ID**: 업데이트할 Google 스프레드시트의 ID를 GitHub Secrets에서 가져옵니다.
- **SHEET_NAME**: 업데이트할 Google Sheets 시트의 이름을 지정합니다. `.yml` 파일 내에서 직접 수정할 수 있습니다.
- **CSV_FILE_PATH**: CSV 파일의 경로를 지정합니다. 해당 파일은 로컬에서 Google Sheets로 동기화됩니다.

---

## 3. CSV 파일 동기화 스크립트

`update_sheets.py`는 CSV 파일을 읽어 Google Sheets로 동기화하는 Python 스크립트입니다. 이 스크립트는 지정된 CSV 파일 경로에서 데이터를 읽어 A1 셀부터 시작하는 시트에 값을 채웁니다.

```python
import os
import csv
import json
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

# 환경 변수에서 인증 정보 및 설정값 로드
SERVICE_ACCOUNT_INFO = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_DATA"])
SPREADSHEET_ID = os.environ["SPREADSHEET_ID"]
SHEET_NAME = os.environ["SHEET_NAME"]
CSV_FILE_PATH = os.environ["CSV_FILE_PATH"]

# Google 서비스 계정 인증
creds = Credentials.from_service_account_info(SERVICE_ACCOUNT_INFO, scopes=["https://www.googleapis.com/auth/spreadsheets"])
service = build("sheets", "v4", credentials=creds)

# CSV 파일 읽기
def read_csv(file_path):
    csv_data = []
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        csvreader = csv.reader(csvfile)
        for row in csvreader:
            csv_data.append(row)
    return csv_data

# Google Sheets 업데이트
def update_google_sheet(data, spreadsheet_id, sheet_name):
    range_ = f"'{sheet_name}'!A1"
    print(f"Updating range: {range_}")
    body = {
        "values": data  # CSV에서 읽어온 데이터를 Google Sheets로 전송
    }
    request = service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=range_,
        valueInputOption="RAW",
        body=body
    )
    response = request.execute()
    return response

if __name__ == "__main__":
    csv_data = read_csv(CSV_FILE_PATH)
    response = update_google_sheet(csv_data, SPREADSHEET_ID, SHEET_NAME)
    print(f"Google Sheet updated: {response}")
```

### 3.1 주요 기능
- **CSV 파일 읽기**: `read_csv()` 함수는 지정된 CSV 파일 경로에서 데이터를 읽어 2차원 배열로 변환합니다.
- **Google Sheets 업데이트**: `update_google_sheet()` 함수는 읽어온 데이터를 Google Sheets API를 통해 스프레드시트의 A1 셀부터 차례대로 입력합니다.

---

## 4. 실행 방법

1. **GitHub Secrets 설정**:
   - `GOOGLE_SERVICE_ACCOUNT_DATA`: Google 서비스 계정 JSON 파일의 내용.
   - `SPREADSHEET_ID`: 업데이트할 Google Sheets의 스프레드시트 ID.
   
   GitHub 리포지토리의 **Settings > Secrets**에서 설정할 수 있습니다.

2. **CSV 파일 경로 및 시트 이름 수정**:
   - `.github/workflows/csv_update_to_google_sheets.yml` 파일에서 `SHEET_NAME`과 `CSV_FILE_PATH` 값을 사용자의 스프레드시트와 CSV 파일 경로에 맞게 수정합니다.

3. **CSV 파일 변경 후 푸시**:
   - CSV 파일을 수정하고 **gsheet-sync** 브랜치로 푸시하면, **GitHub Actions**가 자동으로 실행되어 CSV 데이터를 Google Sheets에 동기화합니다.