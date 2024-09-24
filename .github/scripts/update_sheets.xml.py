import os
import json
import xmltodict
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

# 환경 변수에서 인증 정보 및 설정값 로드
SERVICE_ACCOUNT_INFO = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_DATA"])
SPREADSHEET_ID = os.environ["SPREADSHEET_ID"]
SHEET_NAME = os.environ["SHEET_NAME"]
XML_FILE_PATH = os.environ["XML_FILE_PATH"]

# Google 서비스 계정 인증
creds = Credentials.from_service_account_info(SERVICE_ACCOUNT_INFO, scopes=["https://www.googleapis.com/auth/spreadsheets"])
service = build("sheets", "v4", credentials=creds)

# XML 파일 읽기 및 언어별 그룹화된 데이터로 변환
def read_xml_and_group_by_languages(file_path):
    with open(file_path, 'r', encoding='utf-8') as xml_file:
        xml_data = xmltodict.parse(xml_file.read())

    # 중첩된 딕셔너리를 순회하여 언어별로 키와 값을 정리
    data_by_language = {}
    
    def parse_dict(d, parent_key=""):
        for key, value in d.items():
            full_key = f"{parent_key}.{key}" if parent_key else key
            if isinstance(value, dict):
                parse_dict(value, full_key)
            else:
                lang_key = full_key.split('.')[1]  # 언어 코드 추출 (예: ar_DZ, en_US)
                if lang_key not in data_by_language:
                    data_by_language[lang_key] = {}
                data_by_language[lang_key][full_key] = value
    
    parse_dict(xml_data)
    return data_by_language

# 데이터를 언어별로 배열화 (Google Sheets에 맞게)
def arrange_data_for_sheets(data_by_language):
    # 모든 키 가져오기 (중복 없이)
    all_keys = sorted({key.split('.', 2)[-1] for lang_data in data_by_language.values() for key in lang_data})
    
    # 첫 번째 행은 언어 코드를 포함
    arranged_data = [["str"] + list(data_by_language.keys())]
    
    # 각 키에 대해 행을 생성하고 언어별 번역 값 매칭
    for key in all_keys:
        row = [key]
        for lang in data_by_language.keys():
            full_key = f"langs.{lang}.{key}"
            row.append(data_by_language[lang].get(full_key, ""))
        arranged_data.append(row)
    return arranged_data

# Google Sheets 업데이트
def update_google_sheet(data, spreadsheet_id, sheet_name):
    range_ = f"'{sheet_name}'!A1"
    print(f"Updating range: {range_}")
    body = {
        "values": data  # 정리된 데이터를 Google Sheets로 전송
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
    # 새 XML 데이터 읽기 및 언어별 그룹화
    data_by_language = read_xml_and_group_by_languages(XML_FILE_PATH)
    
    # 데이터를 Google Sheets에 맞게 정리
    arranged_data = arrange_data_for_sheets(data_by_language)
    
    # Google Sheets 업데이트
    response = update_google_sheet(arranged_data, SPREADSHEET_ID, SHEET_NAME)
    print(f"Google Sheet updated: {response}")
