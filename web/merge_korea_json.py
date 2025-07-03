# -*- coding: utf-8 -*-
import json
import os

def analyze_files():
    """파일 구조 분석"""
    print("=== 파일 구조 분석 ===")
    
    # 시도 파일 분석
    try:
        with open('skorea-provinces-2018-geo.json', 'r', encoding='utf-8') as f:
            provinces = json.load(f)
        print(f"시도 파일: {len(provinces['features'])}개")
        print("시도 파일 샘플 속성:")
        if provinces['features']:
            props = provinces['features'][0]['properties']
            for key, value in props.items():
                print(f"  {key}: {value}")
    except Exception as e:
        print(f"시도 파일 읽기 오류: {e}")
    
    # 시군구 파일 분석
    try:
        with open('skorea-municipalities-2018-geo.json', 'r', encoding='utf-8') as f:
            municipalities = json.load(f)
        print(f"\n시군구 파일: {len(municipalities['features'])}개")
        print("시군구 파일 샘플 속성 (처음 5개):")
        for i in range(min(5, len(municipalities['features']))):
            props = municipalities['features'][i]['properties']
            print(f"  {i+1}. {props}")
    except Exception as e:
        print(f"시군구 파일 읽기 오류: {e}")

def merge_korea_geojson():
    """한국 지도 GeoJSON 파일 합치기"""
    
    # 파일 경로 설정
    provinces_file = 'skorea-provinces-2018-geo.json'
    municipalities_file = 'skorea-municipalities-2018-geo.json'
    output_file = 'skorea-mixed-2018-geo.json'
    
    # 파일 존재 여부 확인
    if not os.path.exists(provinces_file):
        print(f"오류: {provinces_file} 파일이 없습니다.")
        return
    
    if not os.path.exists(municipalities_file):
        print(f"오류: {municipalities_file} 파일이 없습니다.")
        return
    
    # 서울/광역시 소속 구/군 목록 (제외할 지역들)
    seoul_and_metropolitan_cities = {
        # 서울특별시
        "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구",
        "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구",
        "관악구", "서초구", "강남구", "송파구", "강동구",
        # 부산광역시
        "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구", "해운대구", "사하구",
        "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
        # 대구광역시
        "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군",
        # 인천광역시
        "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군",
        # 광주광역시
        "동구", "서구", "남구", "북구", "광산구",
        # 대전광역시
        "동구", "중구", "서구", "유성구", "대덕구",
        # 울산광역시
        "중구", "남구", "동구", "북구", "울주군"
    }
    
    # 광역시/특별시만 통합 (세종, 제주는 제외)
    integrated_areas = {
        '서울특별시', '부산광역시', '대구광역시', '인천광역시',
        '광주광역시', '대전광역시', '울산광역시'
    }
    
    try:
        # 파일 읽기
        print("GeoJSON 파일들을 읽는 중...")
        with open(provinces_file, 'r', encoding='utf-8') as f:
            provinces_data = json.load(f)
        
        with open(municipalities_file, 'r', encoding='utf-8') as f:
            municipalities_data = json.load(f)
        
        print(f"시도 데이터: {len(provinces_data['features'])}개")
        print(f"시군구 데이터: {len(municipalities_data['features'])}개")
        
        # 결과 저장할 리스트
        merged_features = []
        
        # 특별 처리: 군위군 찾기 (대구광역시에 병합할 예정)
        gunwi_feature = None
        for feature in municipalities_data['features']:
            props = feature['properties']
            area_name = props.get('name', '')
            if area_name == '군위군':
                gunwi_feature = feature
                print(f"  🔍 군위군 발견: 대구광역시에 병합 예정")
                break
        
        # 1. 광역시/특별시 추가 (세종, 제주 제외)
        print("\n=== 광역시/특별시 추가 ===")
        for feature in provinces_data['features']:
            props = feature['properties']
            
            # 다양한 속성명 확인
            area_name = (props.get('CTP_KOR_NM') or 
                        props.get('NAME_1') or 
                        props.get('name') or 
                        props.get('NAME'))
            
            if area_name and area_name in integrated_areas:
                # 대구광역시인 경우 군위군과 병합
                if area_name == '대구광역시' and gunwi_feature:
                    print(f"  ✅ {area_name} 추가 (군위군 병합)")
                    
                    # 새로운 feature 생성 (대구광역시 + 군위군)
                    merged_daegu = {
                        "type": "Feature",
                        "properties": feature['properties'].copy(),
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": []
                        }
                    }
                    
                    # 대구광역시 geometry 추가
                    daegu_geom = feature['geometry']
                    if daegu_geom['type'] == 'Polygon':
                        merged_daegu['geometry']['coordinates'].append(daegu_geom['coordinates'])
                    elif daegu_geom['type'] == 'MultiPolygon':
                        merged_daegu['geometry']['coordinates'].extend(daegu_geom['coordinates'])
                    
                    # 군위군 geometry 추가
                    gunwi_geom = gunwi_feature['geometry']
                    if gunwi_geom['type'] == 'Polygon':
                        merged_daegu['geometry']['coordinates'].append(gunwi_geom['coordinates'])
                    elif gunwi_geom['type'] == 'MultiPolygon':
                        merged_daegu['geometry']['coordinates'].extend(gunwi_geom['coordinates'])
                    
                    merged_features.append(merged_daegu)
                else:
                    print(f"  ✅ {area_name} 추가")
                    merged_features.append(feature)
            else:
                print(f"  ❌ {area_name} 제외 (도 지역으로 처리)")
        
        # 2. 도 지역 + 세종 + 제주의 시군구들 추가
        print("\n=== 도 지역 + 세종 + 제주 시군구들 추가 ===")
        
        # 시군구 데이터를 모두 확인
        for feature in municipalities_data['features']:
            props = feature['properties']
            area_name = props.get('name', '')
            area_code = props.get('code', '')
            
            # 서울/광역시 소속 구/군 제외
            if area_name in seoul_and_metropolitan_cities:
                if area_name == '군위군':
                    print(f"  ✅ {area_name} (코드: {area_code}) 대구광역시에 병합됨")
                else:
                    print(f"  ❌ {area_name} (코드: {area_code}) 제외 (서울/광역시 소속)")
            else:
                print(f"  ✅ {area_name} (코드: {area_code}) 추가")
                merged_features.append(feature)
        
        # 3. 결과 파일 생성
        print(f"\n=== 결과 파일 생성 ===")
        print(f"총 {len(merged_features)}개 지역")
        
        merged_data = {
            "type": "FeatureCollection",
            "features": merged_features
        }
        
        # 파일 저장
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 완료! {output_file} 파일이 생성되었습니다.")
        
        # 결과 요약
        print("\n=== 결과 요약 ===")
        integrated_count = 0
        municipality_count = 0
        
        for feature in merged_features:
            props = feature['properties']
            area_name = (props.get('CTP_KOR_NM') or 
                        props.get('NAME_1') or 
                        props.get('name') or 
                        props.get('NAME'))
            
            if area_name and area_name in integrated_areas:
                integrated_count += 1
            else:
                municipality_count += 1
        
        print(f"서울/광역시 (통합): {integrated_count}개")
        print(f"도 지역 + 세종 + 제주 (시군구별): {municipality_count}개")
        if gunwi_feature:
            print(f"특별 처리: 군위군이 대구광역시에 병합됨")
        print(f"전체: {len(merged_features)}개")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

def preview_result():
    """결과 파일 미리보기"""
    output_file = 'skorea-mixed-2018-geo.json'
    
    if not os.path.exists(output_file):
        print(f"{output_file} 파일이 없습니다.")
        return
    
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n=== 생성된 파일 내용 ===")
        print(f"총 지역 수: {len(data['features'])}개")
        
        print("\n포함된 지역들:")
        for i, feature in enumerate(data['features']):
            props = feature['properties']
            area_name = props.get('name', '')
            area_code = props.get('code', '')
            print(f"  {i+1:3d}. {area_name} (코드: {area_code})")
    
    except Exception as e:
        print(f"파일 읽기 오류: {e}")

if __name__ == "__main__":
    print("한국 지도 GeoJSON 파일 합치기 (서울/광역시 통합 + 군위군 병합)")
    print("="*70)
    
    # 1. 파일 구조 분석
    analyze_files()
    
    print("\n" + "="*60)
    
    # 2. 파일 합치기 실행
    merge_korea_geojson()
    
    # 3. 결과 미리보기
    preview_result()