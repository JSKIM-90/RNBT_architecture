/* Component: ProductList
 * Pattern: 2D Component + GlobalDataPublisher Subscription + Event Binding
 * Purpose: Displays product list using HTML template and handles product selection
 */

const { bindEvents } = WKit;
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Subscription schema
    this.subscriptions = {
        productList: ['renderProductTable']
    };

    // Event schema (for dynamically rendered product rows)
    this.customEvents = {
        click: {
            '.product-row': '@productSelected',
            '.product-delete-btn': '@productDeleteClicked'
        }
    };

    // Bind handler functions
    this.renderProductTable = renderProductTable.bind(this);
    this.handleProductSelect = handleProductSelect.bind(this);
    this.handleProductDelete = handleProductDelete.bind(this);

    // Store products for later access
    this.products = [];

    // Subscribe to topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );

    // Bind events to DOM (delegate pattern handles dynamic content)
    bindEvents(this, this.customEvents);
}

// Handler: Render product table using HTML template
function renderProductTable(data) {
    console.log(`[ProductList] Rendering table with ${data?.length || 0} products`);

    // Store products for event handlers to access
    this.products = data || [];

    const tableBody = this.element.querySelector('.product-table-body');
    const template = this.element.querySelector('#product-row-template');
    const countEl = this.element.querySelector('.product-count');

    if (!tableBody || !template) return;

    // Update product count
    if (countEl) {
        countEl.textContent = this.products.length;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    if (this.products.length === 0) {
        // Show empty state
        const emptyState = this.element.querySelector('.table-empty');
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }

    // Hide empty state
    const emptyState = this.element.querySelector('.table-empty');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Render table rows using template
    this.products.forEach((product, index) => {
        const clone = template.content.cloneNode(true);

        // Set row data attributes
        const rowEl = clone.querySelector('.product-row');
        rowEl.dataset.index = index;
        rowEl.dataset.productId = product.id;

        // Set product ID
        const idEl = clone.querySelector('.product-id');
        idEl.textContent = product.id;

        // Set product name
        const nameEl = clone.querySelector('.product-name-text');
        nameEl.textContent = product.name;

        // Set category
        const categoryEl = clone.querySelector('.product-category');
        categoryEl.textContent = product.category || '-';

        // Set price
        const priceEl = clone.querySelector('.product-price');
        priceEl.textContent = `$${product.price?.toFixed(2) || '0.00'}`;

        // Set stock
        const stockEl = clone.querySelector('.product-stock');
        stockEl.textContent = product.stock || 0;

        // Set status badge
        const statusBadgeEl = clone.querySelector('.status-badge');
        const stock = product.stock || 0;
        if (stock > 10) {
            statusBadgeEl.textContent = 'In Stock';
            statusBadgeEl.classList.add('in-stock');
        } else if (stock > 0) {
            statusBadgeEl.textContent = 'Low Stock';
            statusBadgeEl.classList.add('low-stock');
        } else {
            statusBadgeEl.textContent = 'Out of Stock';
            statusBadgeEl.classList.add('out-of-stock');
        }

        // Set action button data attributes
        const deleteBtnEl = clone.querySelector('.product-delete-btn');
        deleteBtnEl.dataset.index = index;

        tableBody.appendChild(clone);
    });
}

// Handler: Product row clicked
function handleProductSelect(event) {
    // Don't trigger if clicking on action buttons
    if (event.target.closest('.btn-action')) {
        return;
    }

    const row = event.target.closest('.product-row');
    if (!row) return;

    const { index, productId } = row.dataset;
    const product = this.products[index];

    console.log(`[ProductList] Product selected:`, product);
}

// Handler: Delete button clicked
function handleProductDelete(event) {
    event.stopPropagation(); // Prevent row click event

    const { index } = event.target.closest('.product-delete-btn').dataset;
    const product = this.products[index];

    console.log(`[ProductList] Delete requested for:`, product);
}
