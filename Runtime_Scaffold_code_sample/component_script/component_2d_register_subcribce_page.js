const { L, go, each } = fx;
const { subscribe } = GlobalDataPublisher;

initComponent.call(this);

function initComponent() {
    this.subscriptions = getSubscriptions();
    this.renderTable = renderTable.bind(this);
    go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );
};

function getSubscriptions() {
    return {
        users: ['renderTable'],
    }
}; 

function renderTable(data) {
    console.log(`[Render Table] ${this.name}`, data, 'subscription result');
};

