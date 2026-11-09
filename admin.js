let products = [];
let editingId = null;
const list = document.getElementById('productList');
const form = document.getElementById('productForm');
const modal = document.getElementById('formModal');
const search = document.getElementById('search');
const category = document.getElementById('category');
const fallbackImage = '27.jpg';
const field = id => document.getElementById(id);
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = String(text);
  if (className) el.className = className;
  return el;
}
function photo(p) {
  const img = document.createElement('img');
  img.alt = p.name;
  img.src = p.image || fallbackImage;
  img.onerror = () => { img.onerror = null; img.src = fallbackImage; };
  return img;
}
function openModal(id) {const el = field(id); el.classList.add('open'); el.setAttribute('aria-hidden', 'false');}
function closeModal(id) {const el = field(id); el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');}
function notify(message) { field('notice').textContent = message; }
function render() {
  const q = search.value.trim().toLocaleLowerCase('ru');
  const cat = category.value;
  const filtered = products.filter(p => (cat === '' || p.category === cat) && `${p.name} ${p.category} ${p.description}`.toLocaleLowerCase('ru').includes(q));
  list.replaceChildren();
  field('count').textContent = products.length;
  field('empty').hidden = filtered.length !== 0;
  for (const p of filtered) {
    const card = node('article', undefined, 'product-card');
    card.appendChild(photo(p));
    const body = node('div', undefined, 'product-body');
    body.appendChild(node('span', p.category, 'tag'));
    body.appendChild(node('h3', p.name));
    body.appendChild(node('p', p.description, 'description'));
    body.appendChild(node('div', `${p.price} сом`, 'price'));
    const actions = node('div', undefined, 'card-actions');
    for (const [label, css, action] of [
      ['Подробнее', 'details', () => showDetails(p.id)],
      ['Изменить', 'edit', () => startEdit(p.id)],
      ['Удалить', 'delete', () => removeProduct(p.id)]
    ]) {
      const button = node('button', label, css); button.type = 'button';
      button.addEventListener('click', action); actions.appendChild(button);
    }
    body.appendChild(actions); card.appendChild(body); list.appendChild(card);
  }
}
function refreshCategories() {
  const old = category.value;
  category.replaceChildren(new Option('Все категории', ''));
  [...new Set(products.map(p => p.category))].sort().forEach(cat => category.add(new Option(cat, cat)));
  if ([...category.options].some(opt => opt.value === old)) category.value = old;
}
function saveAll(message) { ProductStore.save(products); refreshCategories(); render(); notify(message); }
function startAdd() {
  editingId = null; form.reset(); field('itemId').value = '';
  field('formTitle').textContent = 'Добавить товар'; field('saveBtn').textContent = 'Добавить товар';
  openModal('formModal'); field('name').focus();
}
function startEdit(id) {
  const p = products.find(p => Number(p.id) === Number(id)); if (!p) return;
  editingId = p.id; field('itemId').value = p.id;
  field('name').value = p.name; field('itemCategory').value = p.category;
  field('price').value = p.price; field('image').value = p.image || '';
  field('description').value = p.description;
  field('formTitle').textContent = 'Изменить товар'; field('saveBtn').textContent = 'Сохранить изменения';
  openModal('formModal'); field('name').focus();
}
function showDetails(id) {
  const p = products.find(p => Number(p.id) === Number(id)); if (!p) return;
  const content = field('detailContent'); content.replaceChildren();
  content.append(photo(p));
  const heading = node('h2', p.name); heading.id = 'detailTitle'; content.append(heading);
  content.append(node('span', p.category, 'tag'));
  content.append(node('p', p.description));
  content.append(node('div', `${p.price} сом`, 'price'));
  openModal('detailModal');
}
function removeProduct(id) {
  const p = products.find(p => Number(p.id) === Number(id)); if (!p) return;
  if (!confirm(`Удалить товар «${p.name}»?`)) return;
  products = products.filter(p => Number(p.id) !== Number(id)); saveAll('Товар удалён.');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const price = Number(field('price').value);
  if (!Number.isFinite(price) || price < 0) return;
  const data = {
    name: field('name').value.trim(), category: field('itemCategory').value.trim(),
    price, image: field('image').value.trim() || fallbackImage,
    description: field('description').value.trim()
  };
  if (!data.name || !data.category || !data.description) return;
  // Only local filenames and HTTP(S) addresses are accepted as image sources.
  if (!/^(https?:\/\/[^\s]+|[\wА-Яа-яЁё#(). -]+\.(jpg|jpeg|png|webp|gif))$/i.test(data.image)) {
    alert('Введите имя файла картинки, например 27.jpg, или ссылку https://...'); return;
  }
  if (editingId === null) { products.push({id: ProductStore.nextId(products), ...data}); saveAll('Новый товар добавлен.'); }
  else {
    const index = products.findIndex(p => Number(p.id) === Number(editingId));
    if (index < 0) return;
    products[index] = {...products[index], ...data}; saveAll('Изменения сохранены.');
  }
  closeModal('formModal');
});
field('addBtn').addEventListener('click', startAdd);
search.addEventListener('input', render); category.addEventListener('change', render);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelectorAll('.overlay').forEach(el => el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(el => closeModal(el.id)); });
field('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(products, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'products-updated.json'; a.click();
  URL.revokeObjectURL(url);
});
async function initialize() {
  try {products = await ProductStore.load(); refreshCategories(); render();}
  catch(err) {notify('Ошибка загрузки JSON. Запустите global.html через Live Server в VS Code.');}
}
window.addEventListener('storage', e => {if(e.key === PRODUCT_STORAGE_KEY) initialize();});
initialize();
