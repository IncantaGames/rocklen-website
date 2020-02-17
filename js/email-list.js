/* eslint-env browser */
/* eslint prefer-arrow-callback: 0, object-shorthand: 0, new-cap: 0, no-invalid-this: 0, no-var: 0*/

if (typeof window.mailtrain !== 'object') {
  window.mailtrain = {};
  (function (mt) {
    'use strict';

    if (document.documentMode <= 9 || typeof XMLHttpRequest === 'undefined') {
      return;
    }

    var forEach = function (array, callback, scope) {
      for (var i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]);
      }
    };

    var loadScript = function (exists, url, callback) {
      if (eval(exists)) {
        return callback(true);
      }
      var scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'text/javascript');
      scriptTag.setAttribute('src', url);
      if (typeof callback !== 'undefined') {
        if (scriptTag.readyState) {
          scriptTag.onreadystatechange = function () {
            (this.readyState === 'complete' || this.readyState === 'loaded') && callback();
          };
        } else {
          scriptTag.onload = callback;
        }
      }
      (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(scriptTag);
    };

    var serialize = function (form) {
      var field, s = [];
      if (typeof form === 'object' && form.nodeName === 'FORM') {
        var len = form.elements.length;
        for (var i = 0; i < len; i++) {
          field = form.elements[i];
          if (field.name && !field.disabled && field.type !== 'file' && field.type !== 'reset' && field.type !== 'submit' && field.type !== 'button') {
            if (field.type === 'select-multiple') {
              for (var j = form.elements[i].options.length - 1; j >= 0; j--) {
                if (field.options[j].selected) {
                  s[s.length] = encodeURIComponent(field.name) + '=' + encodeURIComponent(field.options[j].value);
                }
              }
            } else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
              s[s.length] = encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value);
            }
          }
        }
      }
      return s.join('&').replace(/%20/g, '+');
    };

    var getXHR = function (method, url, successHandler, errorHandler) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          var data;
          try {
            data = JSON.parse(xhr.responseText);
          } catch (err) {
            data = { error: err.message || err };
          }
          xhr.status === 200 && !data.error
            ? successHandler && successHandler(data)
            : errorHandler && errorHandler(data);
        }
      };
      return xhr;
    };

    var sendForm = function (form, successHandler, errorHandler) {
      var url = form.getAttribute('action');
      var xhr = getXHR('post', url, successHandler, errorHandler);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send(serialize(form));
    };

    var renderWidget = function (container) {
      var form = container.querySelector("form");
      var cid = container.getAttribute("cid");
      var mailtrainUrl = container.getAttribute("mailtrain-url");
      var actionUrl = mailtrainUrl + "/subscription/" + cid + "/subscribe";
      form.setAttribute("method", "POST");
      form.setAttribute("action", actionUrl);
      var statusContainer = container.querySelector('.status');

      var setStatus = function (templateName, message) {
        var html = container.querySelector('div[data-status-template="' + templateName + '"]').outerHTML;
        html = message ? html.replace('{message}', message) : html;
        statusContainer.innerHTML = html;
      };

      container.querySelector('.sub-time').value = new Date().getTime();

      if (window.moment && window.moment.tz) {
        container.querySelector('.tz-detect').value = window.moment.tz.guess() || '';
      }

      var isSending = false;

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (isSending) {
          return;
        }

        isSending = true;
        setStatus('spinner');

        sendForm(form, function (j) {
          isSending = false;
          setStatus('confirm-notice');
          form.style.display = 'none';
          container.scrollIntoView();
        }, function (j) {
          isSending = false;
          setStatus('error', j.error);
        });
      });
    };

    forEach(document.body.querySelectorAll('div[data-mailtrain-subscription-widget]'), function (i, container) {
      renderWidget(container);
    });

    document.addEventListener('DOMContentLoaded', function () {
      loadScript('window.moment', 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.12.0/moment.min.js', function (existed) {
        loadScript('window.moment.tz', 'https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.3/moment-timezone-with-data.min.js', function (existed) {
          if (window.moment && window.moment.tz) {
            forEach(document.body.querySelectorAll('.tz-detect'), function (i, el) {
              el.value = window.moment.tz.guess() || '';
            });
          }
        });
      });
    });

  })(window.mailtrain);
}
