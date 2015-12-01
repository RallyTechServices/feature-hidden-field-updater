(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.ui.combobox.HiddenDateFieldComboBox', {
        requires: [],
        extend: 'Rally.ui.combobox.FieldComboBox',
        alias: 'widget.tshiddendatefieldcombobox',
        config: {
            /**
             * @cfg {Boolean}
             * If true, creates a '-- No Entry --' option in the combobox, with a value of null.
             */
            allowNoEntry: true,

            /**
             * @cfg {String}
             * Text to use for the '-- No Entry --' option.
             */
            noEntryText: '-- No Entry --',

            /**
             * @cfg {String}
             * Value to use for the '-- No Entry --' option.
             */
            noEntryValue: null,

            /**
             * @cfg {Boolean}
             * If true, creates a '-- Clear --' option in the combobox, with a value of ''.
             * Useful if using the combobox as a filter.
             */
            allowClear: true,

            /**
             * @cfg {String}
             * Text to use for the '-- Clear --' option.
             */
            clearText: '-- Clear --'
        },
        constructor: function(config){
            this.mergeConfig(config);
            this.callParent([this.config]);
        },

        _isNotHidden: function(field) {
            //We only want date field types that are writable and also we want to include hidden fields
            if (!field || (field && !field.readOnly && field.attributeDefinition &&
                field.attributeDefinition.AttributeType === 'DATE')){
                return true;
            }
            return false;

        }
    });
})();