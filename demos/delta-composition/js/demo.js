/*
 * DELTA composition demo — page behaviour and live cascade measurement.
 *
 * Nothing here styles anything. It toggles which cascade wiring is active,
 * which brand is applied, and reads back computed values so a reader can see
 * the result without opening devtools.
 */
(function () {
  'use strict';

  var TAILWIND_GREEN = 'rgb(0, 106, 78)';
  var LEGACY_FONT = 'Comic Sans MS';
  var LEGACY_SIZE = '11px';

  var links = {
    sourceOrder: document.getElementById('cascade-source-order'),
    layered: document.getElementById('cascade-layered'),
    deltaTokens: document.getElementById('delta-tokens'),
  };

  var THEME_CLASSES = [
    'mg-theme-delta',
    'mg-theme-preventionweb',
    'mg-theme-mcr',
    'mg-theme-irp',
  ];

  var MODE_NOTES = {
    'source-order':
      'Mode A is what Mangrove ships today: no custom layers, import position ' +
      'decides. Tailwind is the one thing a consumer cannot reorder — its own ' +
      'output is wrapped in @layer, and unlayered CSS always beats layered CSS.',
    layered:
      'Mode B adds four lines to the consuming app: @layer legacy, mangrove, tw ' +
      'and three @import ... layer(...) statements. Mangrove, Tailwind and the ' +
      'legacy stylesheet are all unmodified.',
  };

  /* ---------------------------------------------------------------- utils */

  function set(name, value, state) {
    var el = document.querySelector('[data-readout="' + name + '"]');
    if (!el) return;
    el.textContent = value;
    if (state) el.setAttribute('data-state', state);
  }

  function computed(id, prop) {
    var el = document.getElementById(id);
    if (!el) return '';
    return window.getComputedStyle(el).getPropertyValue(prop).trim();
  }

  function firstFamily(value) {
    return (value.split(',')[0] || '').replace(/["']/g, '').trim();
  }

  /* ------------------------------------------------------------ specimens */

  function measure() {
    /* ---- A: Tailwind utility vs Mangrove component rule ---- */
    var aBg = computed('specimen-a', 'background-color');
    var aTailwindWins = aBg === TAILWIND_GREEN;
    set('a-value', aBg || 'not measurable');
    set('a-winner', aTailwindWins ? 'Tailwind utility' : 'Mangrove component CSS');
    set(
      'a-verdict',
      aTailwindWins
        ? 'PASS — the app overrode a Mangrove component with one utility class. ' +
            'Mangrove is not a chokehold.'
        : 'FAIL — Mangrove wins. Tailwind utilities sit in @layer utilities and ' +
            'Mangrove is unlayered, so no import order can make the utility win. ' +
            'The app would have to reach for !important or a custom selector.',
      aTailwindWins ? 'pass' : 'fail'
    );

    /* ---- B1: Mangrove vs ordinary legacy CSS ---- */
    var b1Size = computed('specimen-b1', 'font-size');
    var b1Family = firstFamily(computed('specimen-b1', 'font-family'));
    var b1MangroveWins = b1Size !== LEGACY_SIZE && b1Family !== LEGACY_FONT;
    set('b1-value', (b1Size || '?') + ' / ' + (b1Family || '?'));
    set('b1-winner', b1MangroveWins ? 'Mangrove' : 'Legacy CSS');
    set(
      'b1-verdict',
      b1MangroveWins
        ? 'PASS — equal specificity, and Mangrove is imported after the legacy ' +
            'stylesheet. Source order is enough for the easy case.'
        : 'FAIL — the legacy rule won an equal-specificity contest, which means ' +
            'Mangrove is being imported before the legacy stylesheet.',
      b1MangroveWins ? 'pass' : 'fail'
    );

    /* ---- B2: Mangrove vs aggressive legacy CSS ----
     * Judged on font-size and font-weight, the two properties BOTH stylesheets
     * declare on the h2. font-family is reported alongside because it is the
     * interesting failure: Mangrove never declares font-family on h2, it
     * inherits from body, and an inherited value loses to any declared one no
     * matter which layer declares it. See the note in the specimen card.
     */
    var b2Size = computed('specimen-b2', 'font-size');
    var b2Weight = computed('specimen-b2', 'font-weight');
    var b2Family = firstFamily(computed('specimen-b2', 'font-family'));
    var b2MangroveWins = b2Size !== LEGACY_SIZE && b2Weight === '700';
    set(
      'b2-value',
      (b2Size || '?') + ' / ' + (b2Weight || '?') + ' / ' + (b2Family || '?')
    );
    set('b2-winner', b2MangroveWins ? 'Mangrove' : 'Legacy CSS');
    set(
      'b2-verdict',
      b2MangroveWins
        ? 'PASS on the declared properties — layer order beat specificity. A ' +
            '(1,2,1) legacy rule lost to a (0,0,1) Mangrove rule because the ' +
            'mangrove layer is declared after the legacy layer. font-family is ' +
            'still ' +
            b2Family +
            ': see the caveat below.'
        : 'FAIL — expected in mode A. Specificity (1,2,1) beats (0,0,1) and no ' +
            'amount of import reordering changes that. This is the case that ' +
            'needs layers.',
      b2MangroveWins ? 'pass' : 'fail'
    );

    /* ---- D: Mangrove's bare-element styles vs the app's own chrome ---- */
    var dColor = computed('specimen-d', 'color');
    var dAppWins = dColor === 'rgb(255, 255, 255)';
    set('d-value', dColor || '?');
    set(
      'd-winner',
      dAppWins ? 'Tailwind utility (the app)' : "Mangrove's global a rule"
    );
    set(
      'd-verdict',
      dAppWins
        ? 'PASS — the app’s own navigation keeps its own colour.'
        : 'FAIL — the link is brand navy on a brand navy bar, so it is ' +
            'invisible. The app did nothing wrong: Mangrove’s bare-element ' +
            'rule reached into UI that carries no Mangrove classes at all.',
      dAppWins ? 'pass' : 'fail'
    );

    /* ---- C: brand by token ---- */
    var swatch = document.querySelector('.demo-swatches');
    var token = swatch
      ? window
          .getComputedStyle(swatch)
          .getPropertyValue('--mg-color-interactive')
          .trim()
      : '';
    var brandTag = document.querySelector('.demo-swatches .mg-tag');
    var brandButton = document.querySelector('.demo-swatches .mg-button');
    var brandChip = document.querySelector('.demo-swatches span[class*="bg-["]');
    var tagBg = brandTag ? window.getComputedStyle(brandTag).backgroundColor : '';
    var buttonBg = brandButton
      ? window.getComputedStyle(brandButton).backgroundColor
      : '';
    var chipBg = brandChip ? window.getComputedStyle(brandChip).backgroundColor : '';

    set('brand-token', token || 'not set');
    set('brand-tag', tagBg || '?');
    set('brand-chip', chipBg || '?');
    set(
      'brand-button',
      buttonBg === 'rgba(0, 0, 0, 0)'
        ? 'transparent — .mg-theme-delta deliberately makes the primary button ' +
            'an outline button. aria/tokens/delta.css does not, so the two DELTA ' +
            'brand definitions do not agree.'
        : buttonBg || '?'
    );

    var brandMatches = tagBg && chipBg && tagBg === chipBg;
    set(
      'brand-verdict',
      brandMatches
        ? 'PASS — a Mangrove component and the app’s own Tailwind chip resolved ' +
            'to the same brand colour from the same token. Neither was restyled ' +
            'by hand, and no Mangrove CSS was forked.'
        : 'The Mangrove component and the Tailwind chip resolved to different ' +
            'values. Check the values above.',
      brandMatches ? 'pass' : 'fail'
    );
  }

  /*
   * Toggling a <link disabled> re-runs its @import chain, so computed values
   * are briefly the UA defaults. Poll until Mangrove's tokens are present and
   * two consecutive snapshots agree, then measure once.
   */
  function remeasure() {
    var previous = null;
    var attempts = 0;

    var brandButton = document.querySelector('.demo-swatches .mg-button');

    function snapshot() {
      return [
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue('--mg-color-blue-900')
          .trim(),
        computed('specimen-a', 'background-color'),
        computed('specimen-b1', 'font-size'),
        computed('specimen-b2', 'font-size'),
        computed('specimen-d', 'color'),
        /* Mangrove transitions button colours, so this keeps the poll running
           until the transition has finished rather than reading a midpoint. */
        brandButton ? window.getComputedStyle(brandButton).backgroundColor : '',
      ].join('|');
    }

    function poll() {
      var current = snapshot();
      attempts += 1;
      var settled = current === previous && current.indexOf('|') !== 0;
      if (settled || attempts > 60) {
        measure();
        return;
      }
      previous = current;
      window.setTimeout(poll, 50);
    }

    poll();
  }

  /* ----------------------------------------------------------- mode switch */

  function setMode(mode) {
    links.sourceOrder.disabled = mode !== 'source-order';
    links.layered.disabled = mode !== 'layered';

    var buttons = document.querySelectorAll('.demo-segmented button');
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute(
        'aria-pressed',
        String(button.getAttribute('data-mode') === mode)
      );
    });

    var note = document.getElementById('mode-note');
    if (note) note.textContent = MODE_NOTES[mode];

    remeasure();
  }

  /* ---------------------------------------------------------- brand switch */

  function setBrand(brand) {
    THEME_CLASSES.forEach(function (cls) {
      document.body.classList.remove(cls);
    });
    links.deltaTokens.disabled = brand !== 'delta-tokens';

    if (brand === 'delta-class') document.body.classList.add('mg-theme-delta');
    if (brand === 'preventionweb') {
      document.body.classList.add('mg-theme-preventionweb');
    }
    if (brand === 'mcr') document.body.classList.add('mg-theme-mcr');
    if (brand === 'irp') document.body.classList.add('mg-theme-irp');

    remeasure();
  }

  /* ------------------------------------------------------------------ tabs */

  /*
   * A cut-down copy of the show/hide half of stories/assets/js/tabs.js: the
   * active link carries .is-active and the inactive panels carry the hidden
   * attribute, which is what Mangrove's own runtime does. Kept local so this
   * page stays a plain HTML file with no module loading.
   */
  function wireTabs() {
    var groups = document.querySelectorAll('[data-demo-tabs]');
    Array.prototype.forEach.call(groups, function (group) {
      var tabs = group.querySelectorAll('.mg-tabs__link');
      var panels = group.querySelectorAll('.mg-tabs__section');

      function activate(tab) {
        var targetId = tab.getAttribute('href').slice(1);
        Array.prototype.forEach.call(tabs, function (other) {
          var on = other === tab;
          other.classList.toggle('is-active', on);
          other.setAttribute('aria-selected', String(on));
          other.setAttribute('tabindex', on ? '0' : '-1');
        });
        Array.prototype.forEach.call(panels, function (panel) {
          panel.hidden = panel.id !== targetId;
        });
      }

      Array.prototype.forEach.call(tabs, function (tab) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', tab.getAttribute('href').slice(1));
        tab.addEventListener('click', function (event) {
          event.preventDefault();
          activate(tab);
        });
      });

      Array.prototype.forEach.call(panels, function (panel) {
        panel.setAttribute('role', 'tabpanel');
      });

      var initial = group.querySelector('.mg-tabs__link.is-active') || tabs[0];
      if (initial) activate(initial);
    });
  }

  /* -------------------------------------------------------- build sanity */

  function checkBuild() {
    var probe = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--mg-color-blue-900')
      .trim();
    if (!probe) {
      var warning = document.getElementById('build-warning');
      if (warning) warning.hidden = false;
    }
  }

  /* ------------------------------------------------------------------ init */

  document
    .querySelector('.demo-segmented')
    .addEventListener('click', function (event) {
      var button = event.target.closest('button[data-mode]');
      if (button) setMode(button.getAttribute('data-mode'));
    });

  document.getElementById('brand').addEventListener('change', function (event) {
    setBrand(event.target.value);
  });

  wireTabs();
  setMode('source-order');

  window.addEventListener('load', function () {
    checkBuild();
    remeasure();
  });
})();
