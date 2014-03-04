/*!
 * jQuery Custom Select Plugin - Master Source
 * 2014-03-04
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
      "showdisabled": false,            // Show disabled options
      "mobilecheck":  function() {      // Mobile check function / boolean
        return navigator.platform && navigator.userAgent.match(/(android|iphone|ipad|blackberry)/i);
      }
    };

    // Check for Additional Options
    if(method && typeof method == "object") {
      $.extend($options, method);
    }

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
              $select.off("change", setup._onchange).change(setup._onchange);

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
                if($this.is($options.selector+"-open")) {
                  if(!$this.is($options.selector+"-hover")) methods.close();
                  else $this.find("input").focus();
                }
              });
            },

            value: function() {
              var value = $("<a href='#'><span/></a>").appendTo($this);
              $select.appendTo($this);

              value.click(function(e) { e.preventDefault(); })
                    .focus(function() { $this.addClass($options.csclass+"-focus"); })
                    .blur(function() { $this.removeClass($options.csclass+"-focus"); });

              var txt   = $select.find("option:selected").text();
              value.find("span").html(txt.length > 0 ? txt : $options.emptytext);

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
                    val       = $this.find("ul li.active.option-hover").data("value");
                    disabled  = $this.find("ul li.active.option-hover").is(".option-disabled");
                    methods.select(val, disabled);
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
                var val       = $(this).attr("value");
                var txt       = $(this).text();
                var disabled  = $(this).is(":disabled");
                if(($options.showblank || val.length > 0) && ($options.showdisabled || !disabled)){
                  $("<li/>", {
                    'class':      'active'
                                    + (i==0 ? ' option-hover' : '')
                                    + ($(this).is(":disabled") ? ' option-disabled' : ''),
                    'data-value': val,
                    'text':       txt.length > 0 ? txt : $options.emptytext
                  }).appendTo(select);
                }
              });
              var options = select.find("li");
              select.find("li").click(function() {
                methods.select($(this).data("value"), $(this).is(".option-disabled"));
              });

              $this.find("div div").css({
                "overflow-y": options.length > $options.numitems ? "scroll" : "visible"
              });

              $("<li/>", {
                'class':  'no-results',
                'text':   "No results"
              }).appendTo(select);
            },

            // Catch select change event and apply to customselect
            _onchange: function() {
              $select.val($(this).val());
              methods.select($(this).val());
            }
          };

          if($select.is("select"+$options.selector) && !$select.data("cs-options")) {
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
            methods._selectMove($select.get(0).selectedIndex)
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

          $this.find("a").focus();
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
            if($(this).text().toLowerCase().indexOf(value.toLowerCase()) == 0) {
              index.push(i);
            }
          });

          if(index.length > 0) {
            methods._selectMove(index[0]);
          }
        },

        // Select Option
        select: function(value, disabled) {
          if(!disabled) {
            if($select.val() != value) {
              $select.val(value).change();
            }
            var txt = $select.find("option:selected").text();
            $this.find("a span").text(txt.length > 0 ? txt : $options.emptytext);
            methods.close();
          }
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

        // Destroy customselect instance
        destroy: function() {
          if($select.data("cs-options")) {
            $select.removeData("cs-options").insertAfter($this);
            $this.remove();
          }
        },

        // Move Selection to Index
        _selectMove: function(index) {
          var options   = $this.find("ul li.active");
          options.removeClass("option-hover").eq(index).addClass("option-hover");

          var scroll = $this.find("div div");
          if(scroll.css("overflow-y") == "scroll") {
            scroll.scrollTop(0);

            var selected = options.eq(index);
            offset = selected.offset().top + selected.outerHeight() - scroll.offset().top - scroll.height();

            if(offset > 0) {
              scroll.scrollTop(offset);
            }
          }
        }
      };

      var call_method = method;

      // Check for Additional Options
      if(call_method && typeof call_method == "object") {
        call_method = "init";
        value       = null;
      }

      $options.selector = "."+$options.csclass;

      // Load Requested Method
      call_method = call_method ? call_method : "init";
      if(typeof methods[call_method] == "function") {
        methods[call_method].call(this, value);
      }

      if(call_method != "destroy") {
        $select.data("cs-options", $options);
      }
    });

    return this;
  };
})(jQuery);