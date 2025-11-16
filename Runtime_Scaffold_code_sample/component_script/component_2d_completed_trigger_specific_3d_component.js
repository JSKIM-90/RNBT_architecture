const { triggerEventToTargetInstance } = WKit;
const { targetInstanceName, eventName } = getDefaultEventTarget();

triggerEventToTargetInstance(targetInstanceName, eventName);

function getDefaultEventTarget() {
    return {
        targetInstanceName: 'DataMappedComponent',
        eventName: '@myClickEvent'
    }
};