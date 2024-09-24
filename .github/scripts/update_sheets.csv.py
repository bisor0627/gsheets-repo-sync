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
    # body = {
    #   "values": [
    #     ["q", "w", "e", "r"],  # 첫 번째 행
    #     ["w", "e", "r", "t"]   # 두 번째 행
    #     ]
    # }
    body = {
        "values": data  # CSV에서 읽어온 데이터를 그대로 body에 할당
    }
    print(f"Updating data: {body}")
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
