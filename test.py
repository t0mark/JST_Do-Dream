from shapely.geometry import Polygon
from shapely.ops import unary_union
import json
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt

# 설치된 NanumGothic 폰트의 경로 확인
fontpath = 'C:\\Windows\\Fonts\\malgun.ttf'  # 맑은 고딕

# 폰트를 Matplotlib에 등록
font = fm.FontProperties(fname=fontpath)
fm.fontManager.addfont(fontpath)

# 한글 폰트를 기본 폰트로 설정
plt.rc('font', family='Malgun Gothic')
plt.rc('axes', unicode_minus=False)  # 마이너스 기호 깨짐 방지

# 두 개의 폴리곤 예시
poly1 = Polygon([(0,0), (2,0), (2,2), (0,2)])
poly2 = Polygon([(1,1), (3,1), (3,3), (1,3)])

# 폴리곤들을 리스트로 만들어서 합치기
polygons = [poly1, poly2]
merged_polygon = unary_union(polygons)

print(merged_polygon)

# === 시각화 추가 ===
plt.figure(figsize=(15, 5))

# 1. 원본 폴리곤들 (왼쪽)
plt.subplot(1, 3, 1)
plt.title('원본 폴리곤들', fontsize=12, fontweight='bold')

# poly1을 파란색으로
x1, y1 = poly1.exterior.xy
plt.plot(x1, y1, 'blue', linewidth=2, label='폴리곤 1')
plt.fill(x1, y1, color='blue', alpha=0.3)

# poly2를 초록색으로
x2, y2 = poly2.exterior.xy
plt.plot(x2, y2, 'green', linewidth=2, label='폴리곤 2')
plt.fill(x2, y2, color='green', alpha=0.3)

plt.legend()
plt.grid(True, alpha=0.3)
plt.axis('equal')

# 2. 겹쳐진 상태 (가운데)
plt.subplot(1, 3, 2)
plt.title('겹쳐진 상태', fontsize=12, fontweight='bold')

# 두 폴리곤을 겹쳐서 표시
plt.plot(x1, y1, 'blue', linewidth=2, alpha=0.7, label='폴리곤 1')
plt.fill(x1, y1, color='blue', alpha=0.3)
plt.plot(x2, y2, 'green', linewidth=2, alpha=0.7, label='폴리곤 2')
plt.fill(x2, y2, color='green', alpha=0.3)

plt.legend()
plt.grid(True, alpha=0.3)
plt.axis('equal')

# 3. 합쳐진 결과 (오른쪽)
plt.subplot(1, 3, 3)
plt.title('합쳐진 폴리곤 (Union)', fontsize=12, fontweight='bold')

# 원본 폴리곤들을 연한 회색 점선으로 표시
plt.plot(x1, y1, 'gray', linewidth=1, alpha=0.5, linestyle='--')
plt.plot(x2, y2, 'gray', linewidth=1, alpha=0.5, linestyle='--')

# 합쳐진 폴리곤을 빨간색으로 표시
x_merged, y_merged = merged_polygon.exterior.xy
plt.plot(x_merged, y_merged, 'red', linewidth=3, label='합쳐진 폴리곤')
plt.fill(x_merged, y_merged, color='red', alpha=0.4)

plt.legend()
plt.grid(True, alpha=0.3)
plt.axis('equal')

plt.tight_layout()
plt.show()

# 결과 정보 출력
print(f"\n=== 폴리곤 정보 ===")
print(f"폴리곤 1 면적: {poly1.area}")
print(f"폴리곤 2 면적: {poly2.area}")
print(f"합쳐진 폴리곤 면적: {merged_polygon.area}")
print(f"합쳐진 폴리곤 타입: {merged_polygon.geom_type}")
