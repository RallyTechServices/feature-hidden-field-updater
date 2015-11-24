Ext.define('Rally.technicalservices.Settings',{
    singleton: true,

    getFields: function(modelName){
        var labelWidth = 150;
        //todo make fields writable date fields only and show hidden fields

        return [{
            xtype: 'tshiddendatefieldcombobox',
            name: 'hiddenStartDateField',
            model: modelName,
            labelWidth: labelWidth,
            labelAlign: 'right',
            fieldLabel: 'Set Start Date Field'
        },{
            xtype: 'tshiddendatefieldcombobox',
            name: 'hiddenPlannedDateField',
            labelWidth: labelWidth,
            model: modelName,
            labelAlign: 'right',
            fieldLabel: 'Update Planned Date Field'
        },{
            xtype: 'tshiddendatefieldcombobox',
            name: 'hiddenDeployDateField',
            labelWidth: labelWidth,
            model: modelName,
            labelAlign: 'right',
            fieldLabel: 'Update Deploy Date Field'
        }];
    }
});
