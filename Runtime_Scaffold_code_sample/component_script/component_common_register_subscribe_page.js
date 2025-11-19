/* Pattern: Common Component - GlobalDataPublisher Subscription */

const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// Subscription schema (배열로 여러 핸들러 등록 가능)
this.subscriptions = {
    users: ['renderUserTable', 'updateUserCount'],  // 한 topic에 여러 메서드!
    products: ['renderProductList']
};

// Handler functions (bind to this)
this.renderUserTable = renderUserTable.bind(this);
this.updateUserCount = updateUserCount.bind(this);
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
    console.log(`[Render Table] ${this.name}`, data);
    // Table render logic
}

function updateUserCount(data) {
    console.log(`[Update Count] ${this.name}`, data.length);
    // Update count badge logic
}

function renderProductList(data) {
    console.log(`[Render Products] ${this.name}`, data);
    // Product list render logic
}
