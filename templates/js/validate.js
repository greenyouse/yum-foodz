var validate = {};


/**
 * Checks a field for length and manages the error message
 *
 * @param {Element} field An input field
 * @param {Element} errorEl An element with an error message
 * @param {Number} keyCode The keyCode from an event
 */
validate.checkEmpty = function(field, errorEl, keyCode) {
  if (field.value.length == 0 && (keyCode === undefined || keyCode == 8)) {
    errorEl.hidden = false;
  } else {
    errorEl.hidden = true;
  }
};

/**
 * Toggles the submission button based on required inputs
 * @param {Array.<Element>} fields The required input fields
 */
validate.showSubmit = function(fields) {
  var submitBtn = document.querySelector('button'),
      lengthCheck = true;

  for (var i = 0; i < fields.length; i++) {
    if (fields[i].value.length == 0) {
      lengthCheck = false;
    }
  }

  if (lengthCheck) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
};

/**
 * Initialize the event listeners
 */
validate.init = function() {
  var /** @type {Element} */
  title = document.querySelector('input[name=title]'),
  /** @type {Element} */
  ingredients = document.querySelector('textarea[name=ingredients]'),
  /** @type {Element} */
  directions = document.querySelector('textarea[name=directions]');

  /** @type {Element} */
  var titleError = document.getElementById('titleError'),
      /** @type {Element} */
      ingredientsError = document.getElementById('ingredientsError'),
      /** @type {Element} */
      directionsError = document.getElementById('directionsError');

  var fields = [title, ingredients, directions];
  // initialize with disabled if JS is enabled
  validate.showSubmit(fields);

  title.onblur = function() {
    validate.checkEmpty(title, titleError);
    validate.showSubmit(fields);
  };
  ingredients.onblur = function() {
    validate.checkEmpty(ingredients, ingredientsError);
    validate.showSubmit(fields);
  };
  directions.onblur = function() {
    validate.checkEmpty(directions, directionsError);
    validate.showSubmit(fields);
  };
  directions.onkeyup = function(e) {
    validate.checkEmpty(directions, directionsError, e.keyCode);
    validate.showSubmit(fields);
  };
}();
