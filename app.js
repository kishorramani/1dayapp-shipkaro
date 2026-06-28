document.addEventListener('DOMContentLoaded', () => {
    // App State
    let allProducts = [];
    let currentFilter = 'all';
    let searchQuery = '';
    let currentSort = 'name-asc';

    // DOM Elements
    const productsGrid = document.getElementById('products-grid');
    const noResultsState = document.getElementById('no-results-state');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortTrigger = document.getElementById('sort-trigger');
    const sortTriggerLabel = document.getElementById('sort-trigger-label');
    const sortOptionsList = document.getElementById('sort-options-list');
    const customOptions = sortOptionsList.querySelectorAll('.custom-option');
        const resetFiltersBtn = document.getElementById('reset-filters-btn');

    // Header & Dashboard Stats Elements
    const headerCount = document.getElementById('header-count');
    const statsTotalCount = document.getElementById('stats-total-count');
    const statsBuildersCount = document.getElementById('stats-builders-count');
    const statsLiveCount = document.getElementById('stats-live-count');
    const statsDevCount = document.getElementById('stats-dev-count');

    // Category Pill Counts Elements
    const filterPillsContainer = document.getElementById('filter-pills-container');
    const countAll = document.getElementById('count-all');



    // Fetch Products Data
    fetchProducts();

    // Fetch products.json
    async function fetchProducts() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }
            allProducts = await response.json();
            
            // Initial render
            generateDynamicFilters();
            updateDashboardStats();
            filterAndRenderProducts();
        } catch (error) {
            console.error('Error loading products data:', error);
            productsGrid.innerHTML = `
                <div class="loading-state">
                    <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--accent);">error</span>
                    <p class="font-mono">Failed to load shipped products data.</p>
                </div>
            `;
        }
    }

    // Generate dynamic filters based on unique types in the data
    function generateDynamicFilters() {
        // Clear all except "All Products" which is the first child
        const allPill = filterPillsContainer.querySelector('[data-filter="all"]');
        filterPillsContainer.innerHTML = '';
        filterPillsContainer.appendChild(allPill);

        // Get unique types sorted alphabetically
        const uniqueTypes = [...new Set(allProducts.map(p => p.type))]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        // Update Hero subtitle dynamically
        updateHeroSubtitle(uniqueTypes);

        const typeMap = {
            'web': { label: 'Web', icon: 'language' },
            'android': { label: 'Android', icon: 'phone_android' },
            'ios': { label: 'iOS', icon: 'phone_iphone' },
            'ai-tool': { label: 'AI Tools', icon: 'psychology' },
            'extension': { label: 'Extensions', icon: 'extension' },
            'workflow': { label: 'Workflows', icon: 'conversion_path' },
            'other': { label: 'Other', icon: 'more_horiz' }
        };

        uniqueTypes.forEach(type => {
            const meta = typeMap[type] || {
                label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
                icon: 'category'
            };

            const button = document.createElement('button');
            button.className = 'filter-pill';
            button.setAttribute('data-filter', type);
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', 'false');
            button.innerHTML = `
                <span class="material-symbols-outlined">${meta.icon}</span>
                <span>${meta.label}</span>
                <span class="filter-count font-mono">0</span>
            `;
            filterPillsContainer.appendChild(button);
        });
    }

    // Helper to dynamically update the hero description based on the types present
    function updateHeroSubtitle(uniqueTypes) {
        const heroSubtitle = document.getElementById('hero-subtitle');
        if (!heroSubtitle) return;

        const pluralMap = {
            'web': 'web applications',
            'android': 'Android apps',
            'ios': 'iOS apps',
            'ai-tool': 'AI tools',
            'extension': 'browser extensions',
            'workflow': 'automation workflows'
        };

        const mapped = uniqueTypes.map(type => {
            return pluralMap[type] || `${type}s`;
        });

        let listText = '';
        if (mapped.length === 0) {
            listText = 'products';
        } else if (mapped.length === 1) {
            listText = mapped[0];
        } else if (mapped.length === 2) {
            listText = `${mapped[0]} and ${mapped[1]}`;
        } else {
            listText = `${mapped.slice(0, -1).join(', ')}, and ${mapped[mapped.length - 1]}`;
        }

        heroSubtitle.innerHTML = `A directory of ${listText} built in a single weekend. Real builders shipping real code.`;
    }

    // Update Dashboard Metrics (Fixed stats based on entire dataset)
    function updateDashboardStats() {
        const total = allProducts.length;
        
        // Count unique builders
        const uniqueBuilders = [...new Set(allProducts.map(p => p.builder).filter(Boolean))].length;
        
        // Count products with live links
        const liveProducts = allProducts.filter(p => p.link).length;
        
        // Count products in development (no link)
        const devProducts = allProducts.filter(p => !p.link).length;

        // Animate count up
        animateCount(statsTotalCount, total);
        animateCount(statsBuildersCount, uniqueBuilders);
        animateCount(statsLiveCount, liveProducts);
        animateCount(statsDevCount, devProducts);

        headerCount.textContent = `${total} Products Shipped`;
    }

    // Smooth integer counting animation
    function animateCount(element, targetValue) {
        let start = 0;
        const duration = 800; // ms
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            const currentValue = Math.floor(easeProgress * targetValue);
            
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue;
            }
        }

        requestAnimationFrame(update);
    }

    // Filter & Render logic
    function filterAndRenderProducts() {
        // 1. Filter by category
        let filtered = allProducts.filter(product => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'web') return product.type === 'web';

            return product.type === currentFilter;
        });

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => {
                return (
                    (product.name && product.name.toLowerCase().includes(query)) ||
                    (product.description && product.description.toLowerCase().includes(query)) ||
                    (product.builder && product.builder.toLowerCase().includes(query)) ||
                    (product.type && product.type.toLowerCase().includes(query))
                );
            });
        }

        // 3. Sort products
        sortProducts(filtered);

        // 4. Update individual category pill counters dynamically based on search
        updateCategoryPillCounters();

        // 5. Render Grid
        renderGrid(filtered);
    }

    // Sorting implementation
    function sortProducts(productsList) {
        productsList.sort((a, b) => {
            if (currentSort === 'name-asc') {
                return a.name.localeCompare(b.name);
            }
            if (currentSort === 'name-desc') {
                return b.name.localeCompare(a.name);
            }
            if (currentSort === 'type') {
                return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
            }
            if (currentSort === 'link-priority') {
                // Products with links first
                const hasLinkA = a.link ? 1 : 0;
                const hasLinkB = b.link ? 1 : 0;
                return hasLinkB - hasLinkA || a.name.localeCompare(b.name);
            }
            return 0;
        });
    }

    // Updates category pill counts dynamically to reflect current search filter matches
    function updateCategoryPillCounters() {
        const getMatchCount = (typeFilterFn) => {
            return allProducts.filter(product => {
                // Match search first
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase().trim();
                    const matchesSearch = (
                        (product.name && product.name.toLowerCase().includes(query)) ||
                        (product.description && product.description.toLowerCase().includes(query)) ||
                        (product.builder && product.builder.toLowerCase().includes(query)) ||
                        (product.type && product.type.toLowerCase().includes(query))
                    );
                    if (!matchesSearch) return false;
                }
                return typeFilterFn(product);
            }).length;
        };

        countAll.textContent = getMatchCount(() => true);

        // Update all other unique types dynamically
        const pills = filterPillsContainer.querySelectorAll('.filter-pill[data-filter]');
        pills.forEach(pill => {
            const filterType = pill.getAttribute('data-filter');
            if (filterType !== 'all') {
                const countSpan = pill.querySelector('.filter-count');
                if (countSpan) {
                    countSpan.textContent = getMatchCount(p => p.type === filterType);
                }
            }
        });
    }

    // Render Grid Elements
    function renderGrid(productsList) {
        productsGrid.innerHTML = '';
        
        if (productsList.length === 0) {
            productsGrid.style.display = 'none';
            noResultsState.style.display = 'block';
            return;
        }

        productsGrid.style.display = 'grid';
        noResultsState.style.display = 'none';

        const fragment = document.createDocumentFragment();

        productsList.forEach(product => {
            const card = document.createElement('article');
            card.className = 'card';
            card.setAttribute('data-id', product.id);

            // Deterministic avatar coloring
            const avatarStyle = getAvatarStyle(product.builder);
            const firstLetter = product.name ? product.name.charAt(0) : 'S';
            const builderFirstLetter = product.builder ? product.builder.charAt(0) : 'S';

            // Check icon URL or render fallback letter avatar
            const avatarHTML = product.icon 
                ? `<img src="${product.icon}" alt="${product.name} Icon" class="avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                : '';
            
            const fallbackHTML = `
                <div class="avatar-fallback" style="background-color: ${avatarStyle.bg}; color: ${avatarStyle.text}; ${product.icon ? 'display: none;' : 'display: flex;'}">
                    ${firstLetter}
                </div>
            `;

            // Badges HTML
            const typeLabel = product.type.replace('-', ' ');
            const typeBadgeHTML = `<span class="type-badge ${product.type}">${typeLabel}</span>`;
            
            // Badges wrapper (no city or count badges)
            const badgesHTML = `
                <div class="card-badges">
                    ${typeBadgeHTML}
                </div>
            `;

            // Link / CTA Button HTML
            let ctaHTML = '';
            if (product.link) {
                ctaHTML = `
                    <a href="${product.link}" target="_blank" rel="noopener noreferrer" class="btn-card-cta live-link">
                        <span>Visit Site</span>
                        <span class="material-symbols-outlined">arrow_outward</span>
                    </a>
                `;
            } else {
                ctaHTML = `
                    <button class="btn-card-cta disabled-link" disabled title="Link not available yet">
                        <span class="material-symbols-outlined">lock</span>
                        <span>In Development</span>
                    </button>
                `;
            }

            // Card Inner HTML
            card.innerHTML = `
                <div class="card-header-wrapper">
                    <div class="avatar-wrapper">
                        ${avatarHTML}
                        ${fallbackHTML}
                    </div>
                    ${badgesHTML}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description" title="${product.description}">${product.description}</p>
                </div>
                <div class="builder-info">
                    <div class="builder-avatar" style="background-color: var(--border); color: var(--text-primary)">
                        ${builderFirstLetter}
                    </div>
                    <span class="builder-name" title="Built by ${product.builder}">by ${product.builder}</span>
                </div>
                <div class="card-footer">
                    ${ctaHTML}
                </div>
            `;

            fragment.appendChild(card);
        });

        productsGrid.appendChild(fragment);
    }

    // Dynamic color logic based on builder name hash
    function getAvatarStyle(name) {
        // Curated pairs that work beautifully in both light and dark modes
        const colors = [
            { bg: '#F3E8FF', text: '#7E22CE' }, // Purple
            { bg: '#E0F2FE', text: '#0369A1' }, // Blue
            { bg: '#D1FAE5', text: '#047857' }, // Emerald
            { bg: '#FEF3C7', text: '#D97706' }, // Amber
            { bg: '#FFE4E6', text: '#E11D48' }, // Rose
            { bg: '#E0E7FF', text: '#4F46E5' }  // Indigo
        ];
        
        let hash = 0;
        const inputStr = name || 'ShipKaro';
        for (let i = 0; i < inputStr.length; i++) {
            hash = inputStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    // Event Listeners
    // Search input handler (live search)
    const searchWrapper = document.querySelector('.search-wrapper');
    if (searchWrapper) {
        searchWrapper.addEventListener('click', (e) => {
            if (e.target !== searchInput && e.target !== searchClear) {
                searchInput.focus();
            }
        });
    }

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim()) {
            searchClear.style.display = 'block';
        } else {
            searchClear.style.display = 'none';
        }
        filterAndRenderProducts();
    });

    // Clear search
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        searchInput.focus();
        filterAndRenderProducts();
    });
    
    searchClear.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            searchClear.click();
        }
    });

    // Custom Dropdown Sort Handlers
    sortTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sortDropdown.classList.toggle('open');
        sortTrigger.setAttribute('aria-expanded', isOpen);
    });

    customOptions.forEach(option => {
        option.addEventListener('click', () => {
            const val = option.getAttribute('data-value');
            const text = option.querySelector('span').textContent;

            currentSort = val;
            sortTriggerLabel.textContent = text;

            customOptions.forEach(opt => {
                const isActive = opt === option;
                opt.classList.toggle('active', isActive);
                opt.setAttribute('aria-selected', isActive);
            });

            sortDropdown.classList.remove('open');
            sortTrigger.setAttribute('aria-expanded', 'false');
            filterAndRenderProducts();
        });
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove('open');
            sortTrigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Close dropdown on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sortDropdown.classList.contains('open')) {
            sortDropdown.classList.remove('open');
            sortTrigger.setAttribute('aria-expanded', 'false');
            sortTrigger.focus();
        }
    });

    // Category pills click handlers (Event Delegation)
    filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;

        const pills = filterPillsContainer.querySelectorAll('.filter-pill');
        pills.forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-selected', 'false');
        });
        
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        currentFilter = pill.getAttribute('data-filter');
        
        filterAndRenderProducts();
    });

    // Reset filters button handler
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        currentSort = 'name-asc';
        if (sortTriggerLabel) {
            sortTriggerLabel.textContent = 'Name: A to Z';
        }
        customOptions.forEach(opt => {
            const isDefault = opt.getAttribute('data-value') === 'name-asc';
            opt.classList.toggle('active', isDefault);
            opt.setAttribute('aria-selected', isDefault);
        });
        
        // Reset category pill
        const pills = filterPillsContainer.querySelectorAll('.filter-pill');
        pills.forEach(p => p.classList.remove('active'));
        const allPill = filterPillsContainer.querySelector('.filter-pill[data-filter="all"]');
        if (allPill) {
            allPill.classList.add('active');
            allPill.setAttribute('aria-selected', 'true');
        }
        currentFilter = 'all';

        filterAndRenderProducts();
    });

    // Keybindings: Pressing '/' focuses search, Escape clears it
    document.addEventListener('keydown', (e) => {
        // Focus search on '/'
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        // Blur and clear search on 'Escape'
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
        }
    });

});
