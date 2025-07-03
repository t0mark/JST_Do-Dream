import streamlit as st
import plotly.graph_objects as go
import requests

st.title("한국 시군구 블록 지도")

@st.cache_data
def load_korea_geojson():
    # 시도 단위 (가벼움)
    url = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json"
    response = requests.get(url)
    return response.json()

# 지도 데이터 로드
korea_geojson = load_korea_geojson()

# 블록 지도 생성
fig = go.Figure()

colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
          '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
          '#FFA502', '#FF6348', '#2ED573', '#3742FA', '#F368E0',
          '#FFC312', '#C44569']

def extract_coordinates(geometry):
    """GeoJSON geometry에서 좌표 추출"""
    coords_list = []
    
    if geometry['type'] == 'Polygon':
        for ring in geometry['coordinates']:
            if len(ring) > 0:
                x_coords = [coord[0] for coord in ring]
                y_coords = [coord[1] for coord in ring]
                coords_list.append((x_coords, y_coords))
    
    elif geometry['type'] == 'MultiPolygon':
        for polygon in geometry['coordinates']:
            for ring in polygon:
                if len(ring) > 0:
                    x_coords = [coord[0] for coord in ring]
                    y_coords = [coord[1] for coord in ring]
                    coords_list.append((x_coords, y_coords))
    
    return coords_list

# 각 지역별로 처리
for i, feature in enumerate(korea_geojson['features']):
    name = feature['properties']['name']
    geometry = feature['geometry']
    
    coords_list = extract_coordinates(geometry)
    
    for x_coords, y_coords in coords_list:
        fig.add_trace(go.Scatter(
            x=x_coords,
            y=y_coords,
            fill='toself',
            fillcolor=colors[i % len(colors)],
            line=dict(color='white', width=2),
            mode='lines',
            name=name,
            hovertemplate=f'<b>{name}</b><extra></extra>',
            showlegend=False
        ))

# 레이아웃 설정 (배경 제거, 축 숨김)
fig.update_layout(
    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False, visible=False),
    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False, visible=False),
    plot_bgcolor='white',
    paper_bgcolor='white',
    margin=dict(l=0, r=0, t=0, b=0),
    height=600
)

fig.update_xaxes(scaleanchor="y", scaleratio=1)

st.plotly_chart(fig, use_container_width=True)

st.info("시도 단위 블록 지도입니다.")