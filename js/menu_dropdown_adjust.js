(function ($, Drupal) {
  var self = Drupal.behaviors.menuDropdownAdjust = {
    attach: function (context) {

      self.adjustDropdowns();
      self.menuKeyBoardFunctions();

      $(window).resize(function () {
        setTimeout(self.adjustDropdowns,1000);
      });
      $(window).scroll(function () {
        setTimeout(self.adjustDropdowns,500);
      });

    },
    adjustDropdowns: function () {
      $('.menu-dropdown--links-only').each(function () {
        var $parentNav = $(this).siblings('a');
        var offset = $parentNav.offset();
        var dropdownWidth = $(this).width();
        var browserWidth = $(window).width();
        // console.log(dropdownWidth);
        // console.log($(window).width());

        if((dropdownWidth + offset.left) > browserWidth) {
          $(this).css('left','auto');
          $(this).css('right',0);
        } else {
          $(this).css('left',offset.left);
        }
      });
    },
    menuKeyBoardFunctions: function () {
      $('.menu-dropdown').each(function () {
        var $parentLink = $(this).siblings('a');
        $parentLink.focus(function () {
          $(this).parent().siblings().removeClass('open');
        });
        $parentLink.keydown( function(e){
          if (e.keyCode === 13 || e.which === 13) {
            e.preventDefault();
            var $parent = $(this).parent();
            if ($parent.hasClass('open')) {
              $parent.find('.menu-dropdown__sub-links a').first().focus();
            } else {
              $(this).parent().addClass('open');
            }
          }
        });
      });
    }
  };
})(jQuery, Drupal);
