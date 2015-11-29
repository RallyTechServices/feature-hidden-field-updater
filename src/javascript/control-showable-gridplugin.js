(function () {
    var Ext = window.Ext4 || window.Ext;

    /**
     * @private
     * Mixin to show or hide a control widget based on the toggle state of a GridBoard.
     */
    Ext.define('Rally.technicalservices.GridControlShowable', {
        /**
         * @cfg {String}
         * header position to add control to (left|right)
         */
        headerPosition: 'left',

        /**
         * Override to configure control component to add to GridBoard.
         *
         * @template
         * @return {Object|Ext.Component|false} return component config or component to add to control header or return false to add nothing.
         */
        getControlCmpConfig: function() {
            return false;
        },

        /**
         * Override to configure where the control component should be inserted in the control header
         *
         * @template
         * @return {Number|false} return insert position of control component or return false to add control in order.
         */
        getControlInsertPosition: function() {
            return false;
        },

        /**
         * Returns the control component;
         *
         * @returns {Ext.Component}
         */
        getControlCmp: function() {
            return this.controlCmp;
        },

        /**
         * Initializes and shows the control component in the header.
         */
        showControl: function() {
            if (!this.controlCmp) {
                this._createControlCmp();
            }

            if (this.controlCmp) {
                this.controlCmp.show();
            }

            return this.controlCmp;
        },

        _getControlCt: function() {
            return this.headerContainer;
        },

        _createControlCmp: function() {
            var controlCmpConfig = this.getControlCmpConfig();

            if (controlCmpConfig) {
                if (!Ext.isFunction(controlCmpConfig.hide)) {
                    controlCmpConfig.hidden = true;
                    controlCmpConfig.style = Ext.merge({'float': this.headerPosition}, controlCmpConfig.style);
                }

                if (this._getControlCt().down(controlCmpConfig.xtype)){
                    this._getControlCt().down(controlCmpConfig.xtype).destroy();
                }
                this.controlCmp = this._getControlCt().add(controlCmpConfig);

            }
        }
    });
})();