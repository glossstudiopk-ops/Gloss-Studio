const SUPABASE_URL = 'https://qtxkqvrpyzecenekywny.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Z6-DGvCjefqGbe_klEPr9Q_lTYnz6A2';
const PUBLIC_BOOKING_URL = SUPABASE_URL + '/functions/v1/public-booking';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const root = document.getElementById('menu-root');
const loading = document.getElementById('menu-loading');
const errorBox = document.getElementById('menu-error');
const search = document.getElementById('menu-search');
const count = document.getElementById('menu-count');

const modal = document.getElementById('booking-modal');
const closeBtn = document.getElementById('booking-close');
const cancelBtn = document.getElementById('public-cancel');
const topBookBtn = document.getElementById('top-book-btn');
const form = document.getElementById('public-booking-form');
const serviceSelect = document.getElementById('public-service');
const staffSelect = document.getElementById('public-staff');
const optionWrap = document.getElementById('public-option-wrap');
const optionSelect = document.getElementById('public-option');
const unitsWrap = document.getElementById('public-units-wrap');
const unitsSelect = document.getElementById('public-units');
const unitsNote = document.getElementById('public-units-note');
const quantityWrap = document.getElementById('public-quantity-wrap');
const quantityInput = document.getElementById('public-quantity');
const quantityLabel = document.getElementById('public-quantity-label');
const rangeWrap = document.getElementById('public-range-wrap');
const rangeInput = document.getElementById('public-range-price');
const rangeNote = document.getElementById('public-range-note');
const priceDetail = document.getElementById('public-price-detail');
const finalPriceEl = document.getElementById('public-final-price');
const dateInput = document.getElementById('public-date');
const submitBtn = document.getElementById('public-submit');
const messageBox = document.getElementById('public-booking-message');

let services = [];
let staff = [];
let activeService = null;
let pricingState = { option:'', quantity:1, unitPrice:null, finalPrice:0, detail:'' };

function esc(value='') {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function parseMoneyToken(token='') {
  const cleaned=String(token).toLowerCase().replace(/rs\.?/g,'').replace(/,/g,'').trim();
  const m=cleaned.match(/(\d+(?:\.\d+)?)\s*k?/);
  if(!m) return null;
  let value=Number(m[1]);
  if(/\d(?:\.\d+)?\s*k/i.test(cleaned)) value*=1000;
  return value;
}

function parseRange(label='') {
  const normalized=String(label).replace(/–/g,'-');
  const m=normalized.match(/(\d+(?:\.\d+)?\s*k?)\s*-\s*(\d+(?:\.\d+)?\s*k?)/i);
  if(!m) return null;
  return {min:parseMoneyToken(m[1]),max:parseMoneyToken(m[2])};
}

function splitOptions(name='') {
  return String(name).split(/\s*\/\s*/).map(v=>v.trim()).filter(Boolean);
}

function getPricingModel(service) {
  if(!service) return {type:'fixed',price:0};
  const label=service.price_label||'';
  const nameOptions=splitOptions(service.name||'');

  if(service.unit_rate){
    const nums=String(service.units_label||label).match(/\d+(?:\.\d+)?/g)?.map(Number)||[];
    const min=nums[0]||1;
    const max=nums[1]||nums[0]||min;
    return {type:'units',unitRate:Number(service.unit_rate),min,max,nameOptions};
  }

  const range=parseRange(label);
  if(range?.min!=null&&range?.max!=null) return {type:'range',min:range.min,max:range.max,nameOptions};

  const moneyTokens=(label.match(/\d+(?:\.\d+)?\s*k?|\d[\d,]*/gi)||[]).map(parseMoneyToken).filter(v=>v!=null);
  if(nameOptions.length>1 && moneyTokens.length>=nameOptions.length && /\//.test(label)){
    return {type:'variants',options:nameOptions.map((name,i)=>({name,price:moneyTokens[i]}))};
  }

  const perUnit=/\/\s*(ml|thread|pair|drip|ses(?:sion)?)\b/i.exec(label);
  if(perUnit) return {type:'quantity',unit:perUnit[1],unitPrice:Number(service.base_price||0),nameOptions};

  if(/\bea\b/i.test(label)) return {type:'quantity',unit:'item',unitPrice:Number(service.base_price||0),nameOptions};

  if(nameOptions.length>1) return {type:'choice',options:nameOptions,price:Number(service.base_price||0)};
  return {type:'fixed',price:Number(service.base_price||0)};
}

function initialPricing(service){
  const model=getPricingModel(service);
  if(model.type==='units') return {option:'',quantity:model.min,unitPrice:model.unitRate,finalPrice:model.min*model.unitRate,detail:model.min+' units'};
  if(model.type==='range') return {option:model.nameOptions?.[0]||'',quantity:1,unitPrice:null,finalPrice:model.min,detail:model.nameOptions?.[0]||'Within listed range'};
  if(model.type==='variants'){
    const first=model.options[0];
    return {option:first.name,quantity:1,unitPrice:first.price,finalPrice:first.price,detail:first.name};
  }
  if(model.type==='quantity') return {option:model.nameOptions?.[0]||'',quantity:1,unitPrice:model.unitPrice,finalPrice:model.unitPrice,detail:model.nameOptions?.[0]||('1 '+model.unit)};
  if(model.type==='choice') return {option:model.options[0]||'',quantity:1,unitPrice:model.price,finalPrice:model.price,detail:model.options[0]||''};
  return {option:'',quantity:1,unitPrice:model.price,finalPrice:model.price,detail:''};
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
        <h2 class="font-serif text-2xl sm:text-4xl text-espresso border-b border-gold-primary/20 pb-3">${esc(group)}</h2>
        ${group === 'Botox Treatments' ? '<p class="mt-3 text-xs sm:text-sm text-espresso/70"><strong>Flat Rate:</strong> Rs. 1,000 per unit of Botox. Unit quantities are shown per treatment area.</p>' : ''}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        ${items.map(service => `
          <article class="menu-item-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                <span class="self-start text-[9px] sm:text-[10px] uppercase tracking-widest bg-gold-primary/10 text-gold-dark px-3 py-1 rounded-full font-semibold">${service.unit_rate ? 'Per Unit' : 'Treatment'}</span>
                <span class="font-serif text-xl sm:text-2xl font-bold text-gold-primary sm:text-right break-words">${esc(service.price_label || ('Rs. ' + Number(service.base_price || 0).toLocaleString()))}</span>
              </div>
              <h3 class="font-serif text-xl sm:text-2xl font-semibold text-espresso mb-2 break-words">${esc(service.name)}</h3>
              ${service.description ? '<p class="text-xs text-espresso/70 leading-relaxed mb-4">' + esc(service.description) + '</p>' : ''}
              ${service.unit_rate ? '<p class="text-xs text-espresso/70 mb-4"><strong>Flat Rate:</strong> Rs. ' + Number(service.unit_rate).toLocaleString() + ' per unit' + (service.units_label ? ' · ' + esc(service.units_label) : '') + '</p>' : ''}
            </div>
            <button data-book-service="${esc(service.id)}" class="book-treatment-btn w-full inline-flex justify-center py-3 mt-2 text-xs uppercase tracking-[0.2em] font-semibold btn-gold-outline rounded-full">Book Treatment</button>
          </article>
        `).join('')}
      </div>
    `;
    root.appendChild(section);
  });

  root.querySelectorAll('.book-treatment-btn').forEach(btn=>{
    btn.addEventListener('click',()=>openBooking(btn.dataset.bookService));
  });
}

function populateServiceSelect(){
  serviceSelect.innerHTML=services.map(s=>`<option value="${esc(s.id)}">${esc(s.subcategory||'Aesthetic')} — ${esc(s.name)} — ${esc(s.price_label||'')}</option>`).join('');
}

async function loadStaff(){
  try{
    const res=await fetch(PUBLIC_BOOKING_URL,{method:'GET'});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Could not load staff');
    staff=data.staff||[];
    staffSelect.innerHTML=staff.length
      ? staff.map(s=>`<option value="${esc(s.id)}">${esc(s.full_name)} — ${esc(s.job_title||'Staff')}</option>`).join('')
      : '<option value="">No staff available</option>';
  }catch(err){
    staffSelect.innerHTML='<option value="">Could not load staff</option>';
  }
}

function hidePricingControls(){
  optionWrap.classList.add('hidden');
  unitsWrap.classList.add('hidden');
  quantityWrap.classList.add('hidden');
  rangeWrap.classList.add('hidden');
}

function syncPricingUI(){
  activeService=services.find(s=>s.id===serviceSelect.value)||null;
  if(!activeService) return;
  const model=getPricingModel(activeService);
  pricingState=initialPricing(activeService);
  hidePricingControls();

  const options=model.type==='variants' ? model.options.map(x=>x.name) : (model.options||model.nameOptions||[]);
  if(options.length>1){
    optionWrap.classList.remove('hidden');
    optionSelect.innerHTML=options.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('');
    optionSelect.value=pricingState.option||options[0];
  }

  if(model.type==='units'){
    unitsWrap.classList.remove('hidden');
    unitsSelect.innerHTML=Array.from({length:(model.max-model.min)+1},(_,i)=>model.min+i)
      .map(n=>`<option value="${n}">${n} units — Rs. ${(n*model.unitRate).toLocaleString()}</option>`).join('');
    unitsSelect.value=String(pricingState.quantity);
    unitsNote.textContent='Flat rate: Rs. '+model.unitRate.toLocaleString()+' per unit.';
  }

  if(model.type==='quantity'){
    quantityWrap.classList.remove('hidden');
    quantityLabel.textContent='Quantity ('+model.unit+') *';
    quantityInput.step=model.unit==='ml'?'0.5':'1';
    quantityInput.value=pricingState.quantity;
  }

  if(model.type==='range'){
    rangeWrap.classList.remove('hidden');
    rangeInput.min=model.min;
    rangeInput.max=model.max;
    rangeInput.value=pricingState.finalPrice;
    rangeNote.textContent='Listed range: Rs. '+model.min.toLocaleString()+' – Rs. '+model.max.toLocaleString()+'.';
  }

  updatePriceSummary();
}

function updatePriceSummary(){
  priceDetail.textContent=pricingState.detail||activeService?.price_label||'';
  finalPriceEl.textContent='Rs. '+Number(pricingState.finalPrice||0).toLocaleString();
}

function applyOption(){
  const model=getPricingModel(activeService);
  const option=optionSelect.value;
  if(model.type==='variants'){
    const chosen=model.options.find(x=>x.name===option);
    pricingState={option,quantity:1,unitPrice:chosen?.price||0,finalPrice:chosen?.price||0,detail:option};
  }else if(model.type==='choice'){
    pricingState={option,quantity:1,unitPrice:model.price,finalPrice:model.price,detail:option};
  }else{
    pricingState.option=option;
    pricingState.detail=option+(model.type==='range'?' · Actual price':'');
  }
  updatePriceSummary();
}

function openBooking(serviceId){
  if(!services.length) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow='hidden';
  serviceSelect.value=serviceId&&services.some(s=>s.id===serviceId)?serviceId:services[0].id;
  dateInput.min=new Date().toISOString().slice(0,10);
  dateInput.value=dateInput.value||new Date().toISOString().slice(0,10);
  messageBox.classList.add('hidden');
  syncPricingUI();
}

function closeBooking(){
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow='';
}

optionSelect.addEventListener('change',applyOption);
unitsSelect.addEventListener('change',()=>{
  const model=getPricingModel(activeService);
  const qty=Number(unitsSelect.value);
  pricingState={...pricingState,quantity:qty,unitPrice:model.unitRate,finalPrice:qty*model.unitRate,detail:qty+' units'};
  updatePriceSummary();
});
quantityInput.addEventListener('input',()=>{
  const model=getPricingModel(activeService);
  const qty=Math.max(1,Number(quantityInput.value)||1);
  pricingState={...pricingState,quantity:qty,unitPrice:model.unitPrice,finalPrice:qty*model.unitPrice,detail:(pricingState.option?pricingState.option+' · ':'')+qty+' '+model.unit+(qty===1?'':'s')};
  updatePriceSummary();
});
rangeInput.addEventListener('input',()=>{
  pricingState={...pricingState,finalPrice:Number(rangeInput.value)||0,unitPrice:null,detail:(pricingState.option?pricingState.option+' · ':'')+'Actual price'};
  updatePriceSummary();
});
serviceSelect.addEventListener('change',syncPricingUI);
closeBtn.addEventListener('click',closeBooking);
cancelBtn.addEventListener('click',closeBooking);
topBookBtn.addEventListener('click',()=>openBooking(services[0]?.id));
modal.addEventListener('click',e=>{if(e.target===modal) closeBooking();});

form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const name=document.getElementById('public-name').value.trim();
  const phone=document.getElementById('public-phone').value.trim();
  const email=document.getElementById('public-email').value.trim();
  const staffId=staffSelect.value;
  if(!name||(!phone&&!email)||!staffId){
    messageBox.textContent='Please enter customer name, phone or email, and select staff.';
    messageBox.className='p-3 rounded-xl border text-xs bg-red-50 border-red-200 text-red-700';
    return;
  }

  submitBtn.disabled=true;
  submitBtn.textContent='Saving...';
  messageBox.classList.add('hidden');

  const model=getPricingModel(activeService);
  const payload={
    customerName:name,
    customerPhone:phone,
    customerEmail:email,
    serviceId:activeService.id,
    staffId,
    date:dateInput.value,
    time:document.getElementById('public-time').value,
    price:Number(pricingState.finalPrice)||0,
    quantity:Number(pricingState.quantity)||1,
    unitPrice:pricingState.unitPrice==null?null:Number(pricingState.unitPrice),
    notes:document.getElementById('public-notes').value.trim(),
    pricingDetail:{
      type:model.type,
      option:pricingState.option||null,
      detail:pricingState.detail||null,
      listedPrice:activeService.price_label||null,
      quantity:Number(pricingState.quantity)||1,
      unitPrice:pricingState.unitPrice==null?null:Number(pricingState.unitPrice),
      finalPrice:Number(pricingState.finalPrice)||0
    }
  };

  try{
    const res=await fetch(PUBLIC_BOOKING_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Could not save booking');
    messageBox.textContent='Booking saved successfully. Our team will contact you to confirm.';
    messageBox.className='p-3 rounded-xl border text-xs bg-green-50 border-green-200 text-green-800';
    form.reset();
    serviceSelect.value=activeService.id;
    syncPricingUI();
  }catch(err){
    messageBox.textContent=err.message||'Could not save booking.';
    messageBox.className='p-3 rounded-xl border text-xs bg-red-50 border-red-200 text-red-700';
  }finally{
    submitBtn.disabled=false;
    submitBtn.textContent='Save Booking';
  }
});

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
  populateServiceSelect();
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

Promise.all([loadMenu(),loadStaff()]);
