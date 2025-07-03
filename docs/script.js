// 전역 변수
let map;
let geojsonLayer;
let currentData = {};
let selectedLayers = [];
let charts = {};

// 색상 스킴 정의 (데이터 유형별)
const colorSchemes = {
    blues: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0'],
    greens: ['#e8f5e8', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32'],
    reds: ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828'],
    oranges: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00'],
    purples: ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a']
};

// 데이터 유형별 색상 스킴 매핑
const dataTypeColorMap = {
    sample: 'blues',           // 전체 농업 데이터 - 블루
    foodtech: 'greens',        // 푸드테크 지수 - 그린
    digital_agriculture: 'oranges', // 디지털농업 지수 - 오렌지
    medical_bio: 'reds',       // 메디컬/바이오 지수 - 레드
    convergence: 'purples'     // 융합형 지수 - 퍼플
};

// CSV 데이터 로드 함수
async function loadCSVData() {
    try {
        const response = await fetch('./total.csv');
        if (!response.ok) {
            throw new Error(`CSV 파일을 찾을 수 없습니다: total.csv`);
        }
        const csvText = await response.text();
        
        // CSV 파싱
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        currentData = {};
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',');
            if (values.length < headers.length) continue;
            
            const regionName = values[0].trim();
            if (!regionName) continue;
            
            // 데이터 구조 정의
            currentData[regionName] = {
                // 기본 정보
                region: regionName,
                
                // 산업 현황 (생산량 관련)
                farmCount: parseInt(values[1]) || 0,
                riceProduction: parseInt(values[7]) || 0, // 10a당 총 쌀 생산량
                polishedRice: parseInt(values[4]) || 0, // 정곡 생산량
                brownRice: parseInt(values[5]) || 0, // 현미 생산량
                roughRice: parseInt(values[6]) || 0, // 조곡 생산량
                
                // 인구 통계
                returnFarmers: parseInt(values[2]) || 0, // 귀농 인구
                returnRatio: parseFloat(values[3]) || 0, // 귀농 비율
                
                // 경제 지표
                overallScore: parseFloat(values[8]) || 0, // 종합 점수
                distributionCount: parseInt(values[9]) || 0, // 유통망 수
                processingCount: parseInt(values[10]) || 0, // 미곡처리장 수
                
                // 환경/인프라 지표
                machineryCount: parseInt(values[11]) || 0, // 총 임대 농기계 수
                waterCapacity: parseFloat(values[12]) || 0, // 총저수량
                waterFacilities: parseFloat(values[13]) || 0, // 총 저수량 규모별
                
                // 지도 색상용 (종합 점수 사용)
                industry: parseFloat(values[8]) || 0
            };
        }
        
        console.log('CSV 데이터 로드 완료:', Object.keys(currentData).length + '개 지역');
        console.log('샘플 데이터:', Object.values(currentData)[0]);
        
    } catch (error) {
        console.error('CSV 데이터 로드 실패:', error);
        // 실패 시 샘플 데이터 사용
        currentData = {
            '강원 고성군': {
                region: '강원 고성군',
                farmCount: 1200,
                riceProduction: 520,
                polishedRice: 450,
                brownRice: 480,
                roughRice: 520,
                returnFarmers: 45,
                returnRatio: 3.75,
                overallScore: 72.5,
                distributionCount: 5,
                processingCount: 3,
                machineryCount: 85,
                waterCapacity: 1500.5,
                waterFacilities: 12,
                industry: 72.5
            }
        };
    }
}

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

// 값에 따른 색상 반환 (데이터 유형별 자동 색상)
function getColor(value, dataType = 'sample') {
    const scheme = dataTypeColorMap[dataType] || 'blues';
    const colors = colorSchemes[scheme];
    const allValues = Object.values(currentData).map(d => d.industry);
    
    if (allValues.length === 0) return colors[4];
    
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    const range = max - min;
    const stepSize = range / (colors.length - 1);
    
    const step = Math.floor((value - min) / stepSize);
    const colorIndex = Math.max(0, Math.min(step, colors.length - 1));
    
    return colors[colorIndex];
}

// GeoJSON 스타일 함수
function style(feature) {
    const regionName = feature.properties.CTP_KOR_NM || feature.properties.SIG_KOR_NM || feature.properties.name;
    const regionData = currentData[regionName];
    const value = regionData ? regionData.industry : 0;
    const dataType = document.getElementById('dataType').value;
    
    return {
        fillColor: getColor(value, dataType),
        weight: 2,
        opacity: 1,
        color: '#ffffff',
        dashArray: '',
        fillOpacity: regionData ? 1 : 0.3,
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
    
    let tooltipContent = `<strong>${regionName}</strong>`;
    if (data && data.overallScore > 0) {
        tooltipContent += `<br>종합 점수: ${data.overallScore}점`;
        tooltipContent += `<br>농가 수: ${data.farmCount.toLocaleString()}개`;
        tooltipContent += `<br>쌀 생산량: ${data.riceProduction} kg/10a`;
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
    
    regionInfoOverlay.classList.remove('show');
    
    document.querySelectorAll('.data-panel').forEach(panel => {
        panel.classList.remove('show');
    });
    
    setTimeout(() => {
        panelsOverlay.style.display = 'none';
        
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
    }, 300);
    
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
        
        if (data && data.overallScore > 0) {
            summaryHTML += `
                <div class="region-card ${index === 1 ? 'region-2' : ''}">
                    <h5>지역 ${index + 1}: ${regionName}</h5>
                    <p>종합 점수: ${data.overallScore}점</p>
                    <p>농가 수: ${data.farmCount.toLocaleString()}개</p>
                    <p>귀농 인구: ${data.returnFarmers}명 (${data.returnRatio}%)</p>
                </div>
            `;
        } else {
            summaryHTML += `
                <div class="region-card ${index === 1 ? 'region-2' : ''}">
                    <h5>지역 ${index + 1}: ${regionName}</h5>
                    <p>데이터 없음</p>
                </div>
            `;
        }
    });
    
    regionSummary.innerHTML = summaryHTML;
    regionInfoOverlay.style.display = 'block';
    
    setTimeout(() => {
        regionInfoOverlay.classList.add('show');
    }, 50);
}

// 데이터 패널 업데이트
function updateDataPanels() {
    const panelsOverlay = document.getElementById('data-panels-overlay');
    
    if (selectedLayers.length === 0) {
        document.querySelectorAll('.data-panel').forEach(panel => {
            panel.classList.remove('show');
        });
        
        setTimeout(() => {
            panelsOverlay.style.display = 'none';
            
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
    }).filter(region => region.data && region.data.overallScore > 0);
    
    panelsOverlay.style.display = 'block';
    
    setTimeout(() => {
        document.querySelectorAll('.data-panel').forEach(panel => {
            panel.classList.add('show');
        });
    }, 50);
    
    setTimeout(() => {
        updateChart1(selectedRegions); // 산업 현황 (생산량)
        updateChart2(selectedRegions); // 인구 통계 (농가/귀농)
        updateChart3(selectedRegions); // 경제 지표 (유통/처리장)
        updateChart4(selectedRegions); // 환경 지표 (인프라)
    }, 300);
}

// 차트 1: 산업 현황 (쌀 생산량 종류별 비교)
function updateChart1(regions) {
    const ctx = document.getElementById('chart-1').getContext('2d');
    
    if (charts.chart1) {
        charts.chart1.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: regions.map(r => r.name.split(' ').pop()),
        datasets: [
            {
                label: '정곡 (kg/10a)',
                data: regions.map(r => r.data.polishedRice),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 2
            },
            {
                label: '현미 (kg/10a)',
                data: regions.map(r => r.data.brownRice),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 2
            },
            {
                label: '조곡 (kg/10a)',
                data: regions.map(r => r.data.roughRice),
                backgroundColor: '#f39c12',
                borderColor: '#e67e22',
                borderWidth: 2
            }
        ]
    };
    
    charts.chart1 = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// 차트 2: 인구 통계 (농가 수 vs 귀농 인구)
function updateChart2(regions) {
    const ctx = document.getElementById('chart-2').getContext('2d');
    
    if (charts.chart2) {
        charts.chart2.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: regions.map(r => r.name.split(' ').pop()),
        datasets: [
            {
                label: '농가 수',
                data: regions.map(r => r.data.farmCount),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: '귀농 인구',
                data: regions.map(r => r.data.returnFarmers),
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    };
    
    charts.chart2 = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// 차트 3: 경제 지표 (유통망, 미곡처리장, 종합점수)
function updateChart3(regions) {
    const ctx = document.getElementById('chart-3').getContext('2d');
    
    if (charts.chart3) {
        charts.chart3.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: ['유통망 수', '미곡처리장 수', '종합점수'],
        datasets: regions.map((region, index) => ({
            label: region.name.split(' ').pop(),
            data: [
                region.data.distributionCount,
                region.data.processingCount,
                region.data.overallScore
            ],
            borderColor: index === 0 ? '#3498db' : '#e74c3c',
            backgroundColor: index === 0 ? 'rgba(52, 152, 219, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
        }))
    };
    
    charts.chart3 = new Chart(ctx, {
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
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.2)' }
                }
            }
        }
    });
}

// 차트 4: 환경/인프라 지표 (농기계, 저수 시설)
function updateChart4(regions) {
    const ctx = document.getElementById('chart-4').getContext('2d');
    
    if (charts.chart4) {
        charts.chart4.destroy();
    }
    
    if (regions.length === 0) return;
    
    const data = {
        labels: regions.map(r => r.name.split(' ').pop()),
        datasets: [
            {
                label: '임대 농기계 수',
                data: regions.map(r => r.data.machineryCount),
                backgroundColor: '#27ae60',
                borderColor: '#229954',
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: '저수 시설 수',
                data: regions.map(r => r.data.waterFacilities),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    };
    
    charts.chart4 = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }
                },
                x: {
                    grid: { display: false }
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
        const url = './map/skorea-mixed-2018-geo.json';
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`파일을 찾을 수 없습니다: ${url}`);
        }
        const geoData = await response.json();
        
        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }
        
        geojsonLayer = L.geoJSON(geoData, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        
        document.getElementById('loading').style.display = 'none';
        updateLegend();
        
    } catch (error) {
        console.error('GeoJSON 로드 실패:', error);
        
        const sampleGeoJSON = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"CTP_KOR_NM": "강원 고성군"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[128.0, 38.5], [128.1, 38.5], [128.1, 38.6], [128.0, 38.6], [128.0, 38.5]]]
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
    const dataType = document.getElementById('dataType').value;
    const scheme = dataTypeColorMap[dataType] || 'blues';
    const colors = colorSchemes[scheme];
    const allValues = Object.values(currentData).map(d => d.industry);
    
    if (allValues.length === 0) return;
    
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const stepSize = (max - min) / (colors.length - 1);
    
    const legendContent = document.getElementById('legend-content');
    legendContent.innerHTML = '';
    
    for (let i = colors.length - 1; i >= 0; i--) {
        const minValue = min + (stepSize * i);
        const maxValue = min + (stepSize * (i + 1));
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        if (i === colors.length - 1) {
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${colors[i]}"></div>
                <span>${minValue.toFixed(1)} - ${max.toFixed(1)} 점</span>
            `;
        } else {
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${colors[i]}"></div>
                <span>${minValue.toFixed(1)} - ${maxValue.toFixed(1)} 점</span>
            `;
        }
        
        legendContent.appendChild(legendItem);
    }
}

// 데이터 업데이트 (색상과 범례만 변경, 데이터 재로드 없음)
function updateData() {
    // 지도 스타일 업데이트 (색상만 변경)
    if (geojsonLayer) {
        geojsonLayer.setStyle(style);
        
        // 선택된 레이어들 스타일 다시 적용
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
    
    // 범례만 업데이트 (색상 변경)
    updateLegend();
    
    // 차트 데이터는 동일하므로 다시 로드하지 않음
    // 선택된 지역과 패널 내용은 그대로 유지
}

// 이벤트 리스너 등록
document.getElementById('dataType').addEventListener('change', updateData);

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadCSVData();
    initMap();
    loadGeoJSON();
});