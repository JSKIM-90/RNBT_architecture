const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Subscribe to product data
    this.subscriptions = {
        salesData: ['renderTable']
    };

    // Event bindings
    this.customEvents = getCustomEvents.call(this);

    this.renderTable = renderTable.bind(this);

    // Bind events
    bindEvents(this, this.customEvents);

    // Subscribe to topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );
}

function getCustomEvents() {
    return {
        click: {
            '.btn-edit': '@productEditClicked',
            '.btn-delete': '@productDeleteClicked',
            '.btn-primary': '@addProductClicked',
            '.btn-pagination': '@paginationClicked'
        },
        input: {
            '.search-input': '@searchInputChanged'
        }
    };
}

function renderTable(data) {
    console.log(`[ProductList] Rendering table`, data);

    if (!data || !data.products) {
        showEmptyState(this);
        return;
    }

    const products = data.products.slice(0, 10); // First 10 products
    const tbody = this.element.querySelector('.product-table tbody');

    tbody.innerHTML = products.map((product, index) => `
        <tr data-product-id="${product.id}">
            <td>
                <div class="product-name-cell">
                    <div class="product-image-placeholder"></div>
                    <span class="product-name-text">${product.title || 'Untitled'}</span>
                </div>
            </td>
            <td class="product-category">${product.category || 'General'}</td>
            <td class="product-price">$${product.price?.toFixed(2) || '0.00'}</td>
            <td>${product.stock || 0}</td>
            <td>
                <span class="status-badge ${getStockStatus(product.stock)}">
                    ${getStockStatusText(product.stock)}
                </span>
            </td>
            <td>
                <div class="product-actions">
                    <button class="btn-action btn-edit" aria-label="Edit" data-product-id="${product.id}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.854.146a.5.5 0 00-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 000-.708l-3-3zm-10 10L0 15l4.854-2.854 8.5-8.5L9.646 0l-8.5 8.5z"/>
                        </svg>
                    </button>
                    <button class="btn-action btn-delete" aria-label="Delete" data-product-id="${product.id}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update pagination info
    this.element.querySelector('.total-items').textContent = data.products.length;
    this.element.querySelector('.page-start').textContent = '1';
    this.element.querySelector('.page-end').textContent = Math.min(10, data.products.length);

    // Hide loading/empty states
    this.element.querySelector('.table-loading').style.display = 'none';
    this.element.querySelector('.table-empty').style.display = 'none';
}

function showEmptyState(instance) {
    instance.element.querySelector('.table-loading').style.display = 'none';
    instance.element.querySelector('.table-empty').style.display = 'flex';
    instance.element.querySelector('.product-table tbody').innerHTML = '';
}

function getStockStatus(stock) {
    if (!stock || stock === 0) return 'out-of-stock';
    if (stock < 20) return 'low-stock';
    return 'in-stock';
}

function getStockStatusText(stock) {
    if (!stock || stock === 0) return 'Out of Stock';
    if (stock < 20) return 'Low Stock';
    return 'In Stock';
}
