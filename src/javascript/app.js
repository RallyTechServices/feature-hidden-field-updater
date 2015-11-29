Ext.define("feature-hidden-field-updater", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            hiddenStartDateField: '',
            stateDateFields: {}
        }
    },
    items: [
        {xtype:'container',itemId:'selector_box', layout: {type: 'hbox'}},
        {xtype:'container',itemId:'display_box'}
    ],
    featureFetch: ['ObjectID','FormattedID','Name'],
    portfolioItemModelName: 'PortfolioItem/Feature',
    portfolioItemModel: null,
    portfolioItemStates: undefined,

    launch: function() {
        this._fetchLowestPortfolioItemModel().then({
            scope: this,
            success: function(modelName){
                this.portfolioItemModelName = modelName;
                Rally.data.ModelFactory.getModel({
                    type: modelName,
                    success: function(model) {
                        this.portfolioItemModel = model;
                        this._fetchStates(model).then({
                            success: function(states){
                                this.portfolioItemStates = states;
                                this._addReleaseSelector();
                            },
                            failure: function(msg){
                                Rally.ui.notify.Notifier.showError({message: "Failed to retrieve Portfolio Item States: " + msg});
                            },
                            scope: this

                        });
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
    _fetchStates: function(model){
        var deferred = Ext.create('Deft.Deferred');
        model.getField('State').getAllowedValueStore().load({
            callback: function(records, operation, success) {
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject(operation && operation.error && operation.error.errors.join(','));
                }
            }
        });
        return deferred;
    },
    _validateSettings: function(){
        this.logger.log('_validateSettings', this.getHiddenStartDateField(), this.getStateDateFieldMapping());

        if (Ext.Object.isEmpty(this.getStateDateFieldMapping()) && this.getHiddenStartDateField().length === 0){
            return false;
        }
        return true;
    },
    _addReleaseSelector: function(){

        if (!this._validateSettings()){
            this.down('#selector_box').add({
                xtype: 'container',
                html: "Please use the app settings to configure a Start Date field and/or State Field Mappings."
            });
            return;
        }

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
    _getReleaseFilters: function(){
        var cb = this.down('rallyreleasecombobox');

        return Rally.data.wsapi.Filter.or(_.map(cb.getValue(), function(releaseName){ return {property: 'Release.Name', value: releaseName}; }));
    },
    _fetchReleaseFeatures: function(cb){
        this.logger.log('_fetchReleaseFeatures', cb.getValue(),_.values(this.getStateDateFieldMapping()));

        var filters = this._getReleaseFilters(),
            fields = this.featureFetch.concat([this.getHiddenStartDateField()]).concat(_.values(this.getStateDateFieldMapping()));

        this.logger.log('fetch', fields);
        var store = Ext.create('Rally.data.wsapi.Store', {
            model: this.portfolioItemModelName,
            fetch: fields,
            filters: filters
        });
        this._createFeatureGrid(store);
    },
    getHiddenStartDateField: function(){
        return this.getSetting('hiddenStartDateField');
    },
    getStateDateFieldMapping: function(){
        var setting = this.getSetting('stateDateFields');
        if (Ext.isString(setting)){
            setting = Ext.JSON.decode(setting);
        }
        return setting || {};
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

        if (!Ext.Object.isEmpty(this.getStateDateFieldMapping())){
            items.push({
                xtype: 'rallyrecordmenuitembulkupdatetransitiondates',
                stateDateFields: this.getStateDateFieldMapping(),
                states: this.portfolioItemStates
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
            },
            plugins: [{
                ptype: 'tsgridcustomfiltercontrol',
                headerContainer: this.down('#selector_box'),
                modelNames: [this.portfolioItemModelName],
                permanentFilters: this._getReleaseFilters()
            }]
        });
    },
    _getHiddenFields: function(){
        var hiddenFields = [];

        if (this.getHiddenStartDateField()){
            hiddenFields.push(this.getHiddenStartDateField());
        }
        _.each(this.getStateDateFieldMapping(), function(field, state){
            hiddenFields.push(field);
        });
        return hiddenFields;
    },
    _getColumnCfgs: function(){
        var cols = [],
            hiddenFields = this._getHiddenFields(),
            fields = this.featureFetch.concat(hiddenFields);

         _.each(fields, function(f){
             if (f != 'ObjectID'){
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
             }
            }, this);
        return cols;

    },
    getSettingsFields: function(){
        return Rally.technicalservices.Settings.getFields(this.portfolioItemModelName, this.portfolioItemStates);
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
        this._addReleaseSelector();
    }
});
