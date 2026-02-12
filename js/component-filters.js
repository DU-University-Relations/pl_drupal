/**
 * @file
 * Isotope-based filtering functionality for card lists and events.
 */

;(function ($, Drupal, once) {
  'use strict';

  Drupal.behaviors.card_list_module = {
      attach: function (context, settings) {
          if (!$('.cards-list-module').hasClass('js-card-list-processed')) {
              $(once('card_list_module', '.cards-list-module', context)).each(function() {
                  $(this).addClass('js-card-list-processed');
              });

              if (typeof $grid !== 'undefined') {
                $('.btn--academic-filter.active[data-filter]').triggerHandler('click', {sort:true,sortBy:['name']});
              }

              var letter_template = $('#letterTemplate').html();
              var ap_letters = [];
              var ap_letter_classes = {};

              $('.js-filter-cards > .columns').each(function () {
                  var titleFirstLetter = $.trim($(this).attr('data-filter-name')).substr(0, 1).toUpperCase();

                  if (typeof ap_letter_classes[titleFirstLetter] === 'undefined') {
                      ap_letter_classes[titleFirstLetter] = [];
                  }

                  if ($.inArray(titleFirstLetter, ap_letters) === -1) {
                      ap_letters.push(titleFirstLetter);
                  }

                  var card_classes = $(this).attr("class").split(/\s+/);
                  for (var i = 0; i < card_classes.length; i++) {
                      if (card_classes[i].substr(0, 7) == 'filter-' && card_classes[i].substr(-2, 2) === '-Y') {
                          if ($.inArray(card_classes[i], ap_letter_classes[titleFirstLetter]) === -1) {
                              ap_letter_classes[titleFirstLetter].push(card_classes[i]);
                          }
                      }
                  }
              });

              // Loop through a to z.
              for (var i = 65; i <= 90; i++) {
                  var currentLetter = String.fromCharCode(i);

                  if ($.inArray(currentLetter, ap_letters) === -1) {
                      $(".alphabet-filter-holder > a:contains('" + currentLetter + "')").addClass('inactive');
                  }
                  else {
                      var letter = letter_template.split('__LETTER__').join(currentLetter);
                      var $tpl = $(letter);
                      $('.js-filter-cards').append($tpl);
                  }
              }

              // Init Isotope.
              $("#academic-filters .btn--academic-filter").first().addClass('active');
              var initialAcademicFilters = $("#academic-filters .btn--academic-filter.active[data-filter]").attr("data-filter");

              if ($('.scholarship-list').length) {
                  var isotopeConf = {itemSelector: '.card-list-item', layoutMode: 'fitRows' };
              }
              else {
                  var isotopeConf = {
                      itemSelector: '.card-list-item',
                      layoutMode: 'fitRows',
                      getSortData: {
                          name: '[data-filter-name]',//, text from querySelector.
                          school: '[data-filter-school]' // school.
                      },
                      filter: initialAcademicFilters + ', .ap-letter, .psychology',
                      sortBy: ['name']
                  };
              }

              if ($('.activity-card-list').length) {
                var isotopeConf = {itemSelector: '.card-list-item', layoutMode: 'fitRows' };
              }

              var $grid = $('.js-filter-cards').isotope(isotopeConf);
              // Bind filter button click.
              $('.btn--academic-filter').not('.info').on('touchstart click', function (e,data) {
                  e.preventDefault();

                  var $btnFilter = $(this);
                  if ($('#du-loader').is(':hidden')) {
                      $('#du-loader').fadeIn(function () {
                      });
                  }
                  hide_open_cards();
                  var filterValue = $($btnFilter).attr('data-filter');
                  filterValue += $('.alphabet-filter-holder').hasClass('active-filter') ? ', .ap-letter' : '';
                  filterValue += ', .psychology';

                  $grid.one('arrangeComplete', function () {
                      if (typeof(e.isTrigger) == 'undefined') {
                          $('#academic-filter-toggler').foundation('toggleMenu');
                          $('#academic-filter-toggler > a.open').removeClass('open');
                          $('.btn--academic-filter[data-filter]').removeClass('active');
                          $btnFilter.addClass('active');
                      }
                      $('#du-loader').fadeOut();
                  });

                  window.setTimeout(function () {
                      var dict = {filter: filterValue};
                      if (data && data.sort) {
                          dict['sortBy'] = data.sortBy;
                      }
                      $grid.isotope(dict);
                  }, 400);
              });

              $('.alphabet-filter-holder > a').on('click', function (e) {
                  e.preventDefault();
              });

              $('.alphabet-filter-holder > a').not('.inactive').on('click', function (e) {
                  var letter_card_selector = '.ap-letter[data-filter-name="' + $(this).text() + '"]';

                  $(document).scrollTo(letter_card_selector, 300, {offset: {top: -60, left: 0} });
              });

              var animating = false;
              var correction = 65;
              // Card click.

              // Psychology CTA exception?.
              $('.card-list-item.psychology').find('.cards-list__content').on('click', function () {
                  window.location.search = "?search=psychology";
              });
              // End Psychology exception.

              $('.card-list-item').not('.ap-letter').not('.psychology').find('.cards-list__content').on('click', function (e, data) {
                  var animation_length = 300;
                  var scrollTo = !data; // Passed from trigger.

                  if (animating) {
                      return;
                  }

                  animating = true;

                  setTimeout(function () {
                      animating = false;
                  }, animation_length * 2);

                  var $this_card = $(this).closest('.card-list-item');
                  var $js_filter_cards = $this_card.closest('.js-filter-cards');
                  var $flyout = $this_card.find('.flyout');
                  var $more_btn = $this_card.find('.more-button');
                  var items_in_row = Math.round($js_filter_cards.width() / $this_card.outerWidth());
                  var fade_animation = false; // Same row, diff card.
                  var prefix = "+";
                  // If there are open items.

                  if ($js_filter_cards.find('.card-list-item--open').length) {

                      // If it's this one.
                      if ($this_card.hasClass('card-list-item--open')) {
                          prefix = "-";
                          toggle_card();
                      }
                      else {
                          // Same row or not?.
                          $js_filter_cards.find('.card-list-item--open').each(function () {
                              if (!fade_animation && $(this).is(':visible') && $(this).css('top') == $this_card.css('top')) {
                                  fade_animation = true;
                              }
                          });

                          if (fade_animation) { // Same row diff card.
                              // Close other open items.
                              $js_filter_cards.find('.card-list-item--open').not($this_card).each(function () {
                                  var $this = $(this);
                                  var $open_flyout = $this.find('.flyout');
                                  $open_flyout.closest('.cards-list__holder').addClass('fading');
                                  $open_flyout.fadeOut(animation_length, function () {
                                      $open_flyout.closest('.cards-list__holder').removeClass('fading');
                                      $this.removeClass('card-list-item--open');
                                      $this.find('.more-button>span').removeClass('icon-du-minus').addClass('icon-du-plus');
                                  });
                              });

                              $js_filter_cards.find('[data-moved]').promise().done(function () {
                                  toggle_card();
                              });
                          }
                          else {
                              var animate_container = $js_filter_cards.find('[data-moved]').length ?
                                  $js_filter_cards.find('[data-moved]').first().attr('data-moved') :
                                  $js_filter_cards.find('.card-list-item--open .flyout').outerHeight() + correction;
                              // Close other open items.
                              $js_filter_cards.find('.card-list-item--open').not($this_card).each(function () {
                                  var $this = $(this);
                                  var $open_flyout = $this.find('.flyout');
                                  $open_flyout.closest('.cards-list__holder').addClass('fading');
                                  $open_flyout.slideUp(animation_length, function () {
                                      $open_flyout.closest('.cards-list__holder').removeClass('fading');
                                      $this.removeClass('card-list-item--open');
                                      $this.find('.more-button>span').removeClass('icon-du-minus').addClass('icon-du-plus');
                                  });
                              });
                              // Animate container.
                              $js_filter_cards.animate({
                                  height: "-=" + animate_container
                              }, animation_length);

                              if ($js_filter_cards.find('.card-list-item--open').first().offset().top < $this_card.offset().top) {
                                  $(document).scrollTo({top: "-=" + animate_container, left: 0}, animation_length);
                              }
                              // Animate cards below.
                              $js_filter_cards.find('[data-moved]').each(function () {
                                  $(this).animate({
                                      top: "-=" + $(this).attr('data-moved')
                                  }, animation_length, function () {
                                      $(this).removeAttr('data-moved');
                                  });
                              });

                              $js_filter_cards.find('[data-moved], .flyout').promise().done(function () {
                                  toggle_card();
                              });
                          } //return;
                      }
                  }
                  else {
                      toggle_card();
                  }

                  function toggle_card() {
                      // Find offset left.
                      var offset_left = parseInt($this_card.css('left'));
                      $('.js-filter-cards > .columns').each(function () {
                          if ($(this).is(':visible') && $(this).css('top') == $this_card.css('top')) {
                              offset_left = Math.min(parseInt($(this).css('left')), offset_left);
                          }
                      });

                      $flyout
                          .outerWidth($this_card.outerWidth() * items_in_row - 2 * parseInt($this_card.css('padding-left')) - 3)
                          .css('left', '-' + (parseInt($this_card.css('left')) - offset_left) + 'px');

                      var flyout_outer_height = $flyout.outerHeight() + correction;
                      var this_card_position_top = $this_card.position().top;

                      $flyout.closest('.cards-list__holder').addClass('fading');
                      if (fade_animation) {
                          $flyout.fadeIn(animation_length, function () {
                              $flyout.closest('.cards-list__holder').removeClass('fading');
                          });

                          var moved_diff = flyout_outer_height - parseFloat($js_filter_cards.find('.card-list-item[data-moved]').first().attr('data-moved'));
                          var animation_top = moved_diff > 0 ? '+=' + moved_diff : '-=' + (0 - moved_diff);

                          $js_filter_cards.animate({
                              height: animation_top
                          }, animation_length, function () {
                              $more_btn.find('>span').toggleClass('icon-du-plus icon-du-minus');
                              $this_card.toggleClass('card-list-item--open');
                          });

                          $('.card-list-item[data-moved]').each(function () {
                              $(this).animate({
                                  top: animation_top
                              }, animation_length, function () {
                                  // Prefix is always "+".
                                  $(this).attr('data-moved', flyout_outer_height);
                              });
                          });

                      }
                      else {
                          $flyout.slideToggle(animation_length, function () {
                              $flyout.closest('.cards-list__holder').removeClass('fading');
                              if (scrollTo && prefix == '+') {
                                  $(document).scrollTo($this_card, 300, {offset: {top: -60, left: 0} });
                              }
                          });

                          $js_filter_cards.animate({
                              height: prefix + "=" + flyout_outer_height
                          }, animation_length, function () {
                              $more_btn.find('>span').toggleClass('icon-du-plus icon-du-minus');
                              $this_card.toggleClass('card-list-item--open');
                          });

                          $('.js-filter-cards > .columns').each(function () {
                              if ($(this).position().top > this_card_position_top) {
                                  $(this).animate({
                                      top: prefix + "=" + flyout_outer_height
                                  }, animation_length, function () {
                                      if (prefix == '+') {
                                          $(this).attr('data-moved', flyout_outer_height);
                                      }
                                      else {
                                          $(this).removeAttr('data-moved');
                                      }
                                  });
                              }
                          });
                      }
                  }
              });

              var was_open_timeout = null;
              function hide_open_cards() {
                  clearTimeout(was_open_timeout);

                  if ($('.js-filter-cards').find('.card-list-item--open').length) {

                      $('.js-filter-cards').find('.card-list-item--open').each(function () {
                          $('.js-filter-cards').height($('.js-filter-cards').height() - $(this).find('.flyout').outerHeight() - correction);

                          $(this).addClass('card-list-item--was-open').removeClass('card-list-item--open');
                          $(this).find('.more-button>span').removeClass('icon-du-minus').addClass('icon-du-plus');
                          $(this).find('.flyout').hide();
                      });

                      $('.js-filter-cards').find('[data-moved]').each(function () {
                          $(this).animate({
                              top: "-=" + $(this).attr('data-moved')
                          }, 0, function () {
                              $(this).removeAttr('data-moved');
                          });
                      });
                  }
                  /*
                  was_open_timeout = setTimeout(function () {
                    $('.ap-item--was-open').each(function(){
                      $(this).removeClass('ap-item--was-open');
                      if ($(this).is(':visible')) {
                        $(this).find('.cards-program__content').trigger('click', true);
                      }
                    });
                  }, 700);*/
              }

              var windowWidth = $(window).width();// Store the window width.
              $(window).on('resize', function(){
                  // Check window width has actually changed and it's not just iOS triggering a resize event on scroll.
                  if ($(window).width() != windowWidth) {
                      // Update the window width for next time.
                      windowWidth = $(window).width();
                      // more-button window resize.
                      hide_open_cards();
                  }
              });
          }
      }
  };

  Drupal.behaviors.eventsListingFilters = {
    attach: function (context, settings) {
      $(once('eventsListingFilters', '#events-listing', context)).each(function() {
        var $eventsListingGrid = $('#events-listing').isotope({
            itemSelector: '.events-listing__item',
            layoutMode: 'fitRows'
        });
        // store filter for each group
        var eventsFilters = {};
        var audienceUrl = location.href;
        var urlParams = new URLSearchParams(audienceUrl);

        /* If Event List view does not return any results at all, this events-listing div does not exist
           Thus call to show the events no results message since there is no results returned from View
        */
        if( $('#events-listing').length == 0) {
            showHideEventsNoResultsMessage();
        } else {
            // if have results, shift no event message div higher to reduce white space
            $('#events-listing-no-events').css('margin-top', '-70px');
        }

        $(".event-filter-dropdown-holder .btn--event-filter").first().addClass('active');

        $('.event-filter-dropdown-holder .btn--event-filter').on('click', function(e) {
            e.preventDefault();
            var $this = $(this);

            $this.parent().children('.btn--event-filter').removeClass('active');
            $this.addClass('active');

            // Get group key.
            var $buttonGroup = $this.parents('.button-group');
            var filterGroup = $buttonGroup.attr('data-filter-group');

            // Set filter for group.
            eventsFilters[filterGroup] = $this.attr('data-filter');

            // Combine filters.
            var filterValue = concatValues(eventsFilters);
            $eventsListingGrid.isotope({ filter: filterValue });

            // Call function to show or hide events no results message.
            showHideEventsNoResultsMessage();
        });

        // Function to show or hide the events no results message
        function showHideEventsNoResultsMessage() {
            var $eventsListing = $('#events-listing');
            var $noResultsContainer = $('.events-listing__no-events');
            setTimeout(function(){
                if ($eventsListing.children(':visible').length) {
                    $noResultsContainer.fadeOut();
                } else {
                    $noResultsContainer.fadeIn();
                }
            }, 500);
        }

        // flatten object by concatting values
        function concatValues( obj ) {
          var value = '';
          for ( var prop in obj ) {
            value += obj[ prop ];
          }
          return value;
        }
      });
    }
  };

})(jQuery, Drupal, once);
