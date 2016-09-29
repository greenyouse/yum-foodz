var recipe = {};

/**
 * Updates the tablist aria info and hidden state for the tablist widget
 *
 * @param {Event} event An event object
 * @param {Array<Element>} tabs Tab menu elements
 * @param {Array<subpages>} subpages Recipe subpage elements
 */
recipe.shiftTabIndex = function(event, tabs, subpages) {
  var selectedNode = event.target;

  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (tabs[i] == selectedNode) {
      tab.tabIndex = 1;
      tab.setAttribute('aria-selected', true);
    } else {
      tab.tabIndex = 0;
      tab.setAttribute('aria-selected', false);
    }
  }

  for (i = 0; i < subpages.length; i++) {
    var page = subpages[i];
    if (tabs[i] == selectedNode) {
      page.className = page.className.replace(/\shidden/g , '');
      page.setAttribute('aria-expanded', true);

    } else {
      var regex = /\shidden/g,
          classes = page.className;

      if (!regex.test(classes))
        page.className += ' hidden';

      page.setAttribute('aria-expanded', false);
    }

  }
};

/**
 * Initialize event listeners
 */
recipe.init = function() {
  /** @type {Element} */
var skipLinks = document.querySelectorAll('ul[role=tablist] > *'),
    /** @type {Element} */
    subpages = document.querySelectorAll('section');

  for (var i = 0; i < skipLinks.length; i++) {
    var skip = skipLinks[i];

    skip.addEventListener('click', function(event) {
      recipe.shiftTabIndex(event, skipLinks, subpages);
    }, false);
    skip.addEventListener('touchend', function(event) {
      recipe.shiftTabIndex(event, skipLinks, subpages);
    }, false);
    skip.addEventListener('keydown', function(event) {
      if (event.keyCode == 13) {
        recipe.shiftTabIndex(event, skipLinks, subpages);
      }
    }, false);
  }
}();
