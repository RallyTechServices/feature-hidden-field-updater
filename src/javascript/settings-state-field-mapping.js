Ext.define('Rally.technicalservices.settings.StateFieldMapping',{
    extend: 'Ext.form.field.Base',
    alias: 'widget.tsstatefieldmappingsettings',
    config: {
        value: undefined,
        states: undefined,
        model: undefined,
        decodedValue: {}
    },
    fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

    width: 400,
    cls: 'column-settings',

    onDestroy: function() {
        if (this._grid) {
            this._grid.destroy();
            delete this._grid;
        }
        this.callParent(arguments);
    },

    onRender: function() {
        var decodedValue = {};
        if (this.value && !_.isEmpty(this.value)){
            decodedValue = Ext.JSON.decode(this.value);
        }
        this.callParent(arguments);

        var data = [];

        _.each(this.states, function(s){
            var field = null,
                stateName = s.get('StringValue');

            if (stateName && stateName.length > 0){
                if (decodedValue[stateName]){
                    field = decodedValue[stateName];
                }
                data.push({state: stateName, field: field});
            }
        }, this);

        this._store = Ext.create('Ext.data.Store', {
            fields: ['state', 'field'],
            data: data
        });

        this._grid = Ext.create('Rally.ui.grid.Grid', {
            autoWidth: true,
            renderTo: this.inputEl,
            columnCfgs: this._getColumnCfgs(),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            store: this._store,
            width: this.getWidth() * 0.90,
            editingConfig: {
                publishMessages: false
            }
        });
        this.fireEvent('ready');
    },
    _getColumnCfgs: function() {
         var columns = [
            {
                text: 'State',
                dataIndex: 'state',
                flex: 1
            },
            {
                text: 'Transition Date Field',
                dataIndex: 'field',
                flex: 1,
                editor: {
                    xtype: 'tshiddendatefieldcombobox',
                    model: this.model
                }
            }];
        return columns;
    },
    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};
        data[this.name] = Ext.JSON.encode(this._buildSettingValue());
        return data;
    },
    _buildSettingValue: function() {
        var mappings = {};
        this._store.each(function(record) {
            if (record.get('state') && record.get('field')) {
                mappings[record.get('state')] = record.get('field');
            }
        }, this);
        return mappings;
    },

    getErrors: function() {
        var errors = [];
        //todo validate they aren't using the same field for multiple states
        return errors;
    },
    validate : function() {
        var me = this,
            isValid = me.isValid();
        if (isValid !== me.wasValid) {
            me.wasValid = isValid;
            me.fireEvent('validitychange', me, isValid);
        }
        if (!isValid){
            var html = this.getErrors().join('<br/>');
            Ext.create('Rally.ui.tooltip.ToolTip', {
                target : this.getEl(),
                html: '<div class="tsinvalid">' + html + '</div>',
                autoShow: true,
                anchor: 'bottom',
                destroyAfterHide: true
            });

        }

        return isValid;
    },
    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    }
});