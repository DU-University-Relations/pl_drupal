(function ($, Drupal) {
    'use strict';
  
    Drupal.behaviors.attach_utm_cookies = {
      attach: function (context, settings) {
        const ExpireDays = 30;

        let qstr = document.location.search;
        qstr = qstr.substring(1, qstr.length);

        function SetCookie(cookieName, cookieValue, nDays) {
          const domain = get_top_domain(window.location.host); // TODO: Could we change this to just use du.edu? Leaving as is for now since it allows the cookies to be set even in local environments. 
          const today = new Date();
          let expire = new Date();

          if (nDays == null || nDays == 0) nDays = 1;

          expire.setTime(today.getTime() + 3600000 * 24 * nDays);
          document.cookie = cookieName + "=" + encodeURIComponent(cookieValue) + "; expires=" + expire.toGMTString() + "; path=/; domain=." + domain + ";";
        }

        const thevars = qstr.split("&");

        for (let i = 0; i < thevars.length; i++) {
          const cookiecase = thevars[i].split("=");

          switch (cookiecase[0]) {
            case "utm_source":
              const utm_source = cookiecase[1];
              SetCookie("STYXKEY-utm_source", utm_source, ExpireDays);
              break;
            case "utm_medium":
              const utm_medium = cookiecase[1];
              SetCookie("STYXKEY-utm_medium", utm_medium, ExpireDays);
              break;
            case "utm_campaign":
              const utm_campaign = cookiecase[1];
              SetCookie("STYXKEY-utm_campaign", utm_campaign, ExpireDays);
              break;
            case "gad_source":
              const gad_source = cookiecase[1];
              SetCookie("STYXKEY-gad_source", gad_source, ExpireDays);
              break;
            case "gclid":
              const gclid = cookiecase[1];
              SetCookie("STYXKEY-gclid", gclid, ExpireDays);
              break;
            default:
              break;
          }
        }

        function get_top_domain() {
          let i, h,
            weird_cookie = 'weird_get_top_level_domain=cookie',
            hostname = document.location.hostname.split('.');

          for (i = hostname.length - 1; i >= 0; i--) {
            h = hostname.slice(i).join('.');
            document.cookie = weird_cookie + ';domain=.' + h + ';';
            if (document.cookie.indexOf(weird_cookie) > -1) {
              document.cookie = weird_cookie.split('=')[0] + '=;domain=.' + h + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              return h;
            }
          }
        }

        function getCookie(cname) {
          const name = cname + "=";
          const decodedCookie = decodeURIComponent(document.cookie);
          const ca = decodedCookie.split(';');
          for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
              c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
              return c.substring(name.length, c.length);
            }
          }
          return "";
        }
      }
    };
  
  })(jQuery, Drupal);