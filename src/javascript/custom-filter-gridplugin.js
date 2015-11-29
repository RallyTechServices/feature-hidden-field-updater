(function () {
    var Ext = window.Ext4 || window.Ext;

    /**
     * Adds a Rally.ui.filter.CustomFilterControl component to a Rally.ui.gridboard.GridBoard.
     *
     * A full example of using this plugin is available in the [Examples](#!/example/filterable-grid-board) section.
     */
    Ext.define('Rally.technicalservices.GridCustomFilterControl', {
        alias: 'plugin.tsgridcustomfiltercontrol',
        extend:'Ext.AbstractPlugin',
        mixins: ['Rally.technicalservices.GridControlShowable'],
        requires: [
            'Rally.ui.filter.view.CustomFilterButton',
            'Rally.data.wsapi.filter.FilterModificationator',
            'Rally.ui.filter.view.OwnerFilter',
            'Rally.data.ModelTypes'
        ],
        headerPosition: 'left',

        /**
         * @cfg {Object}
         * Config for Rally.ui.filter.view.CustomFilterButton.
         */
        filterControlConfig: {},

        /**
         * @cfg {Boolean}
         * Whether owner filter should apply to children items
         */
        filterChildren: true,

        /**
         * @cfg {Boolean}
         * Whether to show the additional owner quick filter
         */
        showOwnerFilter: false,

        /**
         * @cfg {Object}
         * Additional configuration passed to the owner filter
         */
        ownerFilterControlConfig: {},

        containerConfig: {},

        init: function(cmp) {
            this.callParent(arguments);
            this.cmp = cmp;
            this.cmp.useFilterCollection = false;

            var control = this.showControl();

            this.filterButton = control.down('rallycustomfilterbutton');
            this.ownerFilter = control.down('rallyusersearchcombobox');

            this._onTypeChange(cmp, this.modelNames);
        },

        getControlCmpConfig: function() {
            var config = Ext.merge({
                xtype: 'container',
                width: 72,
                layout: 'hbox',
                items: [
                    Ext.merge({
                        xtype: 'rallycustomfilterbutton',
                        context: this.context,
                        listeners: {
                            customfilter: {
                                fn: this._onFilterButtonStateAvailable,
                                single: true,
                                scope: this
                            }
                        },
                        toolTipConfig: {
                            html: 'Filter',
                            anchor: 'top',
                            mouseOffset: [-9, -2]
                        },
                        margin: '3 9 3 30'
                    }, this.filterControlConfig)
                ]
            }, this.containerConfig);

            if (this.showOwnerFilter) {
                config.width += 210;

                config.items.push(Ext.merge({
                    xtype: 'rallyownerfilter',
                    margin: '3px 10px 0px 0px',
                    listConfig: {
                        width: 200
                    },
                    context: this.context,
                    width: 200,
                    clearFilterText: '-- Clear Filter --',
                    listeners: {
                        initalvalueset: {
                            fn: this._onOwnerFilterStateAvailable,
                            single: true
                        },
                        select: this._applyFilter,
                        scope: this
                    }
                }, this.ownerFilterControlConfig));
            }

            return config;
        },

        _onFilterButtonStateAvailable: function() {
            this._filterButtonStateAvailable = true;
            this.filterButton.on('customfilter', this._applyFilter, this);
            if(!this.showOwnerFilter || this._ownerFilterStateAvailable) {
                this._applyFilter();
            }
        },

        _onOwnerFilterStateAvailable: function() {
            this._ownerFilterStateAvailable = true;
            if(this._filterButtonStateAvailable) {
                this._applyFilter();
            }
        },

        _onTypeChange: function(cmp, types) {
            var modelNames = _.map(types, function (type) {
                return type.isModel ? type.get('TypePath') : type;
            });
            var typeNames = this._getTypesByNames(modelNames);

            this.filterButton.setModelNames(modelNames);
            this.filterButton.setTypes(typeNames);
            this.filterButton.setFilters([]);
            this.filterButton.indicateNoActiveFilterPresent();
            this.filterButton.saveState();
        },

        _applyFilter: function() {

              var filters = _.compact(Ext.Array.merge(this.filterButton.getFilters(), this.ownerFilter && this.ownerFilter.getFilter())),
                modifiedFilters = Rally.data.wsapi.filter.FilterModificationator.modifyFilters(filters, this.filterChildren),
                filterArgs = {
                    types: this.filterButton.getTypes(),
                    filters: modifiedFilters
                };
            this._applyFilters(filterArgs);
        },
        _applyFilters: function(filterObj){

            var permanentFilters = this.permanentFilters || [];

            var extraFilters = filterObj.filters || [];

            this.cmp.store.clearFilter(true);
            var filters =  _.compact(Ext.Array.merge(
                        permanentFilters,
                        extraFilters));

            this.cmp.store.filter(filters);
        },
        _getTypesByNames: function(modelNames) {
            return _.map(modelNames, function (modelName) {
                return Rally.data.ModelTypes.getTypeByName(modelName).toLowerCase();
            }, this);
        }
    });
})();