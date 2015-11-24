Ext.define("feature-hidden-field-updater", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            hiddenStartDateField: 'c_BenchmarkDate',
            hiddenPlannedDateField: null,
            hiddenDeployDateField: null
        }
    },
    items: [
        {xtype:'container',itemId:'selector_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'}
    ],
    featureFetch: ['FormattedID','Name'],
    portfolioItemModelName: 'PortfolioItem/Feature',
    portfolioItemModel: null,

    launch: function() {
        this._fetchLowestPortfolioItemModel().then({
            scope: this,
            success: function(modelName){
                console.log('model',modelName);
                this.portfolioItemModelName = modelName;
                Rally.data.ModelFactory.getModel({
                    type: modelName,
                    success: function(model) {
                        this.portfolioItemModel = model;
                        this._addReleaseSelector();
                    },
                    failure: function(){
                        Rally.ui.notify.Notifier.showError({message: "Failed to retrieve model: " + modelName});
                    },
                    scope: this
                });
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: "Failed to fetch Portfolio Item Types: " + msg});
            }
        });

    },
    _addReleaseSelector: function(){
        this.down('#selector_box').removeAll();
        this.down('#selector_box').add({
            xtype: 'rallyreleasecombobox',
            minWidth: 400,
            multiSelect: true,
            valueField: 'Name',
            listeners: {
                change: this._fetchReleaseFeatures,
                scope: this
            }
        });
    },
    _fetchLowestPortfolioItemModel: function(){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',{
            model: 'TypeDefinition',
            fetch: ['TypePath'],
            autoLoad: true,
            filters: [{
                property: 'TypePath',
                operator: 'contains',
                value: 'PortfolioItem/'
            },{
                property: 'Ordinal',
                value: 0
            }]
        }).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(records[0].get('TypePath'));
                } else {
                    deferred.reject(operation.error.errors.join(','));
                }

            }
        });
        return deferred;
    },
    _fetchReleaseFeatures: function(cb){
        this.logger.log('_fetchReleaseFeatures', cb.getValue());

        var filters = Rally.data.wsapi.Filter.or(_.map(cb.getValue(), function(releaseName){ return {property: 'Release.Name', value: releaseName}; })),
            fields = this.featureFetch.concat([this.getSetting('hiddenStartDateField')]);

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: this.portfolioItemModelName,
            fetch: fields,
            filters: filters,
            limit: 'Infinity',
            listeners: {
                scope: this,
                load: function(records){
                    console.log('load records', records);
                }
            }

        });
        this._createFeatureGrid(store);

    },
    getHiddenStartDateField: function(){
        return this.getSetting('hiddenStartDateField');
    },
    getHiddenPlannedDateField: function(){
        return this.getSetting('hiddenPlannedDateField');
    },
    getHiddenDeployDateField: function(){
        return this.getSetting('hiddenDeployDateField')
    },
    getFieldDisplayName: function(f){
        return (this.portfolioItemModel.getField(f) && this.portfolioItemModel.getField(f).displayName) || f;
    },
    _getBulkConfigItems: function(){
        var items = [];

        if (this.getHiddenStartDateField()){
            items.push({
                xtype: 'rallyrecordmenuitembulksethiddendate' ,
                dateField: this.portfolioItemModel.getField(this.getHiddenStartDateField())
            });
        }

        if (this.getHiddenPlannedDateField() || this.getHiddenDeployDateField()){
            items.push({
                xtype: 'rallyrecordmenuitembulkupdatetransitiondates',
                plannedDateField: this.getHiddenPlannedDateField(),
                deployDateField: this.getHiddenDeployDateField()
            });
        }
        return items;
    },
    _createFeatureGrid: function(store){
        this.down('#display_box').removeAll();

        var bulkConfigItems = this._getBulkConfigItems();

        this.down('#display_box').add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: this._getColumnCfgs(),
            enableBulkEdit: true,
            bulkEditConfig: {
                items: bulkConfigItems
            }

        });
    },
    _getHiddenFields: function(){
        var hiddenFields = [];

        if (this.getHiddenStartDateField()){
            hiddenFields.push(this.getHiddenStartDateField());
        }
        if (this.getHiddenPlannedDateField()){
            hiddenFields.push(this.getHiddenPlannedDateField());
        }
        if (this.getHiddenDeployDateField()){
            hiddenFields.push(this.getHiddenDeployDateField());
        }
        return hiddenFields;
    },
    _getColumnCfgs: function(){
        var cols = [],
            hiddenFields = this._getHiddenFields(),
            fields = this.featureFetch.concat(hiddenFields);

         _.each(fields, function(f){
                var col = { dataIndex: f, text: f };
                if (Ext.Array.contains(hiddenFields, f)){
                    col.dataIndex = 'ObjectID';
                    col.text = this.getFieldDisplayName(f);
                    col.align = 'left';
                    col.renderer = function(v,m,r){
                        return Rally.util.DateTime.formatWithDefault(r.get(f));
                    }
                }
                cols.push(col);
            }, this);
        return cols;

    },
    getSettingsFields: function(){
        return Rally.technicalservices.Settings.getFields(this.portfolioItemModelName);
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    }
});
