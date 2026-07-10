(function () {
  'use strict';

  var WHATSAPP_NUMBER = '5491164480443';
  var STORAGE_KEY = 'envacamp_cart';

  var CATEGORY_LABELS = {
    rafia: 'Bolsas de Rafia',
    polietileno: 'Bolsas de Polietileno',
    hilos: 'Hilos y Rafia suelta'
  };

  var cart = loadCart();

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- Nav (mobile) ---------------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', function () {
    var open = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------------- Tabs ---------------- */
  var tabBtns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');

  function activateTab(name) {
    tabBtns.forEach(function (b) { b.classList.toggle('is-active', b.dataset.tab === name); });
    panels.forEach(function (p) {
      var active = p.dataset.panel === name;
      p.classList.toggle('is-active', active);
      p.hidden = !active;
    });
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { activateTab(btn.dataset.tab); });
  });

  document.querySelectorAll('[data-goto-tab]').forEach(function (el) {
    el.addEventListener('click', function () {
      var category = el.dataset.gotoTab;
      activateTab(category);
      var form = document.getElementById('form-' + category);
      if (!form) return;
      if (el.dataset.presetUso) {
        var usoSelect = form.querySelector('[name=uso]');
        if (usoSelect) usoSelect.value = el.dataset.presetUso;
      }
      if (el.dataset.presetProducto) {
        var productoSelect = form.querySelector('[name=producto]');
        if (productoSelect) productoSelect.value = el.dataset.presetProducto;
      }
    });
  });

  /* ---------------- Custom size toggle ---------------- */
  document.querySelectorAll('.js-capacidad').forEach(function (select) {
    var panel = select.closest('form');
    var customField = panel.querySelector('.custom-size');
    if (!customField) return;
    select.addEventListener('change', function () {
      customField.hidden = select.value !== 'custom';
    });
  });

  /* ---------------- Cart persistence ---------------- */
  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  /* ---------------- Forms -> add to cart ---------------- */
  function describeItem(category, data) {
    if (category === 'rafia') {
      var medida = data.capacidad === 'custom'
        ? (data.ancho && data.alto ? data.ancho + 'x' + data.alto + ' cm' : 'Medida a definir')
        : data.capacidad;
      return {
        title: 'Bolsa de Rafia — ' + data.tipo,
        lines: [
          'Producto: ' + data.uso,
          'Color: ' + data.color,
          'Medida/Capacidad: ' + medida,
          'Cantidad: ' + data.cantidad + ' ' + data.unidad,
          data.impresion ? 'Impresión personalizada: Sí' : null
        ].filter(Boolean)
      };
    }
    if (category === 'polietileno') {
      var micronaje = data.micronaje === 'custom' ? (data.micronaje_custom || 'A definir') : data.micronaje;
      var medidaPoli = (data.ancho && data.alto) ? (data.ancho + 'x' + data.alto + ' cm') : 'A definir';
      return {
        title: 'Bolsa de Polietileno',
        lines: [
          'Producto: ' + data.producto,
          'Uso: ' + data.uso,
          'Espesor: ' + micronaje,
          'Medida: ' + medidaPoli,
          'Cantidad: ' + data.cantidad + ' ' + data.unidad
        ]
      };
    }
    if (category === 'hilos') {
      return {
        title: data.tipo,
        lines: [
          'Presentación: ' + data.presentacion,
          'Color: ' + data.color,
          'Cantidad: ' + data.cantidad + ' ' + data.unidad
        ]
      };
    }
  }

  document.querySelectorAll('form[data-panel]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var category = form.dataset.panel;
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = value;
      });
      data.impresion = form.querySelector('[name=impresion]') ? form.querySelector('[name=impresion]').checked : false;

      var item = describeItem(category, data);
      cart.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        category: category,
        title: item.title,
        lines: item.lines
      });
      saveCart();
      renderCart();
      openCart();
      form.reset();
      var customField = form.querySelector('.custom-size');
      if (customField) customField.hidden = true;
    });
  });

  /* ---------------- Cart drawer render ---------------- */
  var cartItemsEl = document.getElementById('cartItems');
  var cartEmptyEl = document.getElementById('cartEmpty');
  var cartCountEl = document.getElementById('cartCount');

  function renderCart() {
    cartItemsEl.querySelectorAll('.cart-item').forEach(function (n) { n.remove(); });
    cartEmptyEl.style.display = cart.length ? 'none' : 'block';
    cartCountEl.textContent = cart.length;

    cart.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML =
        '<div class="cart-item-info">' +
          '<strong>' + escapeHtml(entry.title) + '</strong>' +
          entry.lines.map(function (l) { return '<span>' + escapeHtml(l) + '</span>'; }).join('') +
        '</div>' +
        '<button class="cart-item-remove" aria-label="Quitar" data-id="' + entry.id + '">&times;</button>';
      cartItemsEl.appendChild(row);
    });
  }

  cartItemsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.cart-item-remove');
    if (!btn) return;
    cart = cart.filter(function (i) { return i.id !== btn.dataset.id; });
    saveCart();
    renderCart();
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------- Cart drawer open/close ---------------- */
  var cartDrawer = document.getElementById('cartDrawer');
  var cartOverlay = document.getElementById('cartOverlay');
  var cartToggle = document.getElementById('cartToggle');
  var cartClose = document.getElementById('cartClose');

  function openCart() {
    cartDrawer.classList.add('is-open');
    cartOverlay.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
  }
  function closeCart() {
    cartDrawer.classList.remove('is-open');
    cartOverlay.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
  }

  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  /* ---------------- Clear cart ---------------- */
  document.getElementById('clearCart').addEventListener('click', function () {
    if (!cart.length) return;
    if (!confirm('¿Vaciar todo el pedido?')) return;
    cart = [];
    saveCart();
    renderCart();
  });

  /* ---------------- Quote via WhatsApp ---------------- */
  document.getElementById('quoteBtn').addEventListener('click', function () {
    if (!cart.length) {
      alert('Agregá al menos un producto a tu pedido antes de cotizar.');
      return;
    }
    var name = document.getElementById('custName').value.trim();
    var loc = document.getElementById('custLoc').value.trim();
    var notes = document.getElementById('custNotes').value.trim();

    var msg = 'Hola ENVACAMP! Quiero cotizar el siguiente pedido:\n\n';

    var byCategory = {};
    cart.forEach(function (item) {
      byCategory[item.category] = byCategory[item.category] || [];
      byCategory[item.category].push(item);
    });

    Object.keys(byCategory).forEach(function (cat) {
      msg += '*' + CATEGORY_LABELS[cat] + '*\n';
      byCategory[cat].forEach(function (item, idx) {
        msg += (idx + 1) + '. ' + item.title + '\n';
        item.lines.forEach(function (l) { msg += '   - ' + l + '\n'; });
      });
      msg += '\n';
    });

    if (name) msg += 'Nombre: ' + name + '\n';
    if (loc) msg += 'Localidad: ' + loc + '\n';
    if (notes) msg += 'Comentarios: ' + notes + '\n';

    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener');
  });

  renderCart();
})();
