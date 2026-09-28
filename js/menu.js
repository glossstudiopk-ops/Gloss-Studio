const SUPABASE_URL = 'https://qtxkqvrpyzecenekywny.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Z6-DGvCjefqGbe_klEPr9Q_lTYnz6A2';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const root = document.getElementById('menu-root');
const loading = document.getElementById('menu-loading');
const errorBox = document.getElementById('menu-error');
const search = document.getElementById('menu-search');
const count = document.getElementById('menu-count');

let services = [];

function esc(value='') {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function render(list) {
  count.textContent = list.length + (list.length === 1 ? ' treatment' : ' treatments');
  root.innerHTML = '';

  if (!list.length) {
    root.innerHTML = '<div class="bg-white border border-gold-primary/15 rounded-2xl p-10 text-center text-sm text-espresso/60">No treatments match your search.</div>';
    return;
  }

  const grouped = list.reduce((acc, service) => {
    const key = service.subcategory || service.category || 'Treatments';
    (acc[key] ||= []).push(service);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([group, items]) => {
    const section = document.createElement('section');
    section.innerHTML = `
      <div class="mb-5">
        <h2 class="font-serif text-3xl sm:text-4xl text-espresso border-b border-gold-primary/20 pb-3">${esc(group)}</h2>
        ${group === 'Botox Treatments' ? '<p class="mt-3 text-sm text-espresso/70"><strong>Flat Rate:</strong> Rs. 1,000 per unit of Botox. Unit quantities are shown per treatment area.</p>' : ''}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${items.map(service => `
          <article class="menu-item-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-4 mb-3">
                <span class="text-[10px] uppercase tracking-widest bg-gold-primary/10 text-gold-dark px-3 py-1 rounded-full font-semibold">${service.unit_rate ? 'Per Unit' : 'Treatment'}</span>
                <span class="font-serif text-xl sm:text-2xl font-bold text-gold-primary text-right">${esc(service.price_label || ('Rs. ' + Number(service.base_price || 0).toLocaleString()))}</span>
              </div>
              <h3 class="font-serif text-xl sm:text-2xl font-semibold text-espresso mb-2">${esc(service.name)}</h3>
              ${service.description ? '<p class="text-xs text-espresso/70 leading-relaxed mb-4">' + esc(service.description) + '</p>' : ''}
              ${service.unit_rate ? '<p class="text-xs text-espresso/70 mb-4"><strong>Flat Rate:</strong> Rs. ' + Number(service.unit_rate).toLocaleString() + ' per unit' + (service.units_label ? ' · ' + esc(service.units_label) : '') + '</p>' : ''}
            </div>
            <a href="index.html#reserve" class="inline-flex justify-center py-3 mt-2 text-xs uppercase tracking-[0.2em] font-semibold btn-gold-outline rounded-full">Book Treatment</a>
          </article>
        `).join('')}
      </div>
    `;
    root.appendChild(section);
  });
}

async function loadMenu() {
  const { data, error } = await client
    .from('services')
    .select('id,name,category,subcategory,base_price,price_label,unit_rate,units_label,description,active')
    .eq('active', true)
    .order('subcategory')
    .order('name');

  loading.classList.add('hidden');

  if (error) {
    console.error(error);
    errorBox.textContent = 'We could not load the treatment menu right now. Please refresh the page.';
    errorBox.classList.remove('hidden');
    count.textContent = 'Menu unavailable';
    return;
  }

  services = data || [];
  render(services);
}

search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  if (!q) return render(services);
  render(services.filter(s =>
    [s.name, s.subcategory, s.category, s.description, s.price_label]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q))
  ));
});

loadMenu();
