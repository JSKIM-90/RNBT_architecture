/*
 * Page - before_load
 * ECO (Energy & Cooling Operations) Dashboard
 *
 * 자기 완결 컴포넌트 패턴 적용:
 * - Page는 어떤 메서드를 호출할지만 결정
 * - 데이터 패칭, 팝업 생성은 컴포넌트 내부에서 처리
 *
 * Components:
 * - UPS: 무정전 전원장치
 * - PDU: 분전반 (Tabbed UI)
 * - CRAC: 항온항습기
 * - TempHumiditySensor: 온습도 센서
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup 3D raycasting
 * - Drag detection for 3D click
 */

const { onEventBusHandlers, initThreeRaycasting, withSelector } = WKit;

// ======================
// DRAG DETECTION
// ======================

let mouseDownTime = 0;
let startPos = { x: 0, y: 0 };
const TIME_THRESHOLD = 200;  // ms
const DIST_THRESHOLD = 5;    // px

this.onCanvasMouseDown = (e) => {
    mouseDownTime = Date.now();
    startPos = { x: e.clientX, y: e.clientY };
};

withSelector(this.element, 'canvas', canvas => {
    canvas.addEventListener('mousedown', this.onCanvasMouseDown);
});

// ======================
// DRAG CHECK HELPER
// ======================

function isDragEvent(event) {
    const elapsed = Date.now() - mouseDownTime;
    const dx = event.clientX - startPos.x;
    const dy = event.clientY - startPos.y;
    const moved = Math.abs(dx) > DIST_THRESHOLD || Math.abs(dy) > DIST_THRESHOLD;
    return elapsed > TIME_THRESHOLD || moved;
}

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // UPS 클릭
    '@upsClicked': ({ event, targetInstance }) => {
        if (isDragEvent(event)) {
            console.log('[Page] Drag detected, ignoring UPS click');
            return;
        }
        console.log('[Page] UPS clicked:', targetInstance.id);
        targetInstance.showDetail();
    },

    // PDU (분전반) 클릭
    '@pduClicked': ({ event, targetInstance }) => {
        if (isDragEvent(event)) {
            console.log('[Page] Drag detected, ignoring PDU click');
            return;
        }
        console.log('[Page] PDU clicked:', targetInstance.id);
        targetInstance.showDetail();
    },

    // CRAC (항온항습기) 클릭
    '@cracClicked': ({ event, targetInstance }) => {
        if (isDragEvent(event)) {
            console.log('[Page] Drag detected, ignoring CRAC click');
            return;
        }
        console.log('[Page] CRAC clicked:', targetInstance.id);
        targetInstance.showDetail();
    },

    // 온습도 센서 클릭
    '@sensorClicked': ({ event, targetInstance }) => {
        if (isDragEvent(event)) {
            console.log('[Page] Drag detected, ignoring Sensor click');
            return;
        }
        console.log('[Page] Sensor clicked:', targetInstance.id);
        targetInstance.showDetail();
    }
};

onEventBusHandlers(this.eventBusHandlers);

// ======================
// 3D RAYCASTING SETUP
// ======================

this.raycastingEvents = withSelector(this.element, 'canvas', canvas =>
    fx.go(
        [{ type: 'click' }],
        fx.map(event => ({
            ...event,
            handler: initThreeRaycasting(canvas, event.type)
        }))
    )
);

console.log('[Page] before_load - ECO Dashboard event handlers & raycasting ready');
