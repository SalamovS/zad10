// Общий источник товаров для магазина и страницы управления.
// products.json загружается при первом открытии; изменения хранятся в localStorage.
const PRODUCT_STORAGE_KEY = 'global-green-products-v1';
const ProductStore = {
  async load() {
    const saved = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (saved !== null) {
      try { const data = JSON.parse(saved); if (Array.isArray(data)) return data; } catch (_) {}
    }
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('Не удалось загрузить products.json');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Неверный формат products.json');
    return data;
  },
  save(items) { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(items)); },
  nextId(items) { return Math.max(0, ...items.map(p => Number(p.id) || 0)) + 1; }
};
