;(function ($) {

;(function(Drupal) {
  'use strict';

  var $videoClone = false;
  var videoCloneHTML = false;
  var heroVideoInitialized = false;

  Drupal.behaviors.featuredOrbitSlidershow = {
    attach: function(context, settings) {
      $('.featured-article-slider').slick({
        slidesToScroll: 1,
        dots: true,
        speed: 1000
      });
    }
  };

  Drupal.behaviors.activity_card = {
    attach: function (context, settings) {
      if ($('.activity-card-list-filter').length && !$('.activity-card-list-filter').hasClass('activity-card-list-processed')) {
        $('.activity-card-list-filter').addClass('activity-card-list-processed');

        // Search Button:
        $('.search-box button').on('click', function (e) {
          e.preventDefault();
          $('.activity-card-list-filter-submit input').click();
          return  false;
        });
      }
    } // End attach function.
  };

  Drupal.behaviors.card_list_module = {
      attach: function (context, settings) {
          if (!$('.cards-list-module').hasClass('js-card-list-processed')) {
              $('.cards-list-module').once('card_list_module').addClass('js-card-list-processed');

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

  $(document)
    .foundation()
    .ready(function() {
      $('html').addClass('js');

      initListingFilters();
      $(document).ajaxComplete(initListingFilters);
      initUnitMainNav();
      initUnitUtilityNav();
      initUnitCarousel();

      //SHOW/HIDE TOGGLE
      $('#main-content .show-hide-toggle').each(function(e) {
        var $t = $(this);
        $t.nextAll().wrapAll('<div class="show-hide__contents"></div>');
        $t.insertAfter($t.next('.show-hide__contents'));
      });
      $('#main-content .show-hide-toggle > a').on('click', function(e) {
        e.preventDefault();
        var $t = $(this);
        var $toggle = $t.parent();
        var $contents = $toggle.prev('.show-hide__contents');
        $toggle.toggleClass('show-hide--expanded');
        $contents.slideToggle(500, function() {
          reCalcSticky();
        });
      });
      // END OF SHOW/HIDE TOGGLE

        /*//HOME - Banner Fade
        if ($('body').hasClass('du-home')) {
            $(window).scroll(function () {
                var scrollTop = $(window).scrollTop();
                var $header = $('header');
                var offset = $header.offset().top + ($header.height() / 10);
                if (offset <= scrollTop) {
                    $header.addClass('header--fade-out-gold');
                } else {
                   $header.removeClass('header--fade-out-gold');
                }
            }); }*/
        // END - Banner Fade

      //HOME - SWAPPING IMAGE FEATURE
      if ($('.swapping-img-feature').length && Foundation.MediaQuery.atLeast('large')) {
            var $images = $('.swapping-img-feature img');
            var thirdWindowHeight,
                thirtyPercent,
                sixtyPercent;
            /*$images.each(function() {
                $(this).attr('data-img-0',$(this).attr('src'));
            });*/
            $(window).resize(function() {
                $images.each(function() {
                    var $img = $(this);
                    $img.data('offset', $img.offset().top + ($img.height() / 2));
                });
                thirdWindowHeight = $(window).height() / 3;
                thirtyPercent = thirdWindowHeight;
                sixtyPercent = thirdWindowHeight * 2;
            });
            $(window).one('load', function(){
                $(window).triggerHandler('resize');
            });

            $(window).scroll(function () {
                var scrollTop = $(window).scrollTop();
                $images.each(function() {
                    var $img = $(this);
                    var src0 = $img.attr('data-img-0');
                    var src1 = $img.attr('data-img-1');
                    var src2 = $img.attr('data-img-2');
                    var offset = $img.data('offset');
                    //console.log('data-offset REAL = ' + $img.offset().top + ($img.height() / 2));
                    //var offset = $img.offset().top + ($img.height() / 2);
                    if (offset >= scrollTop + sixtyPercent){
                        //console.log($img.attr('src') + ' is at 60% or below');
                        if ($img.attr('src') == src0) return;
                        $img.attr('src', src0);
                    } else if (offset < scrollTop + thirtyPercent){
                        //console.log($img.attr('src') + ' is at 30% or higher');
                        if ($img.attr('src') == src2) return;
                        $img.attr('src', src2);
                    } else {
                        //console.log($img.attr('src') + ' is in between');
                        if ($img.attr('src') == src1) return;
                        $img.attr("src", src1);
                    }
                });
            });
      }
      // END of SWAPPING IMAGE FEATURE

      //HOME - Program Search
      $("form.du-home__academic-programs .program-search-filters button").click(function() {
        $(this).closest("form").attr("action", $(this).attr("data-action"));
      });
      //END of HOME - Program Search

      //Admission concentration, year selection
        function select_program(parameter, value) {
                var url = "";
                if (location.search.length == 0) {
                    url = "?"
                } else {
                    url = "&"
                }
                url += parameter + "=" + value;
                //console.log(url);
                location.assign(location.origin + location.pathname + location.search + url + location.hash)
            };
        $('.selectYear').on('click', function(){
            var $year = $(this).attr('name');
      var oldUrl = location.search;
      //console.log(oldUrl);
      if(oldUrl.indexOf("year=")!=-1){
        var yearend = oldUrl.indexOf("year")+14;
        console.log(yearend);
                var $oldYear = oldUrl.substring(oldUrl.indexOf("year"),yearend);
                var $newYear = "year="+$year;
                var $newUrl = oldUrl.replace($oldYear,$newYear);
                location.assign(location.origin + location.pathname + $newUrl);
            } else {
            select_program("year", $year);}
        });

        var $concModal = $('#concModal');

        if ($concModal.length) {
          $concModal.foundation('open');
          //console.log("should be opening");
        }

        $('.reveal-overlay').on('click', '.select-concentration', function(){
            var $name = $(this).attr('name');
            //console.log($name);
            select_program("concentration", $name);
            $('#concModal').foundation('close');
        });

      // OPEN CLASS TOGGLE
      $('#sub-menu-toggler > a, #academic-filter-toggler > a, #main-menu-toggler > button, #du-alert .du-alert__action-button, .category-list__toggler > a, .sub-step-content__toggle > a').on('click', function(e) {
        e.preventDefault();
        $(this).toggleClass('open');
      });


      function initListingFilters() {
        $('.filter-button-wrapper').not('.initialized').each(function() {
            $(this)
                .addClass('initialized')
                .click(function() {
                var filterId = $(this).attr('data-filter-id');
                var $filter = $('#' + filterId);
                var $button = $(this).find('.filter-button');

                $button.toggleClass('open');
                $filter.toggleClass('open');

                if ( $filter.hasClass('open') ) {
                    $filter.attr('aria-expanded', 'true');
                } else {
                    $filter.attr('aria-expanded', 'false');
                }
            });
        }) ;
      }

        function initUnitMainNav() {
          var $header = ($('.unit-header').length) ? $('.unit-header') : $('.header');
          var $main_menu = ($('#main-menu .main-menu-contents').length) ? $('.unit-header .main-menu-contents') : $('.header #main-menu');
          var observer = new MutationObserver(recalculate_dropdown_positions);
        $main_menu.find('.mega-flyout.mega-menu--dropdown').each(function () {
            observer.observe(this, { attributes: true, attributeFilter: ['class'] });
        });

        $(window).resize(recalculate_dropdown_positions);

          function recalculate_dropdown_positions() {
              // Force simple dropdown menus not to overflow past the rightmost main navigation item.
              $main_menu.find('.mega-flyout.mega-menu--dropdown').each(function () {
                  var $dropdown = $(this);
                  var header_width = $header.innerWidth();
                  //console.log($main_menu.css('padding-right'));
                  var main_menu_pos = $main_menu.offset();
                  var main_menu_rightmost_edge = main_menu_pos.left + $main_menu.innerWidth() - parseInt($main_menu.css('padding-right'), 10);
                  var dropdown_pos = $dropdown.offset();
                  var dropdown_rightmost_edge = dropdown_pos.left + $dropdown.innerWidth();

                  if (dropdown_rightmost_edge > main_menu_rightmost_edge) {
                      // jQuery can't set css with !important...
                      this.style.setProperty('right', (header_width - main_menu_rightmost_edge) + 'px', 'important');
                  } else {
                      this.style.setProperty('right', 'auto', 'important');
                  }
              });
          }
        }
        function initUnitUtilityNav() {
            var $modal_links = $();
            var modals = "";
            var modalItems = [];
            $(".unit-utility-menu a").each(function () {
                var href = $(this).attr('href');
                if ( href.charAt(0) === '#' && href.length > 1 ) {
                    modalItems.push(href);
                    $modal_links = $modal_links.add($(this));
                }
                $(this).attr('role', 'button');
                $(this).attr('aria-controls', href);
            });
            modals = modalItems.join(", ");

            $modal_links.on('click', function(e) {
                e.preventDefault();
                var href = $(this).attr('href');
                var already_open = $(this).hasClass('open');
                unit_submenu_close_all();
                if ( ! already_open ) {
                    openMenu(href);
                    $(this).addClass('open');
                }
            });
            $('#unit-main-menu-toggler button').on('click', function (e) {
                if ( main_menu_is_open() || submenu_is_open() ) {
                    unit_submenu_close_all();
                    $(this).removeClass('open');
                } else {
                    openMenu('#main-menu');
                    $(this).addClass('open');
                }
            });
            $(modals)
                .find('.back-to-main')
                .on('click', function() {
                    unit_submenu_close_all();
                    openMenu('#main-menu');
                });

            $(modals)
                .find('.close-panel')
                .on('click',
                    unit_submenu_close_all
                );
            /*
             Closes all navigation panels and de-activate all buttons.
             */
            function unit_submenu_close_all() {
                closeMenu('#main-menu');
                closeMenu(modals);

                $modal_links.removeClass('open');
            }
            /*
             Open the panel designated by the given selector
             */
            function openMenu(selector) {
                $(selector)
                    .addClass('expanded')
                    .attr('aria-expanded', 'true');
            }
            /*
             Close the panel designated by the given selector
             */
            function closeMenu(selector) {
                $(selector)
                    .removeClass('expanded')
                    .attr('aria-expanded', 'false');
            }
            /*
             Tests whether any submenu is open (e.g. audience menu, search menu)
             */
            function submenu_is_open() {
                return $(modals).hasClass('expanded');
            }
            /*
             Tests whether main menu is open
             */
            function main_menu_is_open() {
                if ($('#main-menu').hasClass('expanded')) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        function initUnitCarousel() {
            var $carousels = $('.unit-site-carousel__multi');

            $carousels.each(function() {
                var $slides = $(this).find('.unit-site-carousel__slides');
                var $prev = $(this).find('.unit-site-carousel__nav .prev-button');
                var $next = $(this).find('.unit-site-carousel__nav .next-button');

                $(this).append('<div class="unit-site-carousel__overlay left"></div>');
                $(this).append('<div class="unit-site-carousel__overlay right"></div>');

                $slides.slick({
                    slidesToScroll:1,
                    slidesToShow:1,
                    centerMode: true,
                    centerPadding:'100px',
                    prevArrow: $prev,
                    nextArrow: $next,
                    speed: 400
                });
            });
            /**
             * Recalculates the padding around the 'active' slide, so we can update the slick configuration with it.
             * Also, updates vertical positioning of next/prev buttons. */

            function calcPadding() {
                $carousels.each(function() {
                    var $slides = $(this).find('.unit-site-carousel__slides');
                    var $overlays = $(this).find('.unit-site-carousel__overlay');
                    var $nextprev = $(this).find('.unit-site-carousel__nav');
                    var padding = 0;
                    var carouselWidth = $(this).width();
                    var maxWidth = 1000 - 16; // 10 column width minus outer gutters

                    if (Foundation.MediaQuery.atLeast('medium')) {
                        padding = Math.max(100, (carouselWidth - maxWidth) / 2);
                    } else {
                        padding = 0;
                    }

                    $slides.slick('slickSetOption', 'centerPadding', padding + "px", true);
                    $overlays.width(padding);

                    // On small viewports, the caption goes below the image and expands the height of the whole carousel.
                    // Account for this by bumping it up:
                    if (Foundation.MediaQuery.atLeast('medium')) {
                        $nextprev.css('margin-top', '0');
                    } else {
                        var captionHeight = $slides.height() - $slides.find('.unit-carousel-slide img').height();
                        $nextprev.css('margin-top', -captionHeight/2 + "px");
                    }
                });
            }
            $(window).resize(calcPadding);
            calcPadding();
        }

      // MOBILE CARDS MODULE FUNCTIONALITY
      $('.cards-module .cards-module__content > h4').on('click', function() {
        if (Foundation.MediaQuery.atLeast('large')) return;
        $(this).closest('.cards-module__content').toggleClass('expanded');
        reCalcSticky();
      });

      // MOBILE CONTACTS MODULE FUNCTIONALITY
      $('.contacts-module .contacts-module__content > h4').on('click', function() {
        if (Foundation.MediaQuery.atLeast('medium')) return;
        $(this).closest('.contacts-module__content').toggleClass('expanded');
        reCalcSticky();
      });

      // CAPTIONED IMAGE
      $('.img-wrapper > .img-wrapper__content').each(function() {
        var $t = $(this);
        if ($t.height() > 28 ) {
          $t.addClass('truncated');
        }
      });
      $('.img-wrapper').on('click', '.img-wrapper__content.truncated', function() {
        $(this).toggleClass('expanded');
      });
      // END OF CAPTIONED IMAGE

      // LARGE IMAGE SLIDESHOW
      function slideNumber() {
        var $slides = $('.large-image-module__wrapper .orbit-slide');
        var $activeSlide = $slides.filter('.is-active');
        var activeNum = $slides.index($activeSlide) + 1;
        var numItems = $('.large-image-module__wrapper .orbit-slide').length
        $('.large-image-module__wrapper .slide-number').html(activeNum + ' of ' + numItems);
      }
      slideNumber();
      $('[data-orbit]').on('slidechange.zf.orbit', slideNumber);

      $('.large-image-module__wrapper > .orbit-container').each(function() {
        var $t = $(this);
        if ($t.children().length == 1) {
          $t.closest('.large-image-module').addClass('large-image-module--single-slide');
        }
      });
      // END OF LARGE IMAGE SLIDESHOW

      //DROPDOWN VIDEO
      $('.dropdown-video-module__container > .dropdown-video-module .dropdown-video-module__toggle').on('click', function(e) {
        e.preventDefault();
        var $t = $(this);
        var $container = $t.closest('.dropdown-video-module__container');
        var $lgVideoModule = $container.children('.dropdown-video-module');
        $lgVideoModule.toggleClass('dropdown-video-module--active');
        $("#dropdownVideo").toggle();
        $lgVideoModule.find('img').toggle();
      });

      // FEATURE VIDEO
    //for HTML5 video
      $('.feature-video-module a.video-toggle').on('click', function(e) {
        e.preventDefault();
        var $t = $(this);
        var $video = $t.next('video').get(0);
        if ($t.hasClass('playing')) {
          $video.pause();
        } else {
          $video.play();
        }
        $t.toggleClass('playing');
      });
    //for YouTube embed   turned off 2019-10-15-  causing strange behaviour on mobile
      //function playVideo($t){
       // $t.find('.blockquote__background').addClass('hideBackground');
       // $t.find('blockquote').css('display','none');
       // $t.find('.small-12.medium-12.large-8').removeClass('large-8');
      //  $t.find('.small-12.medium-12.large-8').addClass('large-12');
     // };

      $('.feature-video-module').on('click', function(ev) {
          var $t = $(this);
          if (!$t.hasClass('no-popup')) {
              if ($('iframe').length) {
                  playVideo($t);
                  $("iframe")[0].src += "&autoplay=1";
                  ev.preventDefault();
              }
          }
      });
        // ALERTS
        // --informational--
        $('#du-alert.du-alert--notification').toggleClass('du-alert--notification--show', !$.cookie('alert-notification-closed'));
        $('#du-alert.du-alert--notification .du-alert__action-button').on('click', function() {
            $('#du-alert.du-alert--notification').removeClass('du-alert--notification--show');
            $.cookie('alert-notification-closed', true);
            $('.du-alert--active').removeClass('du-alert--active');
        });
        // --urgent--
        $('#du-alert.du-alert--urgent').toggleClass('du-alert--notification--show', !$.cookie('alert-notification-closed'));
        $('#urgent-alert-toggle').click(function() {
            $(this).children().toggleClass('icon-du-up-arrow');
            $(this).children().toggleClass('icon-du-down-arrow');
        });

        //Listen for when the alert closes to add class to -->header element -due to nesting targeting was not possible with css
        var alertClose = document.querySelector('#du-alert');
        if (alertClose) {
          var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.type == "attributes") {
                var element = document.getElementsByTagName('header')[0];
                element.classList.add('alert-closed');
              }
            });
          });
          observer.observe(alertClose, {
            attributes: true //configure it to listen to attribute changes
          });
        }

      //Information Overview
      $('.information-overview-module .list-of-facts').each(function() {
          var listItems = $(this).children('li');
          var numberOfFacts = listItems.length;
          if (numberOfFacts == 2) {
            listItems.css("height", "50%");
          } else if (numberOfFacts == 3){
            listItems.css("height", "33%");
          } else {
            listItems.css("height", "25%");
          };
      });
      /*$('.fact').each(function(){
          var contentHeight = $('.quick-fact-module__content').height();
          //console.log(contentHeight);
          var headHeight = $('.quick-fact-module__head').height();
          //console.log(headHeight);
          var captionHeight = (contentHeight - headHeight);
          //console.log(captionHeight);
          $('.caption').css("height", captionHeight);
          //console.log($('.caption').height());
      });
      var orbitList = $(".orbit.information-overview .orbit-slide ul.list-of-facts");
      var orbitHeight = $(".orbit.information-overview .orbit-container").height();
      $(orbitList).css("height", orbitHeight);*/
      //End Information Overview

      //SCHOOL LIST HOVER
        $('.accordion-title').hover(
          function() {
            $(this).toggleClass('gold');
          });

    //EVENTS LISTING
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

      // SEARCH BOXES
      //Get URL parameters
      var getUrlParameter = function getUrlParameter(sParam) {
          var sPageURL = decodeURIComponent(window.location);
          var x = sPageURL.indexOf('?');
          var sPageURL = sPageURL.substring(x+1);
          var sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;
        for (i = 0; i < sURLVariables.length; i++) {
          sParameterName = sURLVariables[i].split('=');

          if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
          }
        }
      };
      //Search Param

      var genSrchTrm = getUrlParameter('search');
      //console.log("genSrchTrm", genSrchTrm);

      //Detect for param values and input field
      if(genSrchTrm !== undefined && $('form.search-box').length > 0){
        $('form.search-box #search-input').val(genSrchTrm);
        if('.search-anchor'){
            // animate down to form search box
            var targetOffset = $('form.search-box').offset().top;
            var floatingMenuSizeOffset = 100;
            $('html, body').animate({scrollTop: targetOffset - floatingMenuSizeOffset}, 1000);
        }
      }
      //Search clear
      $('button.search-clear').on('click', function(e) {
        $('#search-input').val('');

        // For events search, only clear out the search param.
        if ($(this).parent('.search-box--events').length > 0) {
          var href = new URL(window.location.href);
          href.searchParams.set('search', '');
          window.location.href = href;
        }
        else {
          $(this).closest('form').submit();
        }
      });
      $('ul#search button.search-submit').on('click', function(e){
         var keywords = $('#site-search-input').val();
         startSearch(keywords);
      });
      $('.no-result-search-form-wrapper button.search-submit-btn').on('click', function(e){
         var keywords = $('#no-result-site-search-input').val();
         startSearch(keywords);
      });
      $('.no-result-search-form-wrapper button.search-submit').on('click', function(e){
         var keywords = $('#no-result-site-search-input').val();
         startSearch(keywords);
      });
      $('.unit-search-form-wrapper button.search-submit').on('click', function(e){
        var keywords = $('#site-search-input').val();
        startSearch(keywords);
      });
      //END SEARCH BOXES
    // REVEAL MODALS / OFF-CANVAS
    $('a[data-toggle^="modal_"]').on('click',function(e) {
        //console.log('click');
       e.preventDefault();
    });
    // REVEAL MODALS / OFF-CANVAS
  })//END READY

  .on('show.zf.dropdownmenu', function(ev, $el) {
    //console.log("dropdown menu show "+ev.target.id+" / "+$el.attr('id'));
        //give focus to search field on core
      if(ev.target.id === 'search-toggler' && $el.attr('id') === 'search'){
          setTimeout(function() { $('#site-search-input').focus() }, 300);
      }
  });// $(document)
        // give focus to search field on unit
        $('.unit-utility-menu__search-button').click(function (event) {
            // Don't follow the link
            event.preventDefault();
            setTimeout(function() { $('#site-search-input').focus() }, 300);
        });

  $('#academic-filters a[data-toggle="index-info-box"]').on('click', function(e) {
    e.preventDefault();
    $(this).toggleClass('active');
  });

  $(window).on('load changed.zf.mediaquery', function() {
    if ($('#sub-menu:hidden')) {
      $('#sub-menu-toggler > a').removeClass('open');
    }
    if ($('#academic-filters:hidden')) {
      $('#academic-filter-toggler > a').removeClass('open');
    }
    if ($('#main-menu:hidden')) {
      $('#main-menu-toggler > button').removeClass('open');
    }
    if ($('.sub-step-content__toggle > a.open').length) {
      $('.sub-step-content__toggle > a.open').removeClass('open');
    }
    if (Foundation.MediaQuery.atLeast('large')) {
        //console.log('at least large');
        if (!heroVideoInitialized){
            //console.log('hero video initialized');
            heroVideoInitialized = true;
            if (videoCloneHTML) {
                $videoClone = $(videoCloneHTML).removeClass('hero-video--visible');
                $('header .hero-media').prepend($videoClone);
            }
            $('#hero-video').on('canplay', function() {
                //console.log("Can start playing video after resize or on first load");
                setTimeout(function(){
                    //console.log('setting timeout');
                    $('#hero-video').addClass('hero-video--visible');
                    $('#hero-video')[0].play();
                }, 500);
            });
        }
        // HOME - Hero Video
        if ($('body').hasClass('du-home')) {
            $('.wide-carousel').each(function() {
                var $t = $(this);
                if ($t.find('video').length){
                    var $video = $t.find('.is-active video')[0];
                    $video.play();
                }
            });
            $('.wide-carousel [data-orbit]').on('beforeslidechange.zf.orbit', function() {
                var $video = $(this).find('.is-active video').get(0);
                $video.pause();
                $video.currentTime = 0;
            });
            $('.wide-carousel [data-orbit]').on('slidechange.zf.orbit', function() {
                var $video = $(this).find('.is-active video')[0];
                $video.play();
            });
        }// END of Hero Video

        $('#main-menu ul li a').off('.touch');

        } else {
        $('#main-menu ul li.mega-menu a').on('touchstart.touch', function(e){
            e.preventDefault();
            var $t = $(this);
            var href = $t.attr('href');
            location.href = href;
        });

        if ($('#hero-video').length) {
            videoCloneHTML = $('#hero-video').get(0).outerHTML;
        }
        $('#hero-video').remove();
        heroVideoInitialized = false;

        if ($('body').hasClass('du-home')) {
            $('.wide-carousel').each(function() {
                var $t = $(this);
                if ($t.find('video').length){
                    var $video = $t.find('.is-active video');
                    $video[0].pause();
                }
            });
        }
    }
    if (Foundation.MediaQuery.current == 'small') {
      if ($('.large-image-module').hasClass('large-image-module--active')) {
        $('.large-image-module.large-image-module--active').removeClass('large-image-module--active');
      }

      $('[data-orbit-small]').each(function() {
        $(this).data('original', $(this).clone());
        new Foundation.Orbit($(this), {
          autoPlay: false
        });
      });

      $('.category-list__toggler > a.open').each(function() {
        $(this).removeClass('open');
      });

      $('.admission-steps .row > .tabs-title.is-active').each(function() {
        $(this)
          .removeClass('is-active')
          .children('a').attr('aria-selected', false);
      });
      $('.admission-steps > .tabs-content > .tabs-panel.is-active').each(function() {
        $(this)
          .removeClass('is-active')
          .attr('aria-hidden', true)
          .attr('aria-expanded', false);
      });
      $('.admission-steps .row > .tabs-title').on('click.mobileAdmissionSteps', 'a', function() {
        var $t = $(this);
        var $contents = $t.html();
        var $closestTabs = $t.closest('.admission-steps__nav');
        $closestTabs.addClass('admission-steps--slide-off');
        // Remove before adding, just in case.
        $('.admission-steps__back').add($('.admission-steps__section-title')).remove();
        $('<p class="admission-steps__back"><a href="#"><span class="icon-du-left-arrow" aria-hidden="true"></span> Back to Steps</a></p><p class="admission-steps__section-title">' + $contents + '</p>').insertBefore($closestTabs);
        //$t.closest('.admission-steps').children('.tabs-content').addClass('tabs-content--visible');
      });
      $('.admission-steps').on('click', '.admission-steps__back', function(e) {
        e.preventDefault();
        var $t = $(this);
        var $admissionSteps = $t.closest('.admission-steps');
        $t.siblings('.admission-steps__nav').removeClass('admission-steps--slide-off');
        //$t.siblings('.tabs-content').removeClass('tabs-content--visible');
        $('.admission-steps .row > .tabs-title.is-active').each(function() {
          $(this)
            .removeClass('is-active')
            .children('a').attr('aria-selected', false);
        });
        $('.admission-steps .tabs-content .tabs-panel.is-active').each(function() {
          $(this)
            .removeClass('is-active')
            .attr('aria-hidden', true)
            .attr('aria-expanded', false);
        });
        $('.sub-step-content__toggle > a.open').each(function() {
          $(this).removeClass('open');
        });
        $t.add($('.admission-steps__section-title')).remove();
      });
      $('.admission-steps .sub-step-content__toggle > a').on('click', function() {
        setTimeout(function(){
          reCalcSticky();
        }, 200);
      });

    } else {

      if ($('body').hasClass('is-reveal-open')) {
        $('#large-image-module__modal').foundation('close');
      }
      if ($('#large-image-module__modal > .large-image-module').length) {
        $('#large-image-module__modal').empty();
      }

      $('[data-orbit-small][data-orbit]').each(function() {
        var $t = $(this);
        var $original = $t.data('original');
        var id = '#' + $t.attr('id');
        $(id).foundation('destroy');
        $t.replaceWith($original);
      });

      $('.admission-steps .row > .tabs-title:first-child').each(function() {
        $(this)
          .addClass('is-active')
          .children('a')
          //.focus()
          .attr('aria-selected', true);
      });
      $('.admission-steps > .tabs-content > .tabs-panel:first-child').each(function() {
        $(this)
          .addClass('is-active')
          .attr('aria-hidden', false)
          .attr('aria-expanded', true);
      });
      $('.admission-steps__nav').each(function() {
        var $t = $(this);
        $t.removeClass('admission-steps--slide-off');
        $t.siblings('.admission-steps__back, .admission-steps__section-title').remove();
      });
      $('.admission-steps .row > .tabs-title').off('click.mobileAdmissionSteps');
    }
    if (Foundation.MediaQuery.current == 'medium' || Foundation.MediaQuery.current == 'small') {
      $('.admission-steps .sub-step-content.is-active').each(function() {
        $(this)
          .removeClass('is-active')
          .attr('aria-hidden', true)
          .attr('aria-expanded', false);
      });
      if ($('.admission-steps > .tabs-content > .tabs-panel.is-active').length > 1 && Foundation.MediaQuery.current != 'small') {
        $('.admission-steps > .tabs-content > .tabs-panel.is-active').each(function() {
          var $t = $(this);
          if (!$t.is(':first-child')) {
            $t
              .removeClass('is-active')
              .attr('aria-hidden', true)
              .attr('aria-expanded', false);
          }
        });
      }
      if ($('.admission-steps .row > .tabs-title.is-active').length > 1) {
        $('.admission-steps .row > .tabs-title.is-active').each(function() {
          var $t = $(this);
          if (!$t.is(':first-child')) {
            $t
              .removeClass('is-active')
              .children('a').attr('aria-selected', false);
          }
        });
      }
    } else {
      $('.admission-steps .tabs-content > .sub-step-content__toggle:first-child + .sub-step-content').each(function() {
        $(this)
          .addClass('is-active')
          .attr('aria-hidden', false)
          .attr('aria-expanded', true);
      });
      $('.admission-steps > .tabs-content > .tabs-panel.is-active').each(function() {
        var $t = $(this);
        if (!$t.is(':first-child')) {
          $t
            .removeClass('is-active')
            .attr('aria-hidden', true)
            .attr('aria-expanded', false);
        }
      });
      $('.admission-steps .tabs.vertical').each(function() {
        var $t = $(this);
        var $tabsPanel = $t.closest('.tabs-panel');
        var hiddenNav = false;
        if ($t.is(':hidden')) {
          hiddenNav = true;
          $tabsPanel.css('opacity', 0).attr('aria-hidden', false);
        }
        var vertTabsHeight = $(this).height() + 16;
        $t.closest('.row').find('.sub-step-content').css('min-height', vertTabsHeight);
        if (hiddenNav) {
          $tabsPanel.attr('aria-hidden', true).css('opacity', 1);
        }
      });
    }
  }).trigger('changed.zf.mediaquery');

  $(window).resize(function() {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function(){

      $('.img-wrapper > .img-wrapper__content').each(function() {
        var $t = $(this);
        $t.css('opacity', 0);
        $t.removeClass('truncated');
        if ($t.height() > 28 ) {
          $t.addClass('truncated');
        }
        $t.css('opacity', 1);
      });
    }, 250);
  });

  var slider = $('.related-stories-module .slider-container');

  $(function() {
      $(slider).slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          mobileFirst: true,
          arrows: false,
          dots: true,
          responsive: [
              {
                  breakpoint: 769,
                  settings: 'unslick'
              }
          ]
      });

      $(window).on('resize', function() {
          $(slider).slick('resize');
      });
  });

  // START JS FEATURED COURSES
  $('.js-featured-courses .fc-item').each(function(index) {
    $(this).click(function() {
      adjustCourseFlyout($(this).parent('.js-featured-courses'), $(this));
    });
  });

  // Debounce when adjusting the window size. We want to adjust the flyout
  // display when the window changes size, but put a delay on performing the
  // action so it doesn't fire too often.
  var resizeDebounce = debounce(function() {
    $('.js-featured-courses').each(function() {
      adjustCourseFlyout($(this), null);
    });
  }, 250);
  $(window).resize(resizeDebounce);
  // END JS FEATURED COURSES


})(Drupal);

// Adjust course flyout positioning and display.
// $js_featured_courses is the outer wrapper for the row of courses
// $clicked_course is the course that was just clicked on (if applicable).
function adjustCourseFlyout($js_featured_courses, $clicked_course) {
  var $items = $js_featured_courses.find('.fc-item');
  var margin_top = 0;
  var bottom = -40;
  // If a course was clicked, toggle the classes on course elements. Else, find
  // the currently selected course.
  if ($clicked_course) {
    $clicked_course.toggleClass('fc-item--open').siblings().removeClass('fc-item--open');
  }
  else {
    $clicked_course = $js_featured_courses.find('.fc-item--open');
  }
  var offset_left = parseInt($clicked_course.position().left);
  var items_in_row = Math.round($js_featured_courses.width() / $clicked_course.outerWidth());
  var $flyout = $js_featured_courses.find('.fc-item--open .featured-course-flyout');

  // If there are more than one item in a row, then we need to adjust the
  // positioning of the flyout to be relative to whichever course card is the
  // tallest.
  if (items_in_row > 1) {
    var heights = $items.map(function() {
      return $(this).find('.course-info-card__holder').height();
    }).get();
    var maxHeight = Math.max.apply(null, heights);
    if (maxHeight > $clicked_course.find('.course-info-card__holder').height()) {
      margin_top = maxHeight - $clicked_course.find('.course-info-card__holder').height();
      bottom -= margin_top;
    }
  }
  $flyout.css('margin-top', margin_top + 'px');

  // Slide up or down the flyouts.
  $items.each(function() {
    if($(this).hasClass('fc-item--open')) {
      $(this).find('.featured-course-flyout').slideDown(200);
    }
    else {
      $(this).find('.featured-course-flyout').slideUp(200);
    }
  });
  $flyout.outerWidth($clicked_course.outerWidth() * items_in_row - 2 * parseInt($clicked_course.css('padding-left')) - 3).css('left', '-' + offset_left + 'px').css('height', $flyout.outerHeight());

  // Adjust the positioning of the little caret that displays above the flyout.
  $('<style>.course-info-card__holder:after{bottom:' + bottom + 'px}</style>').appendTo('head');
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function reCalcSticky() {
  if ($('#top-bar-sticky-wrap').length) {
    $('#top-bar-sticky-wrap').foundation('_calc', true);
  }
}
/*! Lazy Load XT v1.1.0 2016-01-12
 * http://ressio.github.io/lazy-load-xt
 * (C) 2016 RESS.io
 * Licensed under MIT */
(function ($, window, document, undefined) {
    // options
    var lazyLoadXT = 'lazyLoadXT',
        dataLazied = 'lazied',
        load_error = 'load error',
        classLazyHidden = 'lazy-hidden',
        docElement = document.documentElement || document.body,
    //  force load all images in Opera Mini and some mobile browsers without scroll event or getBoundingClientRect()
        forceLoad = (window.onscroll === undefined || !!window.operamini || !docElement.getBoundingClientRect),
        options = {
            autoInit: true, // auto initialize in $.ready
            selector: 'img[data-src]', // selector for lazyloading elements
            blankImage: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            throttle: 99, // interval (ms) for changes check
            forceLoad: forceLoad, // force auto load all images
            loadEvent: 'pageshow', // check AJAX-loaded content in jQueryMobile
            updateEvent: 'load orientationchange resize scroll touchmove focus', // page-modified events
            forceEvent: 'lazyloadall', // force loading of all elements
            //onstart: null,
            oninit: {removeClass: 'lazy'}, // init handler
            onshow: {addClass: classLazyHidden}, // start loading handler
            onload: {removeClass: classLazyHidden, addClass: 'lazy-loaded'}, // load success handler
            onerror: {removeClass: classLazyHidden}, // error handler
            //oncomplete: null, // complete handler
            //scrollContainer: undefined,
            checkDuplicates: true
        },
        elementOptions = {
            srcAttr: 'data-src',
            edgeX: 0,
            edgeY: 0,
            visibleOnly: true
        },
        $window = $(window),
        $isFunction = $.isFunction,
        $extend = $.extend,
        $data = $.data || function (el, name) {
            return $(el).data(name);
        },
        elements = [],
        topLazy = 0,
    /*
     waitingMode=0 : no setTimeout
     waitingMode=1 : setTimeout, no deferred events
     waitingMode=2 : setTimeout, deferred events*/
        waitingMode = 0;

    $[lazyLoadXT] = $extend(options, elementOptions, $[lazyLoadXT]);
    /**
     * Return options.prop if obj.prop is undefined, otherwise return obj.prop
     * @param {*} obj
     * @param {*} prop
     * @returns * */

    function getOrDef(obj, prop) {
        return obj[prop] === undefined ? options[prop] : obj[prop];
    }
    /**
     * @returns {number} */

    function scrollTop() {
        var scroll = window.pageYOffset;
        return (scroll === undefined) ? docElement.scrollTop : scroll;
    }
    /**
     * Add new elements to lazy-load list:
     * $(elements).lazyLoadXT() or $(window).lazyLoadXT()
     *
     * @param {object} [overrides] override global options */

    $.fn[lazyLoadXT] = function (overrides) {
        overrides = overrides || {};

        var blankImage = getOrDef(overrides, 'blankImage'),
            checkDuplicates = getOrDef(overrides, 'checkDuplicates'),
            scrollContainer = getOrDef(overrides, 'scrollContainer'),
            forceShow = getOrDef(overrides, 'show'),
            elementOptionsOverrides = {},
            prop;

        // empty overrides.scrollContainer is supported by both jQuery and Zepto
        $(scrollContainer).on('scroll', queueCheckLazyElements);

        for (prop in elementOptions) {
            elementOptionsOverrides[prop] = getOrDef(overrides, prop);
        }

        return this.each(function (index, el) {
            if (el === window) {
                $(options.selector).lazyLoadXT(overrides);
            } else {
                var duplicate = checkDuplicates && $data(el, dataLazied),
                    $el = $(el).data(dataLazied, forceShow ? -1 : 1);
                // prevent duplicates
                if (duplicate) {
                    queueCheckLazyElements();
                    return;
                }
                if (blankImage && el.tagName === 'IMG' && !el.src) {
                    el.src = blankImage;
                }
                // clone elementOptionsOverrides object
                $el[lazyLoadXT] = $extend({}, elementOptionsOverrides);

                triggerEvent('init', $el);

                elements.push($el);
                queueCheckLazyElements();
            }
        });
    };
    /**
     * Process function/object event handler
     * @param {string} event suffix
     * @param {jQuery} $el */

    function triggerEvent(event, $el) {
        var handler = options['on' + event];
        if (handler) {
            if ($isFunction(handler)) {
                handler.call($el[0]);
            } else {
                if (handler.addClass) {
                    $el.addClass(handler.addClass);
                }
                if (handler.removeClass) {
                    $el.removeClass(handler.removeClass);
                }
            }
        }
        $el.trigger('lazy' + event, [$el]);
        // queue next check as images may be resized after loading of actual file
        queueCheckLazyElements();
    }
    /**
     * Trigger onload/onerror handler
     * @param {Event} e */

    function triggerLoadOrError(e) {
        triggerEvent(e.type, $(this).off(load_error, triggerLoadOrError));
    }
    /**
     * Load visible elements
     * @param {bool} [force] loading of all elements */

    function checkLazyElements(force) {
        if (!elements.length) {
            return;
        }

        force = force || options.forceLoad;
        topLazy = Infinity;

        var viewportTop = scrollTop(),
            viewportHeight = window.innerHeight || docElement.clientHeight,
            viewportWidth = window.innerWidth || docElement.clientWidth,
            i,
            length;

        for (i = 0, length = elements.length; i < length; i++) {
            var $el = elements[i],
                el = $el[0],
                objData = $el[lazyLoadXT],
                removeNode = false,
                visible = force || $data(el, dataLazied) < 0,
                topEdge;

            if (!$.contains(docElement, el)) { // remove items that are not in DOM
                removeNode = true;
            } else if (force || !objData.visibleOnly || el.offsetWidth || el.offsetHeight) {

                if (!visible) {
                    var elPos = el.getBoundingClientRect(),
                        edgeX = objData.edgeX,
                        edgeY = objData.edgeY;

                    topEdge = (elPos.top + viewportTop - edgeY) - viewportHeight;

                    visible = (topEdge <= viewportTop && elPos.bottom > -edgeY &&
                        elPos.left <= viewportWidth + edgeX && elPos.right > -edgeX);
                }
                if (visible) {
                    $el.on(load_error, triggerLoadOrError);

                    triggerEvent('show', $el);

                    var srcAttr = objData.srcAttr,
                        src = $isFunction(srcAttr) ? srcAttr($el) : el.getAttribute(srcAttr);

                    if (src) {
                        el.src = src;
                    }

                    removeNode = true;
                } else {
                    if (topEdge < topLazy) {
                        topLazy = topEdge;
                    }
                }
            }
            if (removeNode) {
                $data(el, dataLazied, 0);
                elements.splice(i--, 1);
                length--;
            }
        }
        if (!length) {
            triggerEvent('complete', $(docElement));
        }
    }
    /**
     * Run check of lazy elements after timeout */

    function timeoutLazyElements() {
        if (waitingMode > 1) {
            waitingMode = 1;
            checkLazyElements();
            setTimeout(timeoutLazyElements, options.throttle);
        } else {
            waitingMode = 0;
        }
    }
    /**
     * Queue check of lazy elements because of event e
     * @param {Event} [e] */

    function queueCheckLazyElements(e) {
        if (!elements.length) {
            return;
        }
        // fast check for scroll event without new visible elements
        if (e && e.type === 'scroll' && e.currentTarget === window) {
            if (topLazy >= scrollTop()) {
                return;
            }
        }
        if (!waitingMode) {
            setTimeout(timeoutLazyElements, 0);
        }
        waitingMode = 2;
    }
    /**
     * Initialize list of hidden elements */

    function initLazyElements() {
        $window.lazyLoadXT();
    }
    /**
     * Loading of all elements */

    function forceLoadAll() {
        checkLazyElements(true);
    }
    /**
     * Display concentrations in case the modal is ready to be displayed.  */

    Drupal.behaviors.pageLoadReveal = {
        attach: function(context, settings) {
            // Only load if element is available.
            if ($('.page-load-reveal').length > 0) {
                $('.page-load-reveal').foundation('open');
            }
        }
    };
    /**
     * Handle button clicks.  */

    Drupal.behaviors.buttonHandleClick = {
        attach: function(context, settings) {
            $('button.handle-click').once('handle-button-click').on('click', function(e){
                e.preventDefault();
                var href = $(this).attr('data-href');
                if (typeof href !== "undefined") {
                    window.location.href = href;
                }
            });
        }
    };
    /**
     * Initialization    */

    $(document).ready(function () {
        triggerEvent('start', $window);

        $window
            .on(options.updateEvent, queueCheckLazyElements)
            .on(options.forceEvent, forceLoadAll);

        $(document).on(options.updateEvent, queueCheckLazyElements);

        if (options.autoInit) {
            $window.on(options.loadEvent, initLazyElements);
            initLazyElements(); // standard initialization
        }
    });

      $('button[data-slide]').click(function(){
      //console.log("clicked orbit slider");
      forceLoadAll();
    })
})(window.jQuery || window.Zepto || window.$, window, document);

(function ($) {
    var options = $.lazyLoadXT;

    options.selector += ',video,iframe[data-src]';
    options.videoPoster = 'data-poster';

    $(document).on('lazyshow', 'video', function (e, $el) {
        var srcAttr = $el.lazyLoadXT.srcAttr,
            isFuncSrcAttr = $.isFunction(srcAttr),
            changed = false;

        $el.attr('poster', $el.attr(options.videoPoster));
        $el.children('source,track')
            .each(function (index, el) {
                var $child = $(el),
                    src = isFuncSrcAttr ? srcAttr($child) : $child.attr(srcAttr);
                if (src) {
                    $child.attr('src', src);
                    $child.attr('src', src);
                    changed = true;
                }
            });
        // reload video
        if (changed) {
            this.load();
        }
    });
    Drupal.behaviors.resourcesResetClick = {
        attach: function(context, settings) {
            $('#views-reset-button').once('resource-reset-click').on('click', function(e){
                e.preventDefault();
                window.location.href = window.location.href;
            });
        }
    };
    Drupal.behaviors.searchBlockInit = {
        attach: function(context, settings) {
            $('input#site-search-input').once('init-search').on('keypress', function(e){
                if (e.keyCode == 13 || e.which == 13) {
                    e.preventDefault();
                    var value = $(this).val();
                    this.blur()
                    startSearch(value);
                }
            });
        }
    };
    Drupal.behaviors.initSiteSearchNoResult = {
        attach: function(context, settings) {
            $('input#no-result-site-search-input').once('init-site-search-no-result').on('keypress', function(e){
                if (e.keyCode == 13 || e.which == 13) {
                    e.preventDefault();
                    var value = $(this).val();
                    this.blur()
                    startSearch(value);
                }
            });
        }
    };
    var firstTimeLoad = false;
    /**
     * Allows loading of default result set for Resource List upon page load,
     * since by default the Views block don't initiate result load. */

    Drupal.behaviors.resourceListAutoSubmitInit = {
        attach: function(context, settings) {
            $(document).once('first-time-resource').ready(function(){
                if (!firstTimeLoad) {
                    $('#views-exposed-form-resources-block-1 #edit-submit-resources').trigger('click');
                }
                firstTimeLoad = true;
            });
        }
    };
    /**
     * Runs through all <A> tags and replaces 'data-onclick' attributes with 'onclick'. */

    Drupal.behaviors.autoCorrectOnClickEvents = {
        attach: function(context, settings) {
            $('a').each(function(key, el){
                var data_onclick = $(el).attr('data-onclick');
                var onclick = $(el).attr('onclick');

                // We'll only need to update attributes for <A> elements that don't have "onclick"
                // attribute set, but do have "data-onclick" set. That will reduce the set of
                // elements that these loop will go through.
                if (typeof data_onclick !== 'undefined' && data_onclick !== '' &&
                    (typeof onclick === 'undefined' || onclick === '')) {
                    $(el).attr('onclick', data_onclick);
                    $(el).removeAttr('data-onclick');
                }
            });
        }
    };
    /**
     * Callback function that is triggered whenever an anchor link is clicked or loaded via URL. */

    function locationHashChanged(id, e) {
        // Let's find out the id of the element that is being scrolled to.
        if (id == 'undefined') {
            id = location.hash;
        }

        if (typeof id != 'undefined' && id != '') {
            var top_height = $('nav#main-menu-wrap').height();
            id = id.toString();
            var clean_id = id.substr(1);
            if ($('[name="' + clean_id + '"]').length > 0) {
                var anchor_pos = $('[name="' + clean_id + '"]').offset().top;
                // Instead of using scrollTo() which will remove the hash string from URL,
                // we'll use the animate function with no duration in order to re-position
                // the viewport.
                e.preventDefault();
                $("html:not(:animated),body:not(:animated)").animate({scrollTop: (anchor_pos - top_height) + 'px'}, 1000);

                window.location.hash = clean_id;
            }
        }
    }
    /**
     * Drupal behavior that monitors clicks on anchor links and re-aligns scroll position as a result.  */

    Drupal.behaviors.detectAnchorClick = {
        attach: function(context, settings) {
            window.onhashchange = locationHashChanged;
            // We'll need to also monitor clicks on <A> tags and only respond if they're
            // anchor links, we'll need to reposition viewport.
            $('a').on('click', function(e){
               var href = $(this).attr('href');

               if (typeof href != 'undefined' && href.substr(0, 1) == '#') {
                   locationHashChanged(href, e);
               } else if (typeof href != 'undefined' && href.indexOf('#') != -1) {
                   href = href.substr(href.indexOf('#'));
                   locationHashChanged(href, e);
               }
            });
        }
    };
    /**
     * Allows all processes to finish before checking for hashtag in URL.
     * Instead of using document.ready event, we'll need to use window.load since
     * that event is being triggered much later after all document data is loaded,
     * and not just the DOM structure.*/

    $(window).on('load', function(e){
        // In addition to using window.load event, we also need to let browser to do it's own
        // scrolling method (due to the hashtag being present in the URL) so, setting a timeout
        // will allow us to successfully finish the function.
        setTimeout(function(){
            var location_hash = window.location.hash;
            if (typeof location_hash != 'undefined' && location_hash.substr(0, 1) == '#' && location_hash != '') {
                locationHashChanged(location_hash, e);
            }
        }, 1000);
    });

})(window.jQuery || window.Zepto || window.$);

    async function startSearch(keywords) {
        if (window.location.pathname == '/search') {
            window.location.href = '/search?cs=' + Math.random() + '#?cludoquery=' + encodeURIComponent(keywords);
        }
        else {
            const matchEnv = ['www.du.edu', 'test-du-core.pantheonsite.io', 'core.lndo.site']
            const pathArray = window.location.pathname.split('/').filter(Boolean)
            if (matchEnv.includes(window.location.hostname) && pathArray[0] === 'news') {
                let sid = sessionStorage.getItem('sid')
                if (!sid) {
                    sid = crypto.randomUUID()
                    sessionStorage.setItem('sid', sid)
                }
                const response = await fetch("https://api.cludo.com/api/v3/941/13746/search/pushstat/querylog", {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'sw': keywords,
                        'hn': window.location.hostname,
                        'refurl': window.location.href,
                        'sid': sid
                    })
                })
                const result = await response.json()
            }
            window.location.href = '/search#?cludoquery=' + encodeURIComponent(keywords);
        }
    }

}(jQuery));

(function ($) {

    $.fn.hasScrollBar = function () {
        return this.get(0).scrollHeight > this.height() || this.get(0).scrollWidth > this.width();
    }
    $(document).ready(function () {

        var $tables = $('.table-scroll > .table-scroll__wrapper table').each(function () {});
        var $tableWrappers = $tables.parent();

        function runTableEffects() {
            $tableWrappers
                .each(function () {
                    var $this = $(this);
                    var $parent = $this.parent('.table-scroll');

                    if ($this.hasScrollBar()) {
                        if (!$parent.hasClass("active")) {
                            //console.log("div.table has a scroll but is not active.. added active class");
                            $parent.addClass("active");
                        }
                    } else {
                        if (!$parent.hasClass("active")) {
                            //console.log("div.table does not have a scrollbar and was not active.")
                            return;
                        }
                        //console.log('removed class active');
                        $parent.removeClass("active");
                    }

                    if (!$parent.hasClass("active")) {
                        $parent.removeClass('table-scroll--shadow-right table-scroll--shadow-left')

                    } else {
                        $this.trigger("scroll");
                    }
                });
        };
        if ($tableWrappers.length) {
            runTableEffects();
            $(window).resize(function () {
                runTableEffects();
            });

            $tableWrappers
                .on('scroll', function () {
                    var $this = $(this);
                    var $parent = $this.parents('.table-scroll');
                    //console.log($parent);
                    var scrollLeft = $this.scrollLeft();
                    var scrolledLeft = scrollLeft == 0;

                    if (scrolledLeft) {
                        $parent.addClass('table-scroll--shadow-right');
                        $parent.removeClass('table-scroll--shadow-left');
                        return;
                    }

                    var scrollWidth = $this.get(0).scrollWidth;
                    var width = $this.width();

                    if (scrollLeft + width >= scrollWidth) {
                        $parent.addClass('table-scroll--shadow-left');
                        $parent.removeClass('table-scroll--shadow-right');
                    } else {
                        $parent.addClass('table-scroll--shadow-left table-scroll--shadow-right');
                    }
                })
                .each(function () {
                    var $this = $(this);
                    var $parent = $this.parents('.table-scroll');

                    if ($this.hasScrollBar()) {
                        $this.trigger("scroll");
                    }
                });
        }
    });
    /**
     * Toggles the Submenu dropdown in mobile. (faculty profiles also shared on core/acedemics) */

    function mobileMenu(x) {
      if (x.matches) { // If media query matches
        $(document).on("click", function (e) {
         // e.preventDefault(); // need to follow like on acedemic pages that use this pattern of nav
          var submenu = $(this).parents("#sub-menu-toggler").siblings("#sub-menu");
            //close menu when user clicks out/off the nav
            if($(e.target).is("#sub-menu-toggler > a") || $("#sub-menu-toggler > a").has(e.target).length !== 0) {
              $(submenu).toggle();
              $("#sub-menu").toggle();
              $("#sub-menu").toggleClass("is-active");
            } else {
              //reset the dropdown state
              isShowing = false;
              $("#sub-menu").removeClass("is-active");
              //$("#sub-menu").hide();
              $("#sub-menu-toggler > a").removeClass("open");
            }
        });
        //close menu once a selection in made
        $("#publications-label, #research-label, #background-label, #awards-label").click(function(){
          $("#sub-menu").removeClass("is-active");
          //$("#sub-menu").slideUp("fast");  // slide up not .hide()
          $("#sub-menu-toggler > a").removeClass("open");
        });
      }
    }
    // only use these rules on tablet and mobile
    var x = window.matchMedia("(max-width: 1023px)") // set to breakpoiunt of tab collapse to hamburger nav
    mobileMenu(x) // Call listener function at run time
    x.addListener(mobileMenu) // Attach listener function on state changes
  /**
   * Toggles tab menu --desktop */

  $("#tab-menu-toggler > a").on("click", function(e) {
      e.preventDefault();
      var submenu = $(this).parents('#tab-menu-toggler').siblings('#tab-menu');
      $(submenu).toggle();
      $("#tab-menu").toggle();
      $("#tab-menu").toggleClass('.is-active');
    })

    $('.image-with-caption figcaption').on('click', function(e) {
      e.preventDefault();
      $('.image-with-caption figcaption').toggleClass('truncate');
    });
    /**
    * Removes background profile tab from display if it is the only tab */

    Drupal.behaviors.profileTabLabels = {
      attach: function(context, settings) {
        if ($('#profile-tabs li').length < 2) {
          $('#profile-tabs li').remove();
        }
      }
    };

    var elem = document.getElementById("#tab-menu");
    if (elem != null) {

        //add functionality to drag with mouse for horizontal nav in newsroom
        const slider = document.querySelector('#tab-menu');
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', function(e) {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', function() {
            isDown = false;
            slider.classList.remove('active');
        });
        slider.addEventListener('mouseup', function() {
            isDown = false;
            slider.classList.remove('active');
        });
        slider.addEventListener('mousemove', function(e) {
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 3; //scroll-fast
            slider.scrollLeft = scrollLeft - walk;
            //console.log(walk);
        });

        // set the active nav item to be visible/ centered on page refresh
        //scroll to the active tab for newsroom sub menu---specifically for mobile
        $(window).on("load resize",function(event){

            var totalWidth = $("#tab-menu").outerWidth()

            $('#tab-menu ul').css('width', totalWidth);

            var myScrollPos = $('.active').offset().left + $('.active').outerWidth(true) / 2 + $('.menu-scroll').scrollLeft() - $('.menu-scroll').width() / 2;

            $( "#tab-menu" ).scrollLeft( myScrollPos );
        });
    }

    // Remove the tab menu for profiles if the nav ul is empty  (it gets pre populated so :empty does not work
    setTimeout(function(){
    if ( $('#profile-tabs').children().length == 0 ) {
        $('.profile-sub-section > #sub-menu').remove();
    }
    }, 100);

  $('#sub-menu-toggler > a:first-of-type, #sub-menu-toggler').on('click', function(e) {
    $('#sub-menu-toggler > a').toggleClass('open');
    $('#sub-menu').toggleClass('is-active');
    if ($('#sub-menu').attr('style').toLowerCase() != "display: none;") {
      $('#sub-menu').attr({'style': 'display: "none"'});
    } else if ($('#sub-menu').attr('style').toLowerCase() == "display: none;") {
      $('#sub-menu').attr('style', '');
    }
  });
  // Related stories slider
  Drupal.behaviors.relatedStoriesSlider = {
    attach: function(context, settings) {
        var slider = $('.related-stories-module .slider-container');

        $(function() {
            $(slider).slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                mobileFirst: true,
                arrows: false,
                dots: true,
                responsive: [
                    {
                        breakpoint: 769,
                        settings: 'unslick'
                    }
                ]
            });

            $(window).on('resize', function() {
                $(slider).slick('resize');
            });
        });
    }
  };
  // Featured events slider
  Drupal.behaviors.featuredEventsSlider = {
    attach: function(context, settings) {
        var slider = $('.featured-events-module .slider-container');

        $(function() {
            $(slider).slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                mobileFirst: true,
                arrows: true,
                dots: true,
            });

            $(window).on('resize', function() {
                $(slider).slick('resize');
            });
        });
    }
  };
    // New featured events slider
    Drupal.behaviors.featuredEventsNewSlider = {
        attach: function(context, settings) {
            var slider = $('.new-featured-events .slider-container');

            $(function() {
                $(slider).slick({
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    arrows: true,
                    dots: true,
                    respondTo: "window",
                    responsive: [
                        {
                            breakpoint: 1200,
                            settings: {
                                slidesToShow: 2,
                            }
                        },
                        {
                            breakpoint: 768,
                            settings: {
                                arrows: false,
                                slidesToShow: 1,
                            }
                        },
                    ]
                });
            });
        }
    };

    // News carousel
    Drupal.behaviors.newsCarousel = {
        attach: function(context, settings) {
            $('.news-carousel .slider-container').each(function() {
                $(this).slick({
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    arrows: true,
                    dots: false,
                    infinite: false,
                    respondTo: "window",
                    appendArrows: $(this).siblings('.slider-buttons'),
                    prevArrow: `<button type="button" aria-label="Previous" class="news-carousel-prev">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
                        </svg>
                        </button>`,
                    nextArrow: `<button type="button" aria-label="Next" class="news-carousel-next">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                        </svg>
                        </button>`,
                    responsive: [
                        {
                            breakpoint: 1280,
                            settings: {
                                slidesToShow: 2,
                            }
                        },
                        {
                            breakpoint: 768,
                            settings: {
                                slidesToShow: 1,
                            }
                        },
                    ]
                });
            });
        }
    };

  // Homepage quote slider
  Drupal.behaviors.quoteSlider = {
    attach: function(context, settings) {
        var slider = $('.quotes-module__wrapper .slider-container');

        $(function() {
            $(slider).slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                mobileFirst: true,
                arrows: false,
                dots: true,
            });

            $(window).on('resize', function() {
                $(slider).slick('resize');
            });
        });
    }
  };

  Drupal.behaviors.calendarDatePicker = {
    attach: function(context, settings) {
    //Event Listing Datepicker
        /**
         * Borrowed from https://stackoverflow.com/questions/901115
         * Edited to return an empty string if param is missing.
         */
        function getQueryParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return '';
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        // Finds distance of scroll and stores that in a session.
        $(window).scroll(function() {
            sessionStorage.scrollTop = $(this).scrollTop();
        });

        // When the document reloads it applys the stored session scroll distance.
        $(document).ready(function() {
            var href = window.location.href;
            var href = $(location).attr('pathname');
            href.indexOf(1);
            href.toLowerCase();
            href = href.split("/")[1];

            if (sessionStorage.scrollTop != "undefined") {
                if (href == 'calendar') {
                    $(window).scrollTop(sessionStorage.scrollTop);
                }
            }
            sessionStorage.scrollTop.clear();
        });

        /**
         * Assembles the query string corresponding with the new filter values.
         * @param startDate optional start date query parameter (yyyy-mm-dd)
         * @param endDate optional start date query parameter (yyyy-mm-dd)
         */
        function submitDatePickers(startDate, endDate) {
            var tempScrollTop = $(window).scrollTop();
            var buildQuery = [];
            if ( typeof(startDate) !== 'undefined' && startDate != "" ) {
                buildQuery.push("start_date=" + startDate);
            } else {
                buildQuery.push("start_date=" + getQueryParameterByName("start_date"));
            }
            if ( typeof(endDate) !== 'undefined' && endDate != "" ) {
                buildQuery.push("end_date=" + endDate);
            } else {
                buildQuery.push("end_date=" + getQueryParameterByName("end_date"));
            }
            window.location.reload();
            window.location.search = buildQuery.join('&');
        }

        if ($("#datepicker-start").length) {
            let startDate = getQueryParameterByName('start_date', window.location.href);
            $("#datepicker-start").datepicker({
                changeMonth: true,
                dateFormat: 'yy-mm-dd',
                defaultDate: startDate,
                inline: true,
                onSelect: function (dateText, inst) {
                    submitDatePickers(dateText, '');
                    $(this).hide();
                }
            });
            $("#datepicker-start").hide();

            $("#datepickerImageStart").click(function () {
                $("#datepicker-start").show();
                $("#datepicker-end").hide();
                $("#datepickerImageStart h2").css("color", "#a31e39");
                $("#datepickerImageEnd h2").css("color", "#000");
            });
            $("#datepicker-start .ui-datepicker-calendar").click(function () {
                $("#datepicker-start").hide();
            });

            let endDate = getQueryParameterByName('end_date', window.location.href) || startDate;
            $("#datepicker-end").datepicker({
                changeMonth: true,
                dateFormat: 'yy-mm-dd',
                defaultDate: endDate,
                inline: true,
                onSelect: function (dateText, inst) {
                    submitDatePickers('', dateText);
                    $(this).hide();
                }
            });
            $("#datepicker-end").hide();
        }
        $("#datepickerImageEnd").click(function () {
            $("#datepicker-end").show();
            $("#datepicker-start").hide();
            $("#datepickerImageEnd h2").css("color", "#a31e39");
            $("#datepickerImageStart h2").css("color", "#000");
        });
        $("#datepicker-end .ui-datepicker-calendar").click(function () {
            $("#datepicker-end").hide();
        });

        $("#datepicker-end").click(function(){
            $(this).hide();
        });

        $("#byDate").click(function(){
            $("#month-nav").css("border-bottom", "none");
            $("#month-nav h2").css("color", "#bebebe");
            $(this).css("border-bottom", "10px solid #a31e39");
        });

        $("#month-nav").click(function(){
            $("#datepicker-start").hide();
            $("#datepicker-end").hide();
            $("#byDate").css("border-bottom", "none");
            $("#byDate h2").css("color", "#bebebe");
            $(this).css("border-bottom", "10px solid #a31e39");
        });
    }
};

    // //Copy with image on right 2-column desktop,  1 column-mobile  row height is naturally calculated by image, the row needs total height
    // $(function() {
    //     //give initial value on page load
    //     if (Foundation.MediaQuery.atLeast('large')) {
    //         var colHeight = "height:" + $('.image-right').height() + "px;"; //where .image-right refers to the copy component and is on left
    //         $(".img-right").attr("style", colHeight); //give the right side image container the height of its sibling
    //     }
    //
    //     //resize as screen size changes
    //     $( window ).resize(function() {
    //         if (Foundation.MediaQuery.atLeast('large')) {
    //             var colHeight = "height:" + $('.image-right').height() + "px;";
    //             $(".img-right").attr("style", colHeight);
    //         }
    //         // make sure to remove if screen moves from small to large to small
    //         if (Foundation.MediaQuery.current == 'medium' || Foundation.MediaQuery.current == 'small') {
    //             $(".img-right").attr("style", "");
    //         }
    //     });
    // });
    //

    // Adds type button to <a> tags that are part of an accordion.
    Drupal.behaviors.accordion = {
        attach: function(context, settings) {
            $('.accordion-title').attr('type', 'button');
        }
    }

    // Adjust the font-size of the site prefix and name based on character length.
    Drupal.behaviors.siteNameAdjustment = {
        attach: function(context, settings) {

            const siteName = $('.inline-site .site-identity .site-name');
            const sitePrefix = $('.inline-site .site-identity .site-prefix');
            const menuCount = $('.core-inline-site #main-menu #block-pl-drupal-main-menu .menu-level-0').children().length;

            const mediumMediaQuery = window.matchMedia('(min-width: 768px)');
            const largeMediaQuery = window.matchMedia('(min-width: 1200px)');

            // Check site name to see if the length is greater than 35, 25, or 15 characters.
            if (siteName !== null && siteName.text().length > 35) {
                // Large Screens.
                if (largeMediaQuery.matches && menuCount > 3) {
                    siteName.css('font-size', '1.7rem');
                }
                // Medium Screens.
                else if (mediumMediaQuery.matches && menuCount > 3) {
                    siteName.css('font-size', '1.5rem');
                }
            } else if (siteName !== null && siteName.text().length > 25) {
                if (largeMediaQuery.matches && menuCount > 4) {
                    siteName.css('font-size', '1.9rem');
                }
                else if (mediumMediaQuery.matches && menuCount > 4) {
                    siteName.css('font-size', '1.75rem');
                }
            } else if (siteName !== null && siteName.text().length > 15) {
                // Only change the font-size if the menu has more than 3, 4, or 5 items.
                if (largeMediaQuery.matches && menuCount > 5) {
                    siteName.css('font-size', '2.1rem');
                }
                else if (mediumMediaQuery.matches && menuCount > 5) {
                    siteName.css('font-size', '1.95rem');
                }
            }

            // Check site prefix to see if the length is greater than 25 or 15 characters.
            if (sitePrefix !== null && sitePrefix.text().length > 35) {
                // Large Screens
                if (largeMediaQuery.matches && menuCount > 3) {
                    sitePrefix.css('font-size', '1.9rem');
                }
                // Medium Screens
                else if (mediumMediaQuery.matches && menuCount > 3) {
                    sitePrefix.css('font-size', '1.8rem');
                }
            } else if (sitePrefix !== null && sitePrefix.text().length > 25) {
                if (largeMediaQuery.matches && menuCount > 4) {
                    sitePrefix.css('font-size', '1.8rem');
                }
                else if (mediumMediaQuery.matches && menuCount > 4) {
                    sitePrefix.css('font-size', '1.7rem');
                }
            } else if (sitePrefix !== null && sitePrefix.text().length > 15) {
                if (largeMediaQuery.matches && menuCount > 5) {
                    sitePrefix.css('font-size', '1.7rem');
                }
                else if (mediumMediaQuery.matches && menuCount > 5) {
                    sitePrefix.css('font-size', '1.6rem');
                }
            }
        }
    }

    // Disable the "Next" button on any view with a generic-listing view.
    Drupal.behaviors.disableNextButtonOnLastPage = {
        attach: function() {
            // This is the next pager button on the list view for any generic-listing view.
            const viewPager = document.querySelector(".views-element-container .generic-listing .pager .pager__items .pager__item--next");

            if (viewPager !== null) {
                // If the element directly before the pager is active we'll disable the next button.
                if (viewPager.previousElementSibling.classList.contains('is-active')) {
                    $(viewPager).css({"pointer-events": "none", "opacity": "15%"});
                } else {
                    $(viewPager).css({"pointer-events": "auto", "opacity": "100%"});
                }
            }
        }
    }

    // Custom element for youtube videos.
    class YoutubeEmbed extends HTMLElement {
        connectedCallback() {
            this.videoId = this.getAttribute('videoid');
            this.videoImage = this.getAttribute('video-image');
            let playBtnEl = this.querySelector('.yt-playbtn');
            this.playLabel = (playBtnEl && playBtnEl.textContent.trim()) || this.getAttribute('playlabel') || 'Play';
            if (!this.style.backgroundImage) {
                if (this.videoImage) {
                    this.style.backgroundImage = `url("${this.videoImage}")`;
                } else {
                    this.style.backgroundImage = `url("https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg")`;
                }
            }
            if (!playBtnEl) {
                playBtnEl = document.createElement('button');
                playBtnEl.type = 'button';
                playBtnEl.classList.add('yt-playbtn');
                this.append(playBtnEl);
            }
            if (!playBtnEl.textContent) {
                const playBtnLabelEl = document.createElement('span');
                playBtnLabelEl.className = 'yt-visually-hidden';
                playBtnLabelEl.textContent = this.playLabel;
                playBtnEl.append(playBtnLabelEl);
            }
            playBtnEl.removeAttribute('href');
            this.addEventListener('pointerover', YoutubeEmbed.warmConnections, {once: true});
            this.addEventListener('click', this.addIframe);
            this.needsYTApiForAutoplay = navigator.vendor.includes('Apple') || navigator.userAgent.includes('Mobi');
        }

        static addPrefetch(kind, url, as) {
            const linkEl = document.createElement('link');
            linkEl.rel = kind;
            linkEl.href = url;
            if (as) {
                linkEl.as = as;
            }
            document.head.append(linkEl);
        }

        static warmConnections() {
            if (YoutubeEmbed.preconnected) return;
            YoutubeEmbed.addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
            YoutubeEmbed.addPrefetch('preconnect', 'https://www.google.com');
            YoutubeEmbed.addPrefetch('preconnect', 'https://googleads.g.doubleclick.net');
            YoutubeEmbed.addPrefetch('preconnect', 'https://static.doubleclick.net');
            YoutubeEmbed.preconnected = true;
        }

        fetchYTPlayerApi() {
            if (window.YT || (window.YT && window.YT.Player)) return;
            this.ytApiPromise = new Promise((res, rej) => {
                var el = document.createElement('script');
                el.src = 'https://www.youtube.com/iframe_api';
                el.async = true;
                el.onload = _ => {
                    YT.ready(res);
                };
                el.onerror = rej;
                this.append(el);
            });
        }

        async addYTPlayerIframe(params) {
            this.fetchYTPlayerApi();
            await this.ytApiPromise;
            const videoPlaceholderEl = document.createElement('div')
            this.append(videoPlaceholderEl);
            const paramsObj = Object.fromEntries(params.entries());
            new YT.Player(videoPlaceholderEl, {
                width: '100%',
                videoId: this.videoId,
                playerVars: paramsObj,
                events: {
                    'onReady': event => {
                        event.target.playVideo();
                    }
                }
            });
        }

        async addIframe() {
            if (this.classList.contains('yt-activated')) return;
            const activeVideos = document.getElementsByClassName('yt-activated');
            for (let activeVideo of activeVideos) {
                if (this.videoId !== activeVideo.videoId) {
                    let children = activeVideo.childNodes;
                    for (const node of children) {
                        if (node.nodeName === 'IFRAME') {
                            node.remove()
                        }
                    }
                    activeVideo.classList.remove('yt-activated');
                }
            }
            this.classList.add('yt-activated');
            const params = new URLSearchParams(this.getAttribute('params') || []);
            params.append('autoplay', '1');
            params.append('playsinline', '1');
            if (this.needsYTApiForAutoplay) {
                return this.addYTPlayerIframe(params);
            }
            const iframeEl = document.createElement('iframe');
            iframeEl.width = 560;
            iframeEl.height = 315;
            iframeEl.title = this.playLabel;
            iframeEl.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
            iframeEl.allowFullscreen = true;
            iframeEl.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${params.toString()}`;
            this.append(iframeEl);
            iframeEl.focus();
        }
    }
    customElements.define('youtube-embed', YoutubeEmbed);

    // Replaces the email text with a general email statement on the Find an Expert Content page.
    Drupal.behaviors.replaceExpertEmailLabels = {
        attach: function() {

            const emailLabels = $('.find-an-expert .views-element-container .views-view-grid .views-col .views-field-field-email .field-content .field_email-field');

            // View update - Hide email field parent's parent if no email is present.
            emailLabels.each(function() {
                if ($(this).text()) {
                    $(this).parent().parent().toggle();
                }
            });

            // Inside content page
            $('.find-an-expert-page #inner-information .field_email-field a').text("Email Expert");
        }
    }

    // Gallery JS - Hide / Display the Actual Gallery Section of the "Gallery - Date" View.
    Drupal.behaviors.galleryDateActualGalleryDisplayOptions = {
        attach: function() {
            // Change the minus/plus and gallery attachment on toggle.
            $('.gallery-actual-select-button').click(function() {
                $('.gallery-actual-attached').toggle();
                $('.gallery-actual-select-button').toggleClass('gallery-actual-show-minus');
            });

            // Rename the min/max fields for the date range.
            $('.js-form-item-field-gallery-date-value-min label').text('Start Date');
            $('.js-form-item-field-gallery-date-value-max label').text('End Date');
        }
    }

    // Utility Menu - Core and Unit - Explore Mobile Update.
    Drupal.behaviors.utilityMenuExploreDropdownUpdate = {
        attach: function() {
            // Clicking the Explore button will open up the dropdown on CORE.
            $('.menu-toggle-utility').click(function() {
                $('.menu-toggle-utility li').toggle();
            });
        }
    }

    // Login Page on all sites: Local sign in hidden by default, show on click.
    Drupal.behaviors.loginScreenShowLocalSignIn = {
        attach: function() {
            // Attach the click event to the local sign in button.
            $('.user-login-form').prepend('<div class="toggle-user-login-state icon-du-down-arrow"></div>');

            // Clicking the toggle user login state button will open up the local login dropdown.
            $('form.user-login-form .toggle-user-login-state').click(function() {
                $('.user-login-form .js-form-item-name label, .user-login-form .js-form-item-name input, .user-login-form .js-form-item-name div').toggle();
                $('.user-login-form .js-form-type-password').toggle();
                $('.user-login-form .form-actions').toggle();

                // Change the icon of the toggle class div.
                $('.toggle-user-login-state').toggleClass('icon-du-down-arrow icon-du-up-arrow');

                // Check for bottom margin so the page doesn't expand too rapidly visually.
                if ($('.user-login-form .form-actions').css('display') === 'none') {
                    $('.user-login-form').css('margin-bottom', '29.0rem');
                } else {
                    $('.user-login-form').css('margin-bottom', '0');
                }
            });
        }
    }

})(jQuery);
