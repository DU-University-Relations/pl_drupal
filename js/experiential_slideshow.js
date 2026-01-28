(function ($, Drupal) {
  Drupal.behaviors.experientialSlideshow = {
    attach: function (context, settings) {

      $(document).ready(function() {
        var sliderWrapper = $('.paragraph--story-slideshow-wrapper');

        // Initializing slick slider
        sliderWrapper.each(function() {
          var progressBar = $(this).find('.progress');
          var progressBarLabel = $(this).find( '.slider__label' );
          var slider = $(this).find('> div:first-child');

          slider.slick({
            dots: false,
            infinite: false,
            speed: 300,
            fade: true,
            cssEase: 'linear',
            arrows: true,
            touchMove: true,
          });


          // Adds class to button on first slide so it covers whole slider.
          slider.find('button.slick-next').addClass('full-width');

          slider.find('button.slick-arrow').on("click", function() {
            if(slider.find('button.slick-prev').hasClass('slick-disabled')) {
              slider.find('button.slick-next').addClass('full-width');
            }
            else {
              slider.find('button.slick-next').removeClass('full-width');
            }
          });

          // Progress bar
          slider.on('beforeChange', function(event, slick, currentSlide, nextSlide) {
            var calc = ( (nextSlide) / (slick.slideCount - 1) ) * 100;

            progressBar
              .css('background-size', calc + '% 100%')
              .attr('aria-valuenow', calc );
            progressBarLabel.text( calc + '% completed' );
          });

          // Removing arrows from last slide. Removing Prev arrow from first slide and making shure the rest of the slides have arrows.
          slider.on('afterChange', function(event, slick, currentSlide, nextSlide){

            var currentSlide = slider.slick('slickCurrentSlide');
            var i = (currentSlide ? currentSlide : 0) + 1;
            var totalSlides = slick.slideCount;
            if(i == totalSlides) {
              slider.find('.slick-prev').hide();
              slider.find('.slick-next').hide();
            } else if(i == 1) {
              slider.find('.slick-next').show();
              slider.find('.slick-prev').hide();
            } else {
              slider.find('.slick-next').show();
              slider.find('.slick-prev').show();
            }
          });

          // Copy to clipboard share link
          var clipboard = new Clipboard('.btn-copy', {
            text: function() {
                return document.querySelector('input[type=hidden]').value;
            }
          });

          clipboard.on('success', function(e) {
            var tooltip = document.getElementById("slideTooltip");
            tooltip.innerHTML = "Copied URL";
          });

          $("#input-url").val(location.href);
          //safari
          if (navigator.vendor.indexOf("Apple")==0 && /\sSafari\//.test(navigator.userAgent)) {
            $('.btn-copy').on('click', function() {
              var msg = window.prompt("Copy this link", location.href);

            });
          }

          //Return to begining
          slider.find(".back-to-beginning").on("click", (function(e){
            e.preventDefault();
            slider.slick('slickGoTo', 0);
          })
          );

        });

      });

    }
  };
})(jQuery, Drupal);
