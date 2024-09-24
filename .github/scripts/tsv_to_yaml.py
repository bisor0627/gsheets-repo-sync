import os
import csv
import yaml
import base64
import requests

# 환경 변수에서 필요한 정보 로드
tsv_file_path = os.environ["TSV_FILE_PATH"]
yaml_file_path = os.environ["YAML_FILE_PATH"]
github_token = os.environ["GITHUB_TOKEN"]

# 로컬에서 TSV 파일 읽기 함수
def read_tsv(file_path):
    data = []
    with open(file_path, newline='', encoding='utf-8') as tsvfile:
        reader = csv.DictReader(tsvfile, delimiter='\t')  # DictReader를 사용하여 헤더를 자동 처리
        for row in reader:
            # 'str' 컬럼 값이 빈 값이거나 공백만 있는 경우는 스킵
            if not row['str'] or row['str'].strip() == "":
                continue
            data.append(row)
    return data

# 중첩 딕셔너리 생성 함수
def nest_dict(keys, value):
    if len(keys) == 1:
        return {keys[0]: value}
    return {keys[0]: nest_dict(keys[1:], value)}

# 딕셔너리 병합 함수
def merge_dict(d1, d2):
    for k, v in d2.items():
        if k in d1 and isinstance(d1[k], dict) and isinstance(v, dict):
            merge_dict(d1[k], v)
        else:
            d1[k] = v

# 데이터를 YAML로 변환하는 함수
def convert_to_yaml(data):
    yaml_data = {}

    for row in data:
        key = row.pop('str')  # 'str' 컬럼이 키로 사용됨
        key_parts = key.split('.')  # '.'을 기준으로 나누어 중첩 구조로 변환
        for lang, value in row.items():
            if lang not in yaml_data:
                yaml_data[lang] = {}

            # 중첩 딕셔너리 병합
            nested = nest_dict(key_parts, value)
            merge_dict(yaml_data[lang], nested)

    return yaml.dump(yaml_data, allow_unicode=True, default_flow_style=False)

# YAML 파일을 GitHub에 커밋하는 함수
def commit_yaml_to_github(yaml_content, file_path):
    repo_owner = "bisor0627"  # 리포지토리 소유자 이름
    repo_name = "gsheets-repo-sync"  # 리포지토리 이름
    branch_name = "main"  # 사용 중인 브랜치
    commit_message = "Convert TSV to YAML"

    # GitHub API 요청 URL
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{file_path}"

    # 현재 파일 상태 확인 (SHA 값 가져오기)
    response = requests.get(url, headers={
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    })
    sha = ""
    if response.status_code == 200:
        sha = response.json()['sha']

    # 파일을 base64로 인코딩
    content_base64 = base64.b64encode(yaml_content.encode("utf-8")).decode("utf-8")

    # GitHub에 파일 커밋
    payload = {
        "message": commit_message,
        "content": content_base64,
        "branch": branch_name,
    }
    if sha:
        payload["sha"] = sha

    response = requests.put(url, json=payload, headers={
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    })

    if response.status_code in [200, 201]:
        print("YAML 파일이 GitHub에 커밋되었습니다.")
    else:
        print(f"YAML 커밋 실패: {response.text}")

if __name__ == "__main__":
    # TSV 파일 읽기
    tsv_data = read_tsv(tsv_file_path)

    # TSV 데이터를 YAML로 변환
    yaml_content = convert_to_yaml(tsv_data)

    # YAML 파일을 GitHub에 커밋
    commit_yaml_to_github(yaml_content, yaml_file_path)
