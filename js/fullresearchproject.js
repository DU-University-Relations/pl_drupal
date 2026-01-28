/**
 * @file
 * Initialize's JavaScript for Profile and adds custom adjustments
 */

(function ($, Drupal) {
  Drupal.behaviors.profileLoad = {
    attach: function (context, settings) {
      $('.sub-menu__back-link', context).attr('href', document.referrer);
    }
  };
})(jQuery, Drupal);
