/*!
 * jQuery Custom Select Plugin 1.6.0
 * 2013-08-08
 *
 * http://www.blissmedia.com.au/
 *
 * Copyright 2013 Bliss Media
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

;(function($) {
  $.fn.customselect = function(method, value) {

    // Default Options
    var $options  = {
      "csclass":      "custom-select",  // Class to match
      "search":       true,             // Is searchable?
      "numitems":     4,                // Number of results per page
      "searchblank":  false,            // Search blank value options?
      "showblank":    true,             // Show blank value options?
      "searchvalue":  false,            // Search option values?
      "hoveropen":    false,            // Open the select on hover?
      "emptytext":    "",               // Change empty option text to a set value
      "mobilecheck":  function() {      // Mobile check function / boolean
        return navigator.platform && navigator.userAgent.match(/(android|iphone|ipad|blackberry)/i);
      }
    };

    // Mobile check
    var $is_mobile = typeof $options.mobilecheck == "function" ? $options.mobilecheck.call() : $options.mobilecheck;

    // Select validation
    var items = $is_mobile ? $(this).filter("select") : $(this).filter("select:not([multiple])");

    // Customselect control
    items.each(function() {

      // Original Select
      var $select   = $(this);

      // Preset Options
      if($select.data("cs-options")) {
        $.extend($options, $select.data("cs-options"));
      }

      // Custom Select Container
      var $this     = $select.parents($options.selector+":first");

      var methods   = {
        init: function() {
          // Initital Setup
          var setup = {
            init: function() {
              // Create Elements + Events
              setup.container();
              setup.value();
              setup.subcontainer();
            },

            container: function() {
              $this = $("<div/>").addClass($options.csclass);
              if($is_mobile) {
                $this.addClass($options.csclass + "-mobile");
                $select.css("opacity", 0);
              }

              // Selector Container
              $select.before($this);
              $select.appendTo($this);
              $select.change(function() {
                methods.select($(this).val());
              });

              // Standard Events
              var hover_timeout = null;
              $this.hover(function() {
                if(hover_timeout) clearTimeout(hover_timeout);
                $this.addClass($options.csclass+"-hover");
              }, function() {
                if($options.hoveropen) hover_timeout = setTimeout(methods.close, 750);
                $this.removeClass($options.csclass+"-hover");
              });

              $(document).mouseup(function() {
                if(!$this.is($options.selector+"-hover")) methods.close();
                else $this.find("input").focus();
              });
            },

            value: function() {
              var value = $("<a href='#'/>").appendTo($this);
              $select.appendTo($this);
              var txt = $select.find("option:selected").text();
              value.html(txt.length > 0 ? txt : $options.emptytext)
                    .click(function(e) { e.preventDefault(); })
                    .focus(function() { $this.addClass($options.csclass+"-focus"); })
                    .blur(function() { $this.removeClass($options.csclass+"-focus"); });
              if($options.hoveropen) {
                value.mouseover(methods.open);
              }
              else {
                value.click(methods.toggle);
              }
            },

            subcontainer: function() {
              // Container
              var subcont = $("<div/>").appendTo($this);

              // Input Box
              var input   = $("<input type='input'/>").appendTo(subcont);
              input.keyup(function(e) {
                if($.inArray(e.which, [13,38,40])<0) {
                  if($options.search) {
                    methods.search($(this).val());
                  }
                  else {
                    methods.searchmove($(this).val());
                    $(this).val("");
                  }
                }
              }).keydown(function(e) {
                switch(e.which) {
                  case 13: // Enter
                    val = $this.find("ul li.active.option-hover").data("value");
                    methods.select(val);
                  break;
                  case 38: // Up
                    methods.selectUp();
                  break;
                  case 40: // Down
                    methods.selectDown();
                  break;
                  case 27: // Esc
                    methods.close();
                  break;
                  default:
                    return true;
                  break;
                }

                e.preventDefault();
                return false;
              }).blur(function() { $(this).val(""); });
              if(!$options.search) {
                input.addClass($options.csclass+"-hidden-input");
              }

              // Scrolling Container
              var scroll  = $("<div/>").appendTo(subcont);

              // Selectable Items
              var select  = $("<ul/>").appendTo(scroll);
              $select.find("option").each(function(i) {
                var val = $(this).attr("value");
                var txt = $(this).text()
                if($options.showblank || val.length > 0) {
                  $("<li/>", {
                    'class':      'active' + (i==0 ? ' option-hover' : ''),
                    'data-value': val,
                    'text':       txt.length > 0 ? txt : $options.emptytext
                  }).appendTo(select);
                }
              });
              var options = select.find("li");
              select.find("li").click(function() {
                methods.select($(this).data("value"));
              });

              $this.find("div div").css({
                "overflow-y": options.length > $options.numitems ? "scroll" : "visible"
              });

              $("<li/>", {
                'class':  'no-results',
                'text':   "No results"
              }).appendTo(select);
            }
          };

          if($select.is("select"+$options.selector)) {
            setup.init();
          }
        },

        // Open/Close Select Box
        toggle: function() {
          if($this.is($options.selector+"-open")) {
            methods.close();
          }
          else {
            methods.open();
          }
        },

        // Open Select Box
        open: function() {
          if(!$is_mobile) {
            $this.addClass($options.csclass+"-open");
            $this.find("input").focus();
            $this.find("ul li.no-results").hide();
            methods._selectMove($select[0].selectedIndex)
          }
        },

        // Close Select Box
        close: function() {
          $this.removeClass($options.csclass+"-open");
          $this.find("input").val("").blur();
          $this.find("ul li").not(".no-results").addClass("active");

          var options = $this.find("ul li").not(".no-results");
          $this.find("div div").css({
            "overflow-y": options.length > $options.numitems ? "scroll" : "visible"
          });
        },

        // Search Options
        search: function(value) {
          value = $.trim(value.toLowerCase());

          var noresults = $this.find("ul li.no-results").hide();

          // Search for Match
          var options = $this.find("ul li").not(".no-results");
          options.each(function() {
            var text = ($(this).text()+"").toLowerCase();
            var val  = ($(this).data("value")+"").toLowerCase();
            var add  = false;

            if($options.searchblank || val.length > 0) {
              if($options.searchvalue && val.indexOf(value) >= 0) {
                add = true;
              }
              else if(text.indexOf(value) >= 0) {
                add = true;
              }
            }
            else if(value.length == 0) {
              add = true;
            }

            add ? $(this).addClass("active") : $(this).removeClass("active");
          });
          options = options.filter(".active").filter(":visible");

          // Set Scroll
          $this.find("div div").css({
            "overflow-y": options.length > $options.numitems ? "scroll" : "visible"
          });

          if(options.length > 0) {
            // Select First Result
            methods._selectMove(0);
          }
          else {
            // No Results
            noresults.show();
          }
        },

        searchmove: function(value) {
          var index = [];
          $select.find("option").each(function(i) {
            if($(this).text().indexOf(value) == 0) {
              index.push(i);
            }
          });

          if(index.length > 0) {
            methods._selectMove(index[0]);
          }
        },

        // Select Option
        select: function(value) {
          if($select.val() != value) {
            $select.val(value).change();
          }
          var txt = $select.find("option:selected").text();
          $this.find("a").text(txt.length > 0 ? txt : $options.emptytext);
          methods.close();
        },

        // Move Selection Up
        selectUp: function() {
          var options   = $this.find("ul li.active").not(".no-results");
          var selected  = options.index(options.filter(".option-hover"));

          var moveTo = selected - 1;
          moveTo = moveTo < 0 ? options.length - 1 : moveTo;

          methods._selectMove(moveTo);
        },

        // Move Selection Down
        selectDown: function() {
          var options   = $this.find("ul li.active").not(".no-results");
          var selected  = options.index(options.filter(".option-hover"));

          var moveTo = selected + 1;
          moveTo = moveTo > options.length - 1 ? 0 : moveTo;

          methods._selectMove(moveTo);
        },

        // Move Selection to Index
        _selectMove: function(index) {
          var options   = $this.find("ul li.active");
          options.removeClass("option-hover").eq(index).addClass("option-hover");

          var scroll = $this.find("div div");
          if(scroll.css("overflow-y") == "scroll") {
            scroll.scrollTop(0);
            if(index+1 > $options.numitems) {
              offset = options.eq(index+1 - $options.numitems).offset().top - scroll.offset().top;
              if(index == $select.find("option").length-1) {
                offset = scroll.find("ul").height();
              }
              scroll.scrollTop(offset);
            }
          }
        },

        destroy: function() {
          if($select.data("cs-options")) {
            $select.removeData("cs-options").insertAfter($this);
            $this.remove();
          }
        }
      };

      var call_method = method;

      // Check for Additional Options
      if(call_method && typeof call_method == "object") {
        $.extend($options, call_method);

        call_method = "init";
        value       = null;
      }

      $options.selector = "."+$options.csclass;

      // Load Requested Method
      call_method = call_method ? call_method : "init";
      if(typeof methods[call_method] == "function") {
        methods[call_method].call(this, value);
      }

      $select.data("cs-options", $options);
    });

    return this;
  };
})(jQuery);