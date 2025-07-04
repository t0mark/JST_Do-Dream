// 전역 변수
let map;
let geojsonLayer;
let currentData = {};
let selectedLayers = [];
let charts = {};
let rankingMainChart = null;
let simulationChart = null;
let isRankingView = false;
let isSimulationView = false;

// 시뮬레이션 관련 변수
let jeonjuData = null;
let simulationData = {};

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
    overall: 'blues',          // 종합 점수 - 블루
    production: 'greens',      // 생산량 지수 - 그린
    infrastructure: 'oranges', // 인프라 지수 - 오렌지
    distribution: 'reds',      // 유통 역량 - 레드
    migration: 'purples'       // 귀농 활성도 - 퍼플
};

// 데이터 유형별 설명
const dataTypeDescriptions = {
    overall: {
        title: '📊 종합 점수',
        description: '지역의 농업 전반에 대한 종합적인 평가 점수입니다. 모든 농업 지표를 종합하여 산출됩니다.',
        borderColor: '#3498db'
    },
    production: {
        title: '🌾 생산량 지수',
        description: '10a당 총 쌀 생산량을 기준으로 한 농업 생산성 지표입니다. 높을수록 생산성이 우수합니다.',
        borderColor: '#4caf50'
    },
    infrastructure: {
        title: '🚜 인프라 지수',
        description: '농기계 보유량과 저수 시설을 종합한 농업 인프라 수준입니다. 농업 기반 시설의 충실도를 나타냅니다.',
        borderColor: '#ff9800'
    },
    distribution: {
        title: '🏪 유통 역량',
        description: '유통망과 미곡처리장 수를 기반으로 한 농산물 유통 인프라 수준입니다.',
        borderColor: '#f44336'
    },
    migration: {
        title: '🏡 귀농 활성도',
        description: '전체 농가 대비 귀농 인구 비율로 측정하는 지역의 귀농 유입 활성화 정도입니다.',
        borderColor: '#9c27b0'
    }
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
            
            // 만약 종합 점수가 1보다 크면 100으로 나누어 0~1 범위로 변환
            if (currentData[regionName].overallScore > 1) {
                currentData[regionName].overallScore = currentData[regionName].overallScore / 100;
                currentData[regionName].industry = currentData[regionName].overallScore;
            }
        }
        
        // 전주시 데이터 찾기
        findJeonjuData();
        
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
                overallScore: 0.7250,
                distributionCount: 5,
                processingCount: 3,
                machineryCount: 85,
                waterCapacity: 1500.5,
                waterFacilities: 12,
                industry: 0.7250
            }
        };
    }
}

// 전주시 데이터 찾기
function findJeonjuData() {
    // 전주시 또는 전북 전주시 등으로 검색
    const jeonjuKeys = Object.keys(currentData).filter(key => 
        key.includes('전주') || key.includes('전북 전주')
    );
    
    if (jeonjuKeys.length > 0) {
        jeonjuData = currentData[jeonjuKeys[0]];
        console.log('전주시 데이터 발견:', jeonjuKeys[0], jeonjuData);
    } else {
        // 전주시 데이터가 없으면 샘플 데이터 생성
        jeonjuData = {
            region: '전북 전주시',
            farmCount: 3500,
            riceProduction: 520,
            polishedRice: 450,
            brownRice: 480,
            roughRice: 520,
            returnFarmers: 120,
            returnRatio: 3.4,
            overallScore: 0.7580,
            distributionCount: 15,
            processingCount: 8,
            machineryCount: 180,
            waterCapacity: 2500,
            waterFacilities: 25,
            industry: 0.7580
        };
        console.log('전주시 데이터 없음 - 샘플 데이터 사용');
    }
    
    // 시뮬레이션 데이터 초기화
    simulationData = { ...jeonjuData };
}

// 3년 후 예상 점수 계산 함수
function calculate3YearProjectedScore(data) {
    // 각 지표를 정규화하고 가중치를 적용 (미래 예측 모델)
    const weights = {
        farmCount: 0.20,        // 농가 수 - 20%
        returnFarmers: 0.10,    // 귀농 인구 - 10%
        riceProduction: 0.25,   // 쌀 생산량 - 25%
        distributionCount: 0.15, // 유통망 수 - 15%
        processingCount: 0.10,   // 미곡처리장 수 - 10%
        machineryCount: 0.10,    // 농기계 수 - 10%
        waterFacilities: 0.10    // 저수 시설 수 - 10%
    };
    
    // 정규화를 위한 기준값들 (3년 후 예상 최대값)
    const maxValues = {
        farmCount: 10000,
        returnFarmers: 500,
        riceProduction: 700,
        distributionCount: 50,
        processingCount: 30,
        machineryCount: 500,
        waterFacilities: 100
    };
    
    let score = 0;
    
    // 각 지표를 정규화하고 가중치 적용
    Object.keys(weights).forEach(key => {
        if (data[key] !== undefined && maxValues[key] > 0) {
            const normalizedValue = Math.min(data[key] / maxValues[key], 1);
            score += normalizedValue * weights[key];
        }
    });
    
    // 3년 간 성장률 반영 (약간의 보너스 점수 추가)
    const growthBonus = 0.02; // 2% 성장 반영 (보수적 추정)
    score = Math.min(score * (1 + growthBonus), 1);
    
    return Math.round(score * 10000) / 10000; // 소수점 4자리로 0~1 범위
}

// 지도 초기화
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        scrollWheelZoom: true,
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
    
    // 종합 점수일 때 특별한 색상 구분 적용
    if (dataType === 'overall') {
        if (value <= 0.5) {
            return colors[0]; // 0.5 이하 - 가장 연한 색
        } else if (value <= 0.55) {
            return colors[1]; // 0.5 ~ 0.55
        } else if (value <= 0.6) {
            return colors[2]; // 0.55 ~ 0.6
        } else if (value <= 0.65) {
            return colors[3]; // 0.6 ~ 0.65
        } else if (value <= 0.7) {
            return colors[4]; // 0.65 ~ 0.7
        } else if (value <= 0.75) {
            return colors[5]; // 0.7 ~ 0.75
        } else if (value <= 0.8) {
            return colors[6]; // 0.75 ~ 0.8
        } else if (value <= 0.9) {
            return colors[7]; // 0.8 ~ 0.9
        } else {
            return colors[8]; // 0.9 이상 - 가장 진한 색
        }
    }
    
    // 다른 데이터 유형은 기존 방식 사용
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
    const dataType = document.getElementById('dataType').value;
    
    let tooltipContent = `<strong>${regionName}</strong>`;
    if (data && data.industry > 0) {
        switch (dataType) {
            case 'overall':
                tooltipContent += `<br>종합 점수: ${data.overallScore.toFixed(4)}`;
                break;
            case 'production':
                tooltipContent += `<br>쌀 생산량: ${data.riceProduction} kg/10a`;
                break;
            case 'infrastructure':
                tooltipContent += `<br>인프라 지수: ${data.industry.toFixed(1)}`;
                tooltipContent += `<br>농기계: ${data.machineryCount}대, 저수시설: ${data.waterFacilities}개`;
                break;
            case 'distribution':
                tooltipContent += `<br>유통 역량: ${data.industry}`;
                tooltipContent += `<br>유통망: ${data.distributionCount}개, 처리장: ${data.processingCount}개`;
                break;
            case 'migration':
                tooltipContent += `<br>귀농 비율: ${data.returnRatio}%`;
                tooltipContent += `<br>귀농 인구: ${data.returnFarmers}명`;
                break;
            default:
                tooltipContent += `<br>값: ${data.industry.toFixed(1)}`;
        }
    } else {
        tooltipContent += `<br><em>데이터 없음</em>`;
    }
    
    // 팝업을 드래그할 수 없도록 설정
    const tooltip = L.popup({
        closeButton: false,
        autoClose: true,
        closeOnClick: false,
        className: 'tooltip',
        // 드래그 비활성화 옵션들
        draggable: false,
        interactive: false,
        bubblingMouseEvents: false
    })
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
    const dataType = document.getElementById('dataType').value;
    
    if (selectedLayers.length === 0) {
        regionInfoOverlay.classList.remove('show');
        return;
    }
    
    let summaryHTML = '';
    selectedLayers.forEach((layer, index) => {
        const regionName = layer.feature.properties.CTP_KOR_NM || layer.feature.properties.SIG_KOR_NM || layer.feature.properties.name;
        const data = currentData[regionName];
        
        if (data && data.industry > 0) {
            let detailInfo = '';
            switch (dataType) {
                case 'overall':
                    detailInfo = `종합 점수: ${data.overallScore.toFixed(4)}<br>농가 수: ${data.farmCount.toLocaleString()}개`;
                    break;
                case 'production':
                    detailInfo = `쌀 생산량: ${data.riceProduction} kg/10a<br>정곡: ${data.polishedRice} kg/10a`;
                    break;
                case 'infrastructure':
                    detailInfo = `인프라 지수: ${data.industry.toFixed(1)}<br>농기계: ${data.machineryCount}대, 저수시설: ${data.waterFacilities}개`;
                    break;
                case 'distribution':
                    detailInfo = `유통 역량: ${data.industry}<br>유통망: ${data.distributionCount}개, 처리장: ${data.processingCount}개`;
                    break;
                case 'migration':
                    detailInfo = `귀농 비율: ${data.returnRatio}%<br>귀농 인구: ${data.returnFarmers}명`;
                    break;
            }
            
            summaryHTML += `
                <div class="region-card ${index === 1 ? 'region-2' : ''}">
                    <h5>지역 ${index + 1}: ${regionName}</h5>
                    <p>${detailInfo}</p>
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
                    display: true,
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
    
    // 카테고리별 단위 설정
    let unit = '';
    switch (dataType) {
        case 'overall':
            unit = '점';
            break;
        case 'production':
            unit = '지수';
            break;
        case 'infrastructure':
            unit = '지수';
            break;
        case 'distribution':
            unit = '점수';
            break;
        case 'migration':
            unit = '%';
            break;
        default:
            unit = '';
    }
    
    const legendContent = document.getElementById('legend-content');
    legendContent.innerHTML = '';
    
    // 종합 점수일 때 특별한 범례 표시
    if (dataType === 'overall') {
        const ranges = [
            { min: 0.9, max: 1.0, color: colors[8] },
            { min: 0.8, max: 0.9, color: colors[7] },
            { min: 0.75, max: 0.8, color: colors[6] },
            { min: 0.7, max: 0.75, color: colors[5] },
            { min: 0.65, max: 0.7, color: colors[4] },
            { min: 0.6, max: 0.65, color: colors[3] },
            { min: 0.55, max: 0.6, color: colors[2] },
            { min: 0.5, max: 0.55, color: colors[1] },
            { min: 0.0, max: 0.5, color: colors[0] }
        ];
        
        ranges.forEach(range => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            if (range.min === 0.0) {
                legendItem.innerHTML = `
                    <div class="legend-color" style="background-color: ${range.color}"></div>
                    <span>${range.max.toFixed(1)} 이하 ${unit}</span>
                `;
            } else if (range.max === 1.0) {
                legendItem.innerHTML = `
                    <div class="legend-color" style="background-color: ${range.color}"></div>
                    <span>${range.min.toFixed(2)} 이상 ${unit}</span>
                `;
            } else {
                legendItem.innerHTML = `
                    <div class="legend-color" style="background-color: ${range.color}"></div>
                    <span>${range.min.toFixed(2)} - ${range.max.toFixed(2)} ${unit}</span>
                `;
            }
            
            legendContent.appendChild(legendItem);
        });
    } else {
        // 다른 데이터 유형은 기존 방식 사용
        const allValues = Object.values(currentData).map(d => d.industry);
        
        if (allValues.length === 0) return;
        
        const max = Math.max(...allValues);
        const min = Math.min(...allValues);
        const stepSize = (max - min) / (colors.length - 1);
        
        for (let i = colors.length - 1; i >= 0; i--) {
            const minValue = min + (stepSize * i);
            const maxValue = min + (stepSize * (i + 1));
            
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            if (i === colors.length - 1) {
                legendItem.innerHTML = `
                    <div class="legend-color" style="background-color: ${colors[i]}"></div>
                    <span>${minValue.toFixed(1)} - ${max.toFixed(1)} ${unit}</span>
                `;
            } else {
                legendItem.innerHTML = `
                    <div class="legend-color" style="background-color: ${colors[i]}"></div>
                    <span>${minValue.toFixed(1)} - ${maxValue.toFixed(1)} ${unit}</span>
                `;
            }
            
            legendContent.appendChild(legendItem);
        }
    }
}

// 카테고리별 데이터 값 업데이트
function updateDataValues() {
    const dataType = document.getElementById('dataType').value;
    
    // 생산량 지수를 위한 정규화 처리
    if (dataType === 'production') {
        const riceProductionValues = Object.values(currentData).map(d => d.riceProduction).filter(v => v > 0);
        const minProduction = Math.min(...riceProductionValues);
        const maxProduction = Math.max(...riceProductionValues);
        const productionRange = maxProduction - minProduction;
        
        Object.keys(currentData).forEach(regionName => {
            const regionData = currentData[regionName];
            if (regionData.riceProduction > 0 && productionRange > 0) {
                // 0~1 사이의 정규화된 값으로 변환
                regionData.industry = (regionData.riceProduction - minProduction) / productionRange;
            } else {
                regionData.industry = 0;
            }
        });
    } else {
        Object.keys(currentData).forEach(regionName => {
            const regionData = currentData[regionName];
            
            switch (dataType) {
                case 'overall':
                    // 종합 점수 사용
                    regionData.industry = regionData.overallScore;
                    break;
                    
                case 'infrastructure':
                    // 농기계 수와 저수 시설의 가중 평균 (정규화)
                    const normalizedMachinery = regionData.machineryCount / 10; // 스케일 조정
                    const normalizedWater = regionData.waterFacilities * 5; // 스케일 조정
                    regionData.industry = (normalizedMachinery + normalizedWater) / 2;
                    break;
                    
                case 'distribution':
                    // 유통망 수와 미곡처리장 수의 가중합
                    regionData.industry = (regionData.distributionCount * 3) + (regionData.processingCount * 2);
                    break;
                    
                case 'migration':
                    // 귀농 비율 사용
                    regionData.industry = regionData.returnRatio;
                    break;
                    
                default:
                    regionData.industry = regionData.overallScore;
            }
        });
    }
}

// 카테고리 설명 업데이트
function updateCategoryDescription() {
    const dataType = document.getElementById('dataType').value;
    const categoryInfo = document.getElementById('category-info');
    const categoryDescription = document.querySelector('.category-description');
    const info = dataTypeDescriptions[dataType];
    
    if (info && categoryInfo && categoryDescription) {
        categoryInfo.innerHTML = `
            <h5>${info.title}</h5>
            <p>${info.description}</p>
        `;
        
        // 테두리 색상도 카테고리에 맞게 변경
        categoryDescription.style.borderLeftColor = info.borderColor;
    }
}

// 데이터 업데이트 (실제 데이터 값 변경)
function updateData() {
    // 카테고리에 따른 실제 데이터 값 업데이트
    updateDataValues();
    
    // 지도 스타일 업데이트 (색상과 값 모두 변경)
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
    
    // 범례 업데이트 (새로운 값 범위로)
    updateLegend();
    
    // 카테고리 설명 업데이트
    updateCategoryDescription();
    
    // 선택된 지역의 툴팁 정보도 업데이트
    if (selectedLayers.length > 0) {
        updateRegionInfo();
    }
}

// 순위 데이터 생성 (수정된 부분)
function getRankingData() {
    // 종합 점수 기준으로 정렬
    const sortedRegions = Object.entries(currentData)
        .filter(([regionName, data]) => data.overallScore && data.overallScore > 0)
        .sort((a, b) => b[1].overallScore - a[1].overallScore);
    
    // Top 5 추출
    const top5 = sortedRegions.slice(0, 5);
    
    // 하위 5 추출 (꼴지와 뒤에서 2등 제외, 뒤에서 3등부터 7등까지)
    const bottom5 = sortedRegions.slice(-7, -2); // 뒤에서 7등부터 3등까지, 낮은 등수(뒤에서 3등)가 오른쪽에 오도록
    
    // 전북 전주시 찾기
    const jeonjuData = sortedRegions.find(([regionName, data]) => 
        regionName.includes('전주') || regionName.includes('전북 전주시')
    );
    
    let rankingData = [];
    
    // Top 5 추가
    rankingData = [...top5];
    
    // 전주시가 Top 5에 없고 하위 5에도 없으면 중간에 추가
    if (jeonjuData) {
        const jeonjuRank = sortedRegions.findIndex(([name]) => name === jeonjuData[0]) + 1;
        const isInTop5 = jeonjuRank <= 5;
        const isInBottom5 = jeonjuRank > (sortedRegions.length - 7); // 뒤에서 7등까지 체크
        
        if (!isInTop5 && !isInBottom5) {
            rankingData.push(jeonjuData);
        }
    }
    
    // 하위 5 추가
    rankingData = [...rankingData, ...bottom5];
    
    // 중복 제거 (전주시가 이미 포함된 경우)
    const uniqueRankingData = [];
    const seenRegions = new Set();
    
    for (const [regionName, data] of rankingData) {
        if (!seenRegions.has(regionName)) {
            uniqueRankingData.push([regionName, data]);
            seenRegions.add(regionName);
        }
    }
    
    return {
        data: uniqueRankingData,
        jeonjuRank: jeonjuData ? sortedRegions.findIndex(([name]) => name === jeonjuData[0]) + 1 : null,
        totalRegions: sortedRegions.length
    };
}

// 1등 지역 정보 가져오기
function getTopRegionInfo() {
    const sortedRegions = Object.entries(currentData)
        .filter(([regionName, data]) => data.overallScore && data.overallScore > 0)
        .sort((a, b) => b[1].overallScore - a[1].overallScore);
    
    if (sortedRegions.length > 0) {
        const [topRegionName, topRegionData] = sortedRegions[0];
        return {
            name: topRegionName,
            score: topRegionData.overallScore
        };
    }
    
    return {
        name: '1위 지역',
        score: 1.0000
    };
}
// 전주시 현재 순위 계산
function getJeonjuRank(score = null) {
    const scoreToUse = score || jeonjuData.overallScore;
    const sortedRegions = Object.entries(currentData)
        .filter(([regionName, data]) => data.overallScore && data.overallScore > 0)
        .sort((a, b) => b[1].overallScore - a[1].overallScore);
    
    // 점수 기준으로 순위 계산
    let rank = 1;
    for (const [regionName, data] of sortedRegions) {
        if (data.overallScore > scoreToUse) {
            rank++;
        } else {
            break;
        }
    }
    
    return rank;
}

// 시뮬레이션 슬라이더 초기화
function initializeSliders() {
    if (!jeonjuData) return;
    
    const sliders = [
        { id: 'farmCount', value: jeonjuData.farmCount },
        { id: 'returnFarmers', value: jeonjuData.returnFarmers },
        { id: 'riceProduction', value: jeonjuData.riceProduction },
        { id: 'distributionCount', value: jeonjuData.distributionCount },
        { id: 'processingCount', value: jeonjuData.processingCount },
        { id: 'machineryCount', value: jeonjuData.machineryCount },
        { id: 'waterFacilities', value: jeonjuData.waterFacilities }
    ];
    
    sliders.forEach(({ id, value }) => {
        const slider = document.getElementById(`slider-${id}`);
        const valueDisplay = document.getElementById(`value-${id}`);
        
        if (slider && valueDisplay) {
            slider.value = value;
            valueDisplay.textContent = value;
            
            // 슬라이더 이벤트 리스너
            slider.addEventListener('input', (e) => {
                const newValue = parseInt(e.target.value);
                valueDisplay.textContent = newValue;
                simulationData[id] = newValue;
                updateSimulationScores();
            });
        }
    });
}

// 시뮬레이션 점수 업데이트
function updateSimulationScores() {
    if (!jeonjuData) return;
    
    const currentScore = jeonjuData.overallScore;
    const predictedScore = calculate3YearProjectedScore(simulationData);
    const difference = predictedScore - currentScore;
    
    // 점수 표시 업데이트
    document.getElementById('current-score').textContent = currentScore.toFixed(4);
    document.getElementById('predicted-score').textContent = predictedScore.toFixed(4);
    
    const differenceElement = document.getElementById('score-difference');
    differenceElement.textContent = (difference >= 0 ? '+' : '') + difference.toFixed(4);
    differenceElement.style.color = difference >= 0 ? '#27ae60' : '#e74c3c';
    
    // 순위 업데이트
    const currentRank = getJeonjuRank();
    const predictedRank = getJeonjuRank(predictedScore);
    const topRegionInfo = getTopRegionInfo();
    
    document.getElementById('current-rank').textContent = currentRank;
    document.getElementById('predicted-rank').textContent = predictedRank;
    document.getElementById('predicted-rank').style.color = predictedRank < currentRank ? '#27ae60' : (predictedRank > currentRank ? '#e74c3c' : '#2c3e50');
    
    // 1등과의 격차 정보 업데이트
    const gapToFirst = topRegionInfo.score - predictedScore;
    const gapElement = document.getElementById('gap-to-first');
    if (gapElement) {
        gapElement.textContent = gapToFirst.toFixed(4);
        gapElement.style.color = gapToFirst <= 0.01 ? '#27ae60' : '#e74c3c';
    }
    
    const topRegionElement = document.getElementById('top-region-name');
    if (topRegionElement) {
        topRegionElement.textContent = topRegionInfo.name;
    }
    
    // 차트 업데이트 (부드러운 애니메이션)
    updateSimulationChart();
}

// 시뮬레이션 차트 생성 (초기 한 번만)
function createSimulationChart() {
    const ctx = document.getElementById('simulation-chart').getContext('2d');
    
    const topRegionInfo = getTopRegionInfo();
    const currentScore = jeonjuData.overallScore;
    const predictedScore = calculate3YearProjectedScore(simulationData);
    
    simulationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [`1등: ${topRegionInfo.name.split(' ').pop()}`, '현재 전주시 (2024)', '3년 후 목표 (2027)'],
            datasets: [{
                label: '종합 점수',
                data: [topRegionInfo.score, currentScore, predictedScore],
                backgroundColor: ['#f39c12', '#3498db', '#27ae60'],
                borderColor: ['#e67e22', '#2980b9', '#229954'],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            return `점수: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    grid: {
                        color: 'rgba(0,0,0,0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#2c3e50',
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    },
                    title: {
                        display: true,
                        text: '종합 점수 (0~1)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: '#2c3e50',
                        maxRotation: 45
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            }
        }
    });
}

// 시뮬레이션 차트 데이터 업데이트 (자연스러운 애니메이션)
function updateSimulationChart() {
    if (!simulationChart) {
        createSimulationChart();
        return;
    }
    
    const topRegionInfo = getTopRegionInfo();
    const currentScore = jeonjuData.overallScore;
    const predictedScore = calculate3YearProjectedScore(simulationData);
    
    // 라벨 업데이트 (1등 지역이 바뀔 수 있으므로)
    simulationChart.data.labels = [`1등: ${topRegionInfo.name.split(' ').pop()}`, '현재 전주시 (2024)', '3년 후 목표 (2027)'];
    
    // 데이터만 업데이트하고 차트를 다시 그리기
    simulationChart.data.datasets[0].data = [topRegionInfo.score, currentScore, predictedScore];
    
    // 3년 후 점수에 따라 색상 동적 변경
    const difference = predictedScore - currentScore;
    if (difference > 0) {
        simulationChart.data.datasets[0].backgroundColor[2] = '#27ae60'; // 녹색 (증가)
        simulationChart.data.datasets[0].borderColor[2] = '#229954';
    } else if (difference < 0) {
        simulationChart.data.datasets[0].backgroundColor[2] = '#e74c3c'; // 빨강 (감소)
        simulationChart.data.datasets[0].borderColor[2] = '#c0392b';
    } else {
        simulationChart.data.datasets[0].backgroundColor[2] = '#95a5a6'; // 회색 (변화없음)
        simulationChart.data.datasets[0].borderColor[2] = '#7f8c8d';
    }
    
    // 1등과의 격차에 따른 시각적 피드백
    const gapToFirst = topRegionInfo.score - predictedScore;
    if (gapToFirst <= 0.01) { // 1등과 거의 비슷하면
        simulationChart.data.datasets[0].backgroundColor[2] = '#9b59b6'; // 보라색 (최고 수준)
        simulationChart.data.datasets[0].borderColor[2] = '#8e44ad';
    }
    
    // 부드러운 애니메이션으로 업데이트
    simulationChart.update('active');
}

// 슬라이더 리셋
function resetSliders() {
    simulationData = { ...jeonjuData };
    initializeSliders();
    updateSimulationScores();
}

// 메인 순위 차트 생성 (지도 영역에 크게 표시) - 수정된 부분
function createRankingChart() {
    const ctx = document.getElementById('ranking-main-chart').getContext('2d');
    const rankingInfo = getRankingData();
    const rankingData = rankingInfo.data;
    
    if (rankingMainChart) {
        rankingMainChart.destroy();
    }
    
    const labels = rankingData.map(([regionName]) => regionName);
    const scores = rankingData.map(([, data]) => data.overallScore);
    
    // 실제 순위 계산
    const actualRanks = rankingData.map(([regionName]) => {
        const sortedRegions = Object.entries(currentData)
            .filter(([regionName, data]) => data.overallScore && data.overallScore > 0)
            .sort((a, b) => b[1].overallScore - a[1].overallScore);
        return sortedRegions.findIndex(([name]) => name === regionName) + 1;
    });
    
    // 실제 데이터 범위 계산
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore;
    const yAxisMax = maxScore + (scoreRange * 0.1);
    const yAxisMin = Math.max(0, minScore - (scoreRange * 0.1));
    
    // 색상 설정 (Top 5, 전주시, 하위 5 구분)
    const backgroundColors = rankingData.map(([regionName], index) => {
        const actualRank = actualRanks[index];
        if (regionName.includes('전주')) {
            return '#f39c12'; // 전주시는 오렌지
        } else if (actualRank <= 5) {
            return '#27ae60'; // Top 5는 그린
        } else if (actualRank > (rankingInfo.totalRegions - 5)) {
            return '#e74c3c'; // 하위 5는 레드
        } else {
            return '#3498db'; // 중간은 블루
        }
    });
    
    const borderColors = backgroundColors.map(color => {
        if (color === '#f39c12') return '#e67e22';
        if (color === '#27ae60') return '#229954';
        if (color === '#e74c3c') return '#c0392b';
        return '#2980b9';
    });
    
    rankingMainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '종합 점수',
                data: scores,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 3,
                borderRadius: 12,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            const actualRank = actualRanks[index];
                            return `${actualRank}위: ${rankingData[index][0]}`;
                        },
                        label: function(context) {
                            return `종합 점수: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: yAxisMin,
                    max: Math.min(yAxisMax, 1),
                    grid: {
                        color: 'rgba(0,0,0,0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50',
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    },
                    title: {
                        display: true,
                        text: '종합 점수 (0~1)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: '#2c3e50',
                        maxRotation: 45
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            }
        }
    });
    
    // 순위 상세 정보 업데이트
    updateRankingDetails(rankingInfo, actualRanks);
}

// 순위 상세 정보 업데이트 - 수정된 부분
function updateRankingDetails(rankingInfo, actualRanks) {
    const detailsContainer = document.getElementById('ranking-details');
    const rankingData = rankingInfo.data;
    
    let detailsHTML = '';
    
    rankingData.forEach(([regionName, data], index) => {
        const isJeonju = regionName.includes('전주');
        const actualRank = actualRanks[index];
        
        // 순위 그룹 표시
        let rankGroup = '';
        if (actualRank <= 5) {
            rankGroup = '🏆 ';
        } else if (actualRank > (rankingInfo.totalRegions - 5)) {
            rankGroup = '📉 ';
        }
        
        detailsHTML += `
            <div class="ranking-item ${isJeonju ? 'jeonju' : ''}">
                <span class="ranking-number">${rankGroup}${actualRank}위</span>
                <span class="ranking-region">${regionName}</span>
                <span class="ranking-score">${data.overallScore.toFixed(4)}</span>
            </div>
        `;
    });
    
    detailsContainer.innerHTML = detailsHTML;
}

// 순위 뷰 표시
function showRanking() {
    isRankingView = true;
    isSimulationView = false;
    
    // 기존 패널들 모두 닫기
    closePanels();
    
    // 카테고리를 종합 점수로 자동 변경
    const dataTypeSelect = document.getElementById('dataType');
    dataTypeSelect.value = 'overall';
    
    // 데이터 업데이트 (종합 점수 기준으로)
    updateDataValues();
    updateCategoryDescription();
    
    // 지도 스타일도 업데이트 (지도로 돌아갔을 때를 위해)
    if (geojsonLayer) {
        geojsonLayer.setStyle(style);
        updateLegend();
    }
    
    // 다른 뷰들 숨기고 순위 뷰 표시
    document.getElementById('map').style.display = 'none';
    document.getElementById('simulation-view').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'flex';
    
    // 사이드바 내용 전환
    document.getElementById('map-sidebar-content').style.display = 'none';
    document.getElementById('simulation-sidebar-content').style.display = 'none';
    document.getElementById('ranking-sidebar-content').style.display = 'block';
    
    // 메인 순위 차트 생성
    setTimeout(() => {
        createRankingChart();
    }, 100);
}

// 시뮬레이션 뷰 표시
function showSimulation() {
    isRankingView = false;
    isSimulationView = true;
    
    // 기존 패널들 모두 닫기
    closePanels();
    
    if (!jeonjuData) {
        alert('전주시 데이터를 찾을 수 없습니다.');
        return;
    }
    
    // 다른 뷰들 숨기고 시뮬레이션 뷰 표시
    document.getElementById('map').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('simulation-view').style.display = 'flex';
    
    // 사이드바 내용 전환
    document.getElementById('map-sidebar-content').style.display = 'none';
    document.getElementById('ranking-sidebar-content').style.display = 'none';
    document.getElementById('simulation-sidebar-content').style.display = 'block';
    
    // 시뮬레이션 초기화
    setTimeout(() => {
        initializeSliders();
        createSimulationChart();
        updateSimulationScores();
    }, 100);
}

// 지도 뷰 표시
function showMap() {
    isRankingView = false;
    isSimulationView = false;
    
    // 모든 뷰 숨기고 지도 표시
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('simulation-view').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    
    // 사이드바 내용 전환
    document.getElementById('map-sidebar-content').style.display = 'block';
    document.getElementById('ranking-sidebar-content').style.display = 'none';
    document.getElementById('simulation-sidebar-content').style.display = 'none';
    
    // 차트 정리
    if (rankingMainChart) {
        rankingMainChart.destroy();
        rankingMainChart = null;
    }
    
    if (simulationChart) {
        simulationChart.destroy();
        simulationChart = null;
    }
    
    // 지도 크기 재조정 (숨겨졌다가 다시 표시될 때 필요)
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 100);
}

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadCSVData();
    updateDataValues(); // 초기 카테고리에 맞는 데이터 값 설정
    initMap();
    loadGeoJSON();
    updateCategoryDescription(); // 초기 카테고리 설명 표시
    
    // 이벤트 리스너 등록
    document.getElementById('dataType').addEventListener('change', updateData);
    document.getElementById('showRankingBtn').addEventListener('click', showRanking);
    document.getElementById('showSimulationBtn').addEventListener('click', showSimulation);
    document.getElementById('backToMapBtn').addEventListener('click', showMap);
    document.getElementById('backToMapFromSimBtn').addEventListener('click', showMap);
    document.getElementById('resetSliders').addEventListener('click', resetSliders);
});