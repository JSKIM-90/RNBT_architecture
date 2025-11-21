/* Component: Product3DViewer - Cleanup */

const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Unsubscribe from topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, _]) => unsubscribe(topic, this))
    );

    // Clear references
    this.subscriptions = null;
    this.customEvents = null;
    this.datasetInfo = null;
    this.render3DModels = null;
    this.updateModelHighlight = null;

    // Note: 3D resource cleanup (geometry, material, texture)
    // is handled by page before_unload using WKit.disposeAllThreeResources()
}
