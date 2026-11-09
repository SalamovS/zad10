let products = [];
const list = document.getElementById('list');
const modal = document.getElementById('modal');
const detail = document.getElementById('detail');
const search = document.getElementById('search');
const fallbackImage = '27.jpg';

function addText(parent, tag, text, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  parent.appendChild(el);
  return el;
}
function addPhoto(parent, p) {
  const image = document.createElement('img');
  image.src = p.image || fallbackImage;
  image.alt = p.name || 'Товар';
  image.onerror = () => { image.onerror = null; image.src = fallbackImage; };
  parent.appendChild(image);
}
function renderList(query = '') {
  list.replaceChildren();
  const q = query.trim().toLocaleLowerCase('ru');
  const filtered = products.filter(p => `${p.name} ${p.category} ${p.description}`.toLocaleLowerCase('ru').includes(q));
  if (!filtered.length) { list.textContent = 'Товары не найдены'; return; }
  filtered.forEach(p => {
    const card = document.createElement('article'); card.className = 'product';
    addPhoto(card, p);
    const body = document.createElement('div'); body.className = 'body';
    addText(body, 'small', p.category);
    addText(body, 'h2', p.name);
    addText(body, 'p', p.description);
    addText(body, 'div', `${p.price} сом`, 'price');
    const button = addText(body, 'button', 'Подробнее'); button.type = 'button';
    button.addEventListener('click', () => showDetail(p.id));
    card.appendChild(body); list.appendChild(card);
  });
}
function showDetail(id) {
  const p = products.find(item => Number(item.id) === Number(id));
  if (!p) return;
  detail.replaceChildren();
  addPhoto(detail, p);
  const heading = addText(detail, 'h2', p.name); heading.id = 'detailName';
  addText(detail, 'p', `Категория: ${p.category}`);
  addText(detail, 'p', p.description);
  addText(detail, 'div', `${p.price} сом`, 'price');
  modal.classList.add('open');
}
function closeDetail() { modal.classList.remove('open'); }
document.getElementById('close').addEventListener('click', closeDetail);
modal.addEventListener('click', e => { if (e.target === modal) closeDetail(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
search.addEventListener('input', e => renderList(e.target.value));
async function loadProducts() {
  try { products = await ProductStore.load(); renderList(search.value); }
  catch (e) { list.textContent = 'Не удалось загрузить товары. Запустите сайт через Live Server.'; }
}
window.addEventListener('storage', e => { if (e.key === PRODUCT_STORAGE_KEY) loadProducts(); });
window.addEventListener('pageshow', loadProducts);
