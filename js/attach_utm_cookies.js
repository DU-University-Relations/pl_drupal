// filepath: /Users/joshuamcgehee/Documents/Repos/drupal-composer-managed/web/themes/contrib/pl_drupal/js/custom.js
(function ($, Drupal) {
    'use strict';
  
    Drupal.behaviors.customBehavior = {
      attach: function (context, settings) {
        // Your custom JavaScript code here
        console.log('Successfully loaded UTM Cookie script');
      }
    };
  
  })(jQuery, Drupal);