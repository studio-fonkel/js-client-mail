(function( $ ) {
    // SETTINGS:
    var pluginName = "jsClientMail",
        defaults = {
            api: '',
            labelAttribute: 'data-name',
            submitSelector: 'input[type="submit"]',
            success: function () {
                $('body').removeClass('js-client-mail-waiting');
                $('body').addClass('js-client-mail-success');
                console.log('Message sent!');
            },
            wait: function () {
                $('body').removeClass('js-client-mail-error');
                $('body').removeClass('js-client-mail-success');
                $('body').addClass('js-client-mail-waiting');
            },
            error: function (errors) {
                $('body').removeClass('js-client-mail-waiting');
                $('body').addClass('js-client-mail-error');
                if (errors.length > 1) {
                    console.log(errors.length + ' messages could not be sent, reasons: ' + errors);
                } else {
                    console.log(errors.length + ' message could not be sent, reason: ' + errors);
                }
            },
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options);
        this.temp = {
            errors: [],
            total: 0
        };

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {
        init: function() {
            var that = this;

            // Skip init if the parent is not a form.
            if ($(this.element)[0].nodeName != 'FORM') {
                console.log(pluginName + ' can not handle ' + $(this.element)[0].nodeName + '. Use a FORM instead.');
                return false;
            }

            $(this.element).submit(function (e) {
                e.preventDefault();
                // reset errors:
                that.temp.errors = [];
                that.waitingHandler();

                var values = that.parseValues();

                that.callApi(values.valuesOrdered);

                return false;
            })
        },

        callApi: function (values) {
            var that = this

            $.ajax({
                type: "POST",
                url: that.options.api,
                data: JSON.stringify(values),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                headers: {
                    "Content-Type": "application/json"
                },
                success: function(success){
                    that.successHandler('success');
                },
                error: function(error) {
                    that.successHandler('error', error);
                }
            });
        },

        waitingHandler: function () {
            var that = this;
            $(that.element).find(that.options.submitSelector).prop('disabled', true);
            that.options.wait();
        },
        successHandler: function (status, response) {
            var that = this;
            if (status == 'error') {
                that.temp.errors.push(response.message);
            }

            that.temp.total -= 1;

            if (that.temp.total == 0) {
                if (that.temp.errors.length > 0) {
                    that.options.error(that.temp.errors);
                    $(that.element).find(that.options.submitSelector).prop('disabled', false);
                } else {
                    that.options.success();
                }
            }
        },
        parseValues: function () {
            var that = this;

            var output = {
                valuesOrdered: [],
                valuesDirect: {}
            }
            var data = $(that.element).serializeArray();

            $.each(data, function (delta, formItem) {
                var input = $('[name="' + formItem.name + '"]');
                var label = input.attr(that.options.labelAttribute);
                var value = formItem.value;

                // Use name as label when no labelAttribute is present:
                if(label == undefined || label == '') {
                    label = formItem.name;
                }

                output.valuesOrdered.push({
                    'label': label,
                    'value': value
                });
                output.valuesDirect[formItem.name] = value; // Used because of direct referencing in settings.
            })

            return output;
        }
    }

    // jQuery plugin constructor
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin( this, options ));
            }
        });
    };

}( jQuery ));