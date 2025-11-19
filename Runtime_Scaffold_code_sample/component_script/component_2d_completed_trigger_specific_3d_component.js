const { getInstanceByName, makeIterator, emitEvent } = WKit;
const { targetInstanceName, eventName } = getDefaultEventTarget();

// primitive 조합으로 타겟 인스턴스 찾아서 이벤트 발행
const iter = makeIterator(wemb.mainPageComponent);
const targetInstance = getInstanceByName(targetInstanceName, iter);
if (targetInstance) {
    emitEvent(eventName, targetInstance);
}

function getDefaultEventTarget() {
    return {
        targetInstanceName: 'DataMappedComponent',
        eventName: '@myClickEvent'
    }
};