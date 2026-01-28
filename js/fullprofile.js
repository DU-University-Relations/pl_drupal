/**
 * @file
 * Initialize's JavaScript for Profile and adds custom adjustments
 */

(function ($, Drupal) {
  Drupal.behaviors.profileLoad = {
    attach: function (context, settings) {
      $('.profile-back-link', context).attr('href', document.referrer);
    }
  };
})(jQuery, Drupal);
