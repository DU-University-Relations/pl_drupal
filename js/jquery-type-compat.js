/**
 * @file
 * Restores the jQuery.type() API required by Slick 1.8.1 under jQuery 4.
 */

(function ($) {
  'use strict';

  if (typeof $.type !== 'function') {
    $.type = function (value) {
      if (value === null || value === undefined) {
        return String(value);
      }

      return typeof value === 'object' || typeof value === 'function'
        ? Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
        : typeof value;
    };
  }
})(jQuery);
