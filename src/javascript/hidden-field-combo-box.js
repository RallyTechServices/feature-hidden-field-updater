(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.ui.combobox.HiddenDateFieldComboBox', {
        requires: [],
        extend: 'Rally.ui.combobox.FieldComboBox',
        alias: 'widget.tshiddendatefieldcombobox',

        _isNotHidden: function(field) {
            //We only want date field types that are writable and also we want to include hidden fields
            if (field && !field.readOnly && field.attributeDefinition &&
                field.attributeDefinition.AttributeType === 'DATE'){
                return true;
            }
            return false;

        }
    });
})();