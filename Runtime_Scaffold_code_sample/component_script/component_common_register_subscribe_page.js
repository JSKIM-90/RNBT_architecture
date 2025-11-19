/* Pattern: 2D Component - GlobalDataPublisher Subscription */

const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// Subscription schema
this.subscriptions = {
    users: ['renderUserTable'],
    products: ['renderProductList']
};

// Handler functions (bind to this)
this.renderUserTable = renderUserTable.bind(this);
this.renderProductList = renderProductList.bind(this);

// Subscribe to topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// Handler functions
function renderUserTable(data) {
    console.log(`[Users Updated] ${this.name}`, data);
    // Render logic here
}

function renderProductList(data) {
    console.log(`[Products Updated] ${this.name}`, data);
    // Render logic here
}
