// 전역 변수
let map;
let geojsonLayer;
let currentData = {};
let selectedLayers = [];
let charts = {};

// 색상 스킴 정의
const colorSchemes = {
    blues: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0'],
    greens: ['#e8f5e8', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32'],
    reds: ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828'],
    oranges: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00']
};

// 샘플 데이터 (각 지역별로 4개 지표)
const sampleData = {
    '서울특별시 강남구': {
        industry: 85, population: 561000, economy: 92, environment: 78,
        industryDetail: [30, 25, 20, 15, 10], populationDetail: [20, 25, 30, 25]
    },
    '서울특별시 강동구': {
        industry: 72, population: 440000, economy: 75, environment: 82,
        industryDetail: [25, 20, 25, 15, 15], populationDetail: [15, 20, 35, 30]
    },
    '부산광역시 해운대구': {
        industry: 78, population: 410000, economy: 81, environment: 85,
        industryDetail: [20, 30, 20, 20, 10], populationDetail: [10, 15, 30, 45]
    },
    '경기도 성남시': {
        industry: 79, population: 950000, economy: 88, environment: 74,
        industryDetail: [35, 20, 20, 15, 10], populationDetail: [25, 30, 25, 20]
    }
};

// 지도 초기화
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: true,
        touchZoom: false,
        zoomSnap: 0.1
    }).setView([36, 127.5], 7.6);
    
    map.getContainer().style.backgroundColor = '#f8f9fa';
}

// 값에 따른 색상 반환
function getColor(value, scheme = 'blues') {
    const colors = colorSchemes[scheme];
    const allValues = Object.values(currentData).map(d => d.industry);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const range = max - min;
    
    if (range === 0) return colors[4];
    
    const normalized = (value - min) / range;
    const index = Math.floor(normalized * (colors.length - 1));
    return colors[Math.max(0, Math.min(index, colors.length - 1))];
}

// GeoJSON 스타일 함수
function style(feature) {
    const regionName = feature.properties.CTP_KOR_NM || feature.properties.SIG_KOR_NM || feature.properties.name;
    const value = currentData[regionName]?.industry || 0;
    const scheme = document.getElementById('colorScheme').value;
    
    return {
        fillColor: getColor(value, scheme),
        weight: 2,
        opacity: 1,
        color: '#ffffff',
        dashArray: '',
        fillOpacity: 1,
        stroke: true
    };
}

// 마우스 이벤트 핸들러
function highlightFeature(e) {
    const layer = e.target;
    
    layer.setStyle({
        weight: 4,
        color: '#2c3e50',
        dashArray: '',
        fillOpacity: 0.9,
        stroke: true
    });
    
    layer.bringToFront();
    bringSelectedLayersToFront();
    
    const regionName = layer.feature.properties.CTP_KOR_NM || layer.feature.properties.SIG_KOR_NM || layer.feature.properties.name;
    const data = currentData[regionName];
    
    // 데이터가 있는 지역은 상세 정보, 없는 지역은 지역명만 표시
    let tooltipContent = `<strong>${regionName}</strong>`;
    if (data) {
        tooltipContent += `<br>산업지수: ${data.industry}<br>인구: ${data.population.toLocaleString()}명`;
    } else {
        tooltipContent += `<br><em>데이터 없음</em>`;
    }
    
    const tooltip = L.popup()
        .setLatLng(e.latlng)
        .setContent(tooltipContent)
        .openOn(map);
}

function resetHighlight(e) {
    if (!selectedLayers.includes(e.target)) {
        geojsonLayer.resetStyle(e.target);
    }
    map.closePopup();
    bringSelectedLayersToFront();
}

function zoomToFeature(e) {
    const clickedLayer = e.target;
    const selectedIndex = selectedLayers.indexOf(clickedLayer);
    
    if (selectedIndex !== -1) {
        selectedLayers.splice(selectedIndex, 1);
        geojsonLayer.resetStyle(clickedLayer);
    } else {
        selectedLayers.push(clickedLayer);
        
        if (selectedLayers.length > 2) {
            const removedLayer = selectedLayers.shift();
            geojsonLayer.resetStyle(removedLayer);
        }
        
        clickedLayer.setStyle({
            weight: 4,
            color: '#2c3e50',
            dashArray: '',
            fillOpacity: 0.9,
            stroke: true
        });
    }
    
    bringSelectedLayersToFront();
    updateRegionInfo();
    updateDataPanels();
}

function bringSelectedLayersToFront() {
    selectedLayers.forEach(layer => {
        layer.bringToFront();
    });
}

// 패널 닫기 함수
function closePanels() {
    const panelsOverlay = document.getElementById('data-panels-overlay');
    const regionInfoOverlay = document.getElementById('region-info-overlay');
    
    // 먼저 애니메이션으로 숨기기
    regionInfoOverlay.classList.remove('show');
    
    // 모든 패널에서 show 클래스 제거 (애니메이션 시작)
    document.querySelectorAll('.data-panel').forEach(panel => {
        panel.classList.remove('show');
    });
    
    // 애니메이션 완료 후 완전히 숨기기 (300ms 후)
    setTimeout(() => {
        panelsOverlay.style.display = 'none';
        
        // 차트 정리
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
    }, 300);
    
    // 선택된 레이어 해제
    selectedLayers.forEach(layer => {
        geojsonLayer.resetStyle(layer);
    });
    selectedLayers = [];
}

// 선택된 지역 정보 업데이트
function updateRegionInfo() {
    const regionSummary = document.getElementById('region-summary');
    const regionInfoOverlay = document.getElementById('region-info-overlay');
    
    if (selectedLayers.length === 0) {
        regionInfoOverlay.classList.remove('show');
        return;
    }
    
    let summaryHTML = '';
    selectedLayers.forEach((layer, index) => {
        const regionName = layer.feature.properties.CTP_KOR_NM || layer.feature.properties.SIG_KOR_NM || layer.feature.properties.name;
        const data = currentData[regionName];
        
        if (data) {
            summaryHTML += `
                <div class="region-card ${index === 1 ? 'region-2' : ''}">
                    <h5>지역 ${index + 1}: ${regionName}</h5>
                    <p>산업지수: ${data.industry} | 인구: ${data.population.toLocaleString()}명</p>
                    <p>경제지표: ${data.economy} | 환경지표: ${data.environment}</p>
                </div>
            `;
        }
    });
    
    regionSummary.innerHTML = summaryHTML;
    regionInfoOverlay.style.display = 'block';
    
    // 애니메이션을 위한 약간의 지연
    setTimeout(() => {
        regionInfoOverlay.classList.add('show');
    }, 50);
}

// 데이터 패널 업데이트
function updateDataPanels() {
    const panelsOverlay = document.getElementById('data-panels-overlay');
    
    if (selectedLayers.length === 0) {
        // 애니메이션으로 패널 숨기기
        document.querySelectorAll('.data-panel').forEach(panel => {
            panel.classList.remove('show');
        });
        
        // 애니메이션 완료 후 완전히 숨기기
        setTimeout(() => {
            panelsOverlay.style.display = 'none';
            
            // 차트 정리
            Object.values(charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            charts = {};
        }, 300);
        
        return;
    }
    
    const selectedRegions = selectedLayers.map(layer => {
        const regionName = layer.feature.properties.CTP_KOR_NM || layer.feature.properties.SIG_KOR_NM || layer.feature.properties.name;
        return { name: regionName, data: currentData[regionName] };
    }).filter(region => region.data);
    
    // 패널 표시
    panelsOverlay.style.display = 'block';
    
    // 애니메이션을 위한 약간의 지연
    setTimeout(() => {
        document.querySelectorAll('.data-panel').forEach(panel => {
            panel.classList.add('show');
        });
    }, 50);
    
    // 차트 업데이트
    setTimeout(() => {
        updateChart1(selectedRegions); // 산업 현황
        updateChart2(selectedRegions); // 인구 통계
        updateChart3(selectedRegions); // 경제 지표
        updateChart4(selectedRegions); // 환경 지표
    }, 300);
}

// 차트 1: 산업 현황 (막대 차트)
function updateChart1(regions) {
    const ctx = document.getElementById('chart-1').getContext('2d');
    
    if (charts.chart1) {
        charts.chart1.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: regions.map(r => r.name.split(' ').pop()), // 지역명 축약
        datasets: [{
            label: '산업 지수',
            data: regions.map(r => r.data.industry),
            backgroundColor: ['#3498db', '#e74c3c'],
            borderColor: ['#2980b9', '#c0392b'],
            borderWidth: 2
        }]
    };
    
    charts.chart1 = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 차트 2: 인구 통계 (도넛 차트)
function updateChart2(regions) {
    const ctx = document.getElementById('chart-2').getContext('2d');
    
    if (charts.chart2) {
        charts.chart2.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: regions.map(r => r.name.split(' ').pop()),
        datasets: [{
            data: regions.map(r => r.data.population),
            backgroundColor: ['#3498db', '#e74c3c'],
            borderColor: ['#2980b9', '#c0392b'],
            borderWidth: 2
        }]
    };
    
    charts.chart2 = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// 차트 3: 경제 지표 (선 차트)
function updateChart3(regions) {
    const ctx = document.getElementById('chart-3').getContext('2d');
    
    if (charts.chart3) {
        charts.chart3.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: ['1Q', '2Q', '3Q', '4Q'],
        datasets: regions.map((region, index) => ({
            label: region.name.split(' ').pop(),
            data: [region.data.economy - 10, region.data.economy - 5, region.data.economy, region.data.economy + 3],
            borderColor: index === 0 ? '#3498db' : '#e74c3c',
            backgroundColor: index === 0 ? 'rgba(52, 152, 219, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
        }))
    };
    
    charts.chart3 = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: regions.length > 1,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 차트 4: 환경 지표 (레이더 차트)
function updateChart4(regions) {
    const ctx = document.getElementById('chart-4').getContext('2d');
    
    if (charts.chart4) {
        charts.chart4.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: ['대기질', '수질', '폐기물', '소음', '녹지'],
        datasets: regions.map((region, index) => ({
            label: region.name.split(' ').pop(),
            data: [
                region.data.environment,
                region.data.environment - 5,
                region.data.environment + 3,
                region.data.environment - 2,
                region.data.environment + 5
            ],
            borderColor: index === 0 ? '#3498db' : '#e74c3c',
            backgroundColor: index === 0 ? 'rgba(52, 152, 219, 0.2)' : 'rgba(231, 76, 60, 0.2)',
            pointBackgroundColor: index === 0 ? '#3498db' : '#e74c3c',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: index === 0 ? '#3498db' : '#e74c3c',
            pointRadius: 3,
            pointHoverRadius: 5
        }))
    };
    
    charts.chart4 = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: regions.length > 1,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0,0,0,0.2)'
                    }
                }
            }
        }
    });
}

// 각 feature에 이벤트 리스너 추가
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// GeoJSON 데이터 로드
async function loadGeoJSON() {
    try {
        // 로컬 GeoJSON 파일 경로
        const url = './map/skorea-mixed-2018-geo.json';
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`파일을 찾을 수 없습니다: ${url}`);
        }
        const geoData = await response.json();
        
        // 기존 레이어 제거
        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }
        
        // 새 레이어 추가
        geojsonLayer = L.geoJSON(geoData, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        
        // 로딩 표시 제거
        document.getElementById('loading').style.display = 'none';
        
        // 범례 업데이트
        updateLegend();
        
    } catch (error) {
        console.error('GeoJSON 로드 실패:', error);
        
        // 샘플 GeoJSON 데이터로 대체
        const sampleGeoJSON = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"CTP_KOR_NM": "서울특별시 강남구"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[127.0, 37.5], [127.1, 37.5], [127.1, 37.6], [127.0, 37.6], [127.0, 37.5]]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"CTP_KOR_NM": "서울특별시 강동구"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[127.1, 37.5], [127.2, 37.5], [127.2, 37.6], [127.1, 37.6], [127.1, 37.5]]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"CTP_KOR_NM": "부산광역시 해운대구"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[129.1, 35.1], [129.2, 35.1], [129.2, 35.2], [129.1, 35.2], [129.1, 35.1]]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"CTP_KOR_NM": "경기도 성남시"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[127.1, 37.4], [127.2, 37.4], [127.2, 37.5], [127.1, 37.5], [127.1, 37.4]]]
                    }
                }
            ]
        };
        
        geojsonLayer = L.geoJSON(sampleGeoJSON, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        
        document.getElementById('loading').style.display = 'none';
        updateLegend();
    }
}

// 범례 업데이트
function updateLegend() {
    const scheme = document.getElementById('colorScheme').value;
    const colors = colorSchemes[scheme];
    const allValues = Object.values(currentData).map(d => d.industry);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const range = max - min;
    
    const legendContent = document.getElementById('legend-content');
    legendContent.innerHTML = '';
    
    for (let i = colors.length - 1; i >= 0; i--) {
        const value = min + (range * i / (colors.length - 1));
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${colors[i]}"></div>
            <span>${value.toFixed(1)}</span>
        `;
        legendContent.appendChild(legendItem);
    }
}

// 데이터 업데이트
function updateData() {
    const dataType = document.getElementById('dataType').value;
    currentData = sampleData;
    
    // 패널 닫기
    closePanels();
    
    if (geojsonLayer) {
        geojsonLayer.setStyle(style);
        bringSelectedLayersToFront();
    }
    
    updateLegend();
}

// 이벤트 리스너 등록
document.getElementById('dataType').addEventListener('change', updateData);
document.getElementById('colorScheme').addEventListener('change', () => {
    if (geojsonLayer) {
        geojsonLayer.setStyle(style);
        
        selectedLayers.forEach(layer => {
            layer.setStyle({
                weight: 4,
                color: '#2c3e50',
                dashArray: '',
                fillOpacity: 0.9,
                stroke: true
            });
        });
        
        bringSelectedLayersToFront();
    }
    updateLegend();
});

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    currentData = sampleData;
    initMap();
    loadGeoJSON();
});