/* Pattern: Component Completed - Trigger Another Component */

const { getInstanceByName, makeIterator, emitEvent } = WKit;

// Find target component and emit event
const targetName = 'My3DComponent';
const eventName = '@triggerDataUpdate';

const iter = makeIterator(wemb.mainPageComponent);
const targetInstance = getInstanceByName(targetName, iter);

if (targetInstance) {
    emitEvent(eventName, targetInstance);
    console.log(`[Completed] Triggered ${eventName} on ${targetName}`);
} else {
    console.warn(`[Completed] Component "${targetName}" not found`);
}
