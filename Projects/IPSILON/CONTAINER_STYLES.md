# IPSILON Container Styles

레이아웃 조립 시 컨테이너 크기 정의

> **Note**: `!important`는 component.css의 컨테이너 크기를 덮어쓰기 위함.
> 나중에 component.css에서 컨테이너 크기를 제거하면 `!important`도 제거.

## TemperatureSensor

```css
#temperature-sensor-container {
    width: 100% !important;
    height: calc(100vh - 100px) !important;  /* 헤더/여백 제외 */
    padding: 20px !important;
    overflow: auto !important;
}
```

## SensorDetailPopup

```css
#sensor-detail-popup-container {
    /* Popup은 fixed position이므로 컨테이너 크기 무관 */
    /* 내부 .popup-overlay가 viewport 전체를 덮음 */
    width: auto !important;
    height: auto !important;
    padding: 0 !important;
    overflow: visible !important;
}
```

## 전체 페이지 레이아웃 (참고)

```css
.page-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #0f1219;
}

.page-header {
    height: 60px;
    flex-shrink: 0;
}

.page-content {
    flex: 1;
    padding: 20px;
    overflow: hidden;
}
```
