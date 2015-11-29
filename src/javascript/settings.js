Ext.define('Rally.technicalservices.Settings',{
    singleton: true,

    getFields: function(modelName, states){
        var labelWidth = 150;

        return [{
            xtype: 'tshiddendatefieldcombobox',
            name: 'hiddenStartDateField',
            model: modelName,
            labelWidth: labelWidth,
            labelAlign: 'right',
            fieldLabel: 'Set Start Date Field',
            readyEvent: 'ready'
        },{
            xtype: 'tsstatefieldmappingsettings',
            states: states,
            model: modelName,
            name: 'stateDateFields',
            readyEvent: 'ready',
            fieldLabel: 'State Transition Date Field Mapping',
            margin: 15,
            labelAlign: 'top'
        }];
    }
});
