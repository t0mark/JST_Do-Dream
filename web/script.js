// 샘플 데이터 - 실제 데이터로 교체 가능
const sampleData = {
    population: {
        '서울특별시': 9.7, '부산광역시': 3.4, '대구광역시': 2.4, '인천광역시': 2.9, '광주광역시': 1.5,
        '대전광역시': 1.5, '울산광역시': 1.1, '세종특별자치시': 0.4, '수원시': 1.2, '성남시': 1.0,
        '고양시': 1.0, '용인시': 1.0, '부천시': 0.8, '안산시': 0.7, '안양시': 0.6, '남양주시': 0.7,
        '화성시': 0.8, '평택시': 0.5, '의정부시': 0.5, '시흥시': 0.4, '파주시': 0.5, '광명시': 0.3,
        '김포시': 0.5, '군포시': 0.3, '광주시': 0.4, '이천시': 0.2, '양주시': 0.2, '오산시': 0.2,
        '구리시': 0.2, '안성시': 0.2, '포천시': 0.2, '의왕시': 0.2, '하남시': 0.3, '동두천시': 0.1,
        '과천시': 0.06, '춘천시': 2.8, '원주시': 3.5, '강릉시': 2.1, '동해시': 0.9, '태백시': 0.5,
        '속초시': 0.8, '삼척시': 0.7, '홍천군': 0.7, '횡성군': 0.5, '영월군': 0.4, '평창군': 0.4,
        '정선군': 0.4, '철원군': 0.5, '화천군': 0.2, '양구군': 0.2, '인제군': 0.3, '고성군': 0.3,
        '양양군': 0.3, '청주시': 0.8, '충주시': 0.2, '제천시': 0.1, '천안시': 0.7, '공주시': 0.1,
        '보령시': 0.1, '아산시': 0.3, '서산시': 0.2, '논산시': 0.1, '계룡시': 0.04, '당진시': 0.2,
        '전주시': 0.7, '군산시': 0.3, '익산시': 0.3, '정읍시': 0.1, '남원시': 0.08, '김제시': 0.09,
        '목포시': 0.2, '여수시': 0.3, '순천시': 0.3, '나주시': 0.1, '광양시': 0.2, '포항시': 0.5,
        '경주시': 0.3, '김천시': 0.1, '안동시': 0.2, '구미시': 0.4, '영주시': 0.1, '영천시': 0.1,
        '상주시': 0.1, '문경시': 0.07, '경산시': 0.3, '창원시': 1.1, '진주시': 0.4, '통영시': 0.1,
        '사천시': 0.1, '김해시': 0.5, '밀양시': 0.1, '거제시': 0.3, '양산시': 0.4, '제주시': 0.5,
        '서귀포시': 0.2
    },
    development: {
        '서울특별시': 95, '부산광역시': 78, '대구광역시': 72, '인천광역시': 81, '광주광역시': 69,
        '대전광역시': 74, '울산광역시': 76, '세종특별자치시': 85, '수원시': 88, '성남시': 86,
        '고양시': 85, '용인시': 85, '부천시': 82, '안산시': 82, '안양시': 84, '남양주시': 80,
        '화성시': 83, '평택시': 75, '의정부시': 78, '시흥시': 79, '파주시': 76, '광명시': 83,
        '김포시': 79, '군포시': 83, '광주시': 78, '이천시': 74, '양주시': 75, '오산시': 77,
        '구리시': 81, '안성시': 73, '포천시': 68, '의왕시': 82, '하남시': 81, '동두천시': 71,
        '과천시': 92, '춘천시': 78, '원주시': 75, '강릉시': 72, '동해시': 68, '태백시': 58,
        '속초시': 70, '삼척시': 62, '홍천군': 60, '횡성군': 57, '영월군': 52, '평창군': 53,
        '정선군': 50, '철원군': 55, '화천군': 42, '양구군': 41, '인제군': 43, '고성군': 45,
        '양양군': 48, '청주시': 76, '충주시': 65, '제천시': 60, '천안시': 73, '공주시': 58,
        '보령시': 56, '아산시': 70, '서산시': 62, '논산시': 59, '계룡시': 68, '당진시': 64,
        '전주시': 72, '군산시': 66, '익산시': 64, '정읍시': 58, '남원시': 55, '김제시': 54,
        '목포시': 61, '여수시': 67, '순천시': 65, '나주시': 60, '광양시': 66, '포항시': 68,
        '경주시': 64, '김천시': 61, '안동시': 63, '구미시': 70, '영주시': 59, '영천시': 58,
        '상주시': 57, '문경시': 56, '경산시': 66, '창원시': 74, '진주시': 68, '통영시': 65,
        '사천시': 63, '김해시': 72, '밀양시': 60, '거제시': 67, '양산시': 71, '제주시': 74,
        '서귀포시': 68
    },
    economy: {
        '서울특별시': 87, '부산광역시': 65, '대구광역시': 58, '인천광역시': 72, '광주광역시': 54,
        '대전광역시': 63, '울산광역시': 68, '세종특별자치시': 71, '수원시': 84, '성남시': 82,
        '고양시': 81, '용인시': 81, '부천시': 78, '안산시': 78, '안양시': 80, '남양주시': 76,
        '화성시': 79, '평택시': 71, '의정부시': 74, '시흥시': 75, '파주시': 72, '광명시': 79,
        '김포시': 75, '군포시': 79, '광주시': 74, '이천시': 70, '양주시': 71, '오산시': 73,
        '구리시': 77, '안성시': 69, '포천시': 64, '의왕시': 78, '하남시': 77, '동두천시': 67,
        '과천시': 88, '춘천시': 74, '원주시': 71, '강릉시': 68, '동해시': 65, '태백시': 55,
        '속초시': 66, '삼척시': 58, '홍천군': 56, '횡성군': 53, '영월군': 48, '평창군': 50,
        '정선군': 47, '철원군': 52, '화천군': 39, '양구군': 38, '인제군': 40, '고성군': 42,
        '양양군': 45, '청주시': 72, '충주시': 61, '제천시': 56, '천안시': 69, '공주시': 54,
        '보령시': 52, '아산시': 66, '서산시': 58, '논산시': 55, '계룡시': 64, '당진시': 60,
        '전주시': 68, '군산시': 62, '익산시': 60, '정읍시': 54, '남원시': 51, '김제시': 50,
        '목포시': 57, '여수시': 63, '순천시': 61, '나주시': 56, '광양시': 62, '포항시': 64,
        '경주시': 60, '김천시': 57, '안동시': 59, '구미시': 66, '영주시': 55, '영천시': 54,
        '상주시': 53, '문경시': 52, '경산시': 62, '창원시': 70, '진주시': 64, '통영시': 61,
        '사천시': 59, '김해시': 68, '밀양시': 56, '거제시': 63, '양산시': 67, '제주시': 70,
        '서귀포시': 64
    }
};

// 실제 한국 지도 좌표 데이터 (간소화된 시군구별)
const koreaRegions = [
    // 서울 & 인천
    { name: '서울특별시', path: 'M 200,120 L 240,120 L 240,150 L 200,150 Z', labelX: 220, labelY: 135 },
    { name: '인천광역시', path: 'M 160,130 L 200,130 L 200,160 L 160,160 Z', labelX: 180, labelY: 145 },
    
    // 경기도 주요 도시들
    { name: '수원시', path: 'M 190,160 L 220,160 L 220,180 L 190,180 Z', labelX: 205, labelY: 170 },
    { name: '성남시', path: 'M 220,140 L 250,140 L 250,160 L 220,160 Z', labelX: 235, labelY: 150 },
    { name: '고양시', path: 'M 180,100 L 210,100 L 210,120 L 180,120 Z', labelX: 195, labelY: 110 },
    { name: '용인시', path: 'M 240,160 L 270,160 L 270,180 L 240,180 Z', labelX: 255, labelY: 170 },
    { name: '부천시', path: 'M 170,140 L 200,140 L 200,160 L 170,160 Z', labelX: 185, labelY: 150 },
    { name: '안산시', path: 'M 160,170 L 190,170 L 190,190 L 160,190 Z', labelX: 175, labelY: 180 },
    { name: '안양시', path: 'M 190,170 L 220,170 L 220,190 L 190,190 Z', labelX: 205, labelY: 180 },
    { name: '남양주시', path: 'M 250,120 L 280,120 L 280,140 L 250,140 Z', labelX: 265, labelY: 130 },
    { name: '화성시', path: 'M 170,190 L 210,190 L 210,210 L 170,210 Z', labelX: 190, labelY: 200 },
    { name: '평택시', path: 'M 190,210 L 230,210 L 230,230 L 190,230 Z', labelX: 210, labelY: 220 },
    { name: '의정부시', path: 'M 210,100 L 240,100 L 240,120 L 210,120 Z', labelX: 225, labelY: 110 },
    { name: '시흥시', path: 'M 160,190 L 190,190 L 190,210 L 160,210 Z', labelX: 175, labelY: 200 },
    { name: '파주시', path: 'M 180,80 L 220,80 L 220,100 L 180,100 Z', labelX: 200, labelY: 90 },
    { name: '광명시', path: 'M 180,160 L 200,160 L 200,180 L 180,180 Z', labelX: 190, labelY: 170 },
    { name: '김포시', path: 'M 150,120 L 180,120 L 180,140 L 150,140 Z', labelX: 165, labelY: 130 },
    { name: '군포시', path: 'M 200,180 L 220,180 L 220,200 L 200,200 Z', labelX: 210, labelY: 190 },
    { name: '광주시', path: 'M 270,150 L 300,150 L 300,170 L 270,170 Z', labelX: 285, labelY: 160 },
    { name: '이천시', path: 'M 250,180 L 280,180 L 280,200 L 250,200 Z', labelX: 265, labelY: 190 },
    { name: '양주시', path: 'M 220,90 L 250,90 L 250,110 L 220,110 Z', labelX: 235, labelY: 100 },
    { name: '오산시', path: 'M 210,200 L 230,200 L 230,220 L 210,220 Z', labelX: 220, labelY: 210 },
    { name: '구리시', path: 'M 240,130 L 260,130 L 260,150 L 240,150 Z', labelX: 250, labelY: 140 },
    { name: '안성시', path: 'M 230,220 L 260,220 L 260,240 L 230,240 Z', labelX: 245, labelY: 230 },
    { name: '포천시', path: 'M 250,80 L 290,80 L 290,110 L 250,110 Z', labelX: 270, labelY: 95 },
    { name: '의왕시', path: 'M 210,180 L 230,180 L 230,200 L 210,200 Z', labelX: 220, labelY: 190 },
    { name: '하남시', path: 'M 250,150 L 270,150 L 270,170 L 250,170 Z', labelX: 260, labelY: 160 },
    { name: '동두천시', path: 'M 200,80 L 220,80 L 220,100 L 200,100 Z', labelX: 210, labelY: 90 },
    { name: '과천시', path: 'M 200,170 L 215,170 L 215,185 L 200,185 Z', labelX: 207, labelY: 177 },
    
    // 강원도
    { name: '춘천시', path: 'M 290,110 L 330,110 L 330,140 L 290,140 Z', labelX: 310, labelY: 125 },
    { name: '원주시', path: 'M 280,200 L 320,200 L 320,230 L 280,230 Z', labelX: 300, labelY: 215 },
    { name: '강릉시', path: 'M 370,140 L 410,140 L 410,170 L 370,170 Z', labelX: 390, labelY: 155 },
    { name: '동해시', path: 'M 380,170 L 410,170 L 410,190 L 380,190 Z', labelX: 395, labelY: 180 },
    { name: '태백시', path: 'M 350,220 L 380,220 L 380,240 L 350,240 Z', labelX: 365, labelY: 230 },
    { name: '속초시', path: 'M 390,110 L 420,110 L 420,130 L 390,130 Z', labelX: 405, labelY: 120 },
    { name: '삼척시', path: 'M 380,240 L 420,240 L 420,270 L 380,270 Z', labelX: 400, labelY: 255 },
    
    // 충청권
    { name: '청주시', path: 'M 240,240 L 280,240 L 280,270 L 240,270 Z', labelX: 260, labelY: 255 },
    { name: '천안시', path: 'M 190,250 L 230,250 L 230,280 L 190,280 Z', labelX: 210, labelY: 265 },
    { name: '대전광역시', path: 'M 200,310 L 230,310 L 230,340 L 200,340 Z', labelX: 215, labelY: 325 },
    { name: '세종특별자치시', path: 'M 190,290 L 215,290 L 215,315 L 190,315 Z', labelX: 202, labelY: 302 },
    
    // 전라권
    { name: '전주시', path: 'M 170,340 L 210,340 L 210,370 L 170,370 Z', labelX: 190, labelY: 355 },
    { name: '광주광역시', path: 'M 160,420 L 190,420 L 190,450 L 160,450 Z', labelX: 175, labelY: 435 },
    
    // 경상권
    { name: '대구광역시', path: 'M 280,320 L 310,320 L 310,350 L 280,350 Z', labelX: 295, labelY: 335 },
    { name: '부산광역시', path: 'M 320,420 L 360,420 L 360,450 L 320,450 Z', labelX: 340, labelY: 435 },
    { name: '울산광역시', path: 'M 360,370 L 390,370 L 390,400 L 360,400 Z', labelX: 375, labelY: 385 },
    
    // 제주도
    { name: '제주시', path: 'M 100,520 L 140,520 L 140,550 L 100,550 Z', labelX: 120, labelY: 535 },
    { name: '서귀포시', path: 'M 120,550 L 160,550 L 160,580 L 120,580 Z', labelX: 140, labelY: 565 }
];

// 색상 테마
const colorSchemes = {
    blues: d3.interpolateBlues,
    greens: d3.interpolateGreens,
    reds: d3.interpolateReds,
    purples: d3.interpolatePurples
};

let currentDataType = 'population';
let currentColorScheme = 'blues';
let selectedRegion = null;

// SVG 설정
const svg = d3.select('#koreaMap');
const tooltip = d3.select('#tooltip');

function updateMap() {
    svg.selectAll("*").remove();
    
    const currentData = sampleData[currentDataType];
    const values = Object.values(currentData);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    const colorScale = d3.scaleSequential(colorSchemes[currentColorScheme])
        .domain([minValue, maxValue]);

    // 지역 그리기 (path 사용)
    svg.selectAll("path")
        .data(koreaRegions)
        .enter()
        .append("path")
        .attr("class", "region")
        .attr("d", d => d.path)
        .attr("fill", d => {
            const value = currentData[d.name];
            return value ? colorScale(value) : '#ccc';
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("stroke-width", 2)
                .attr("stroke", "#ff6b35");
            
            const value = currentData[d.name] || 0;
            const unit = currentDataType === 'population' ? '백만명' : '점';
            
            tooltip
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`<strong>${d.name}</strong><br/>값: ${value}${unit}`);
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 1)
                .attr("stroke", "#333");
            
            tooltip.style("display", "none");
        })
        .on("click", function(event, d) {
            selectedRegion = d.name;
            updateSelectedInfo();
        });

    // 지역명 라벨 추가 (미리 계산된 좌표 사용)
    svg.selectAll("text")
        .data(koreaRegions)
        .enter()
        .append("text")
        .attr("class", "region-label")
        .attr("x", d => d.labelX)
        .attr("y", d => d.labelY)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("text-shadow", "1px 1px 1px rgba(0,0,0,0.7)")
        .style("pointer-events", "none")
        .text(d => {
            if (d.name.length > 6) return d.name.substring(0, 3);
            if (d.name.length > 4) return d.name.replace('시', '').replace('군', '');
            return d.name.replace('특별시', '서울').replace('광역시', '').replace('특별자치시', '세종');
        });

    // 범례 업데이트
    updateLegend(minValue, maxValue);
}

function updateLegend(minValue, maxValue) {
    const legendGradient = document.getElementById('legendGradient');
    const colorScheme = colorSchemes[currentColorScheme];
    
    let gradientStops = '';
    for (let i = 0; i <= 10; i++) {
        const percent = i * 10;
        const value = minValue + (maxValue - minValue) * (i / 10);
        const color = colorScheme(value / maxValue);
        gradientStops += `${color} ${percent}%,`;
    }
    gradientStops = gradientStops.slice(0, -1); // 마지막 쉼표 제거
    
    legendGradient.style.background = `linear-gradient(to right, ${gradientStops})`;
    
    const unit = currentDataType === 'population' ? '백만명' : '점';
    document.getElementById('legendValues').textContent = `${minValue}${unit} - ${maxValue}${unit}`;
}

function updateSelectedInfo() {
    const selectedInfo = document.getElementById('selectedInfo');
    const selectedRegionSpan = document.getElementById('selectedRegion');
    const selectedValue = document.getElementById('selectedValue');
    
    if (selectedRegion) {
        const value = sampleData[currentDataType][selectedRegion];
        const unit = currentDataType === 'population' ? '백만명' : '점';
        const dataTypeName = currentDataType === 'population' ? '인구수' : 
                           currentDataType === 'development' ? '발전지수' : '경제지수';
        
        selectedRegionSpan.textContent = selectedRegion;
        selectedValue.textContent = `${dataTypeName}: ${value}${unit}`;
        selectedInfo.style.display = 'block';
    } else {
        selectedInfo.style.display = 'none';
    }
}

// 이벤트 리스너
document.getElementById('dataType').addEventListener('change', function(e) {
    currentDataType = e.target.value;
    updateMap();
    updateSelectedInfo();
});

document.getElementById('colorScheme').addEventListener('change', function(e) {
    currentColorScheme = e.target.value;
    updateMap();
});

// 초기 지도 렌더링
updateMap();