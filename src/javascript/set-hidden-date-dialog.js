    Ext.define('Rally.technicalservices.dialog.SetDateDialog', {
        extend: 'Rally.ui.dialog.Dialog',
        alias: 'widget.tssetdatedialog',

        autoShow: true,
        cls: 'bulk-edit-dialog',
        closable: true,
        draggable: true,
        title: 'Set Planned Date',
        width: 375,

        config: {
            /**
             * @cfg {[Rally.data.Model]} records (required)
             * The records to bulk edit
             */
            records: null
        },

        initComponent: function() {
            this.callParent(arguments);

            this.addEvents(
                /**
                 * @param Rally.ui.dialog.BulkEditDialog the dialog
                 * @param Rally.data.wsapi.Field field the field being edited
                 * @param {String|Number} the new value
                 */
                'edit'
            );

            this.add(
                {
                    xtype: 'component',
                    cls: 'directions rui-info-label',
                    renderTpl: Ext.create('Ext.XTemplate',
                        'For the <tpl><b>{[values.recordCount]}</b></tpl> checked ',
                        '<tpl if="recordCount === 1">item<tpl else>items</tpl> apply the following dates:'
                    ),
                    renderData: {
                        recordCount: this.records.length
                    }
                },
                {
                    xtype: 'container',
                    itemId: 'form-container',
                    cls: 'form-container',
                    items: [
                        {
                            xtype: 'rallydatefield',
                            autoExpand: true,
                            itemId: 'dateField',
                            defaultSelectionPosition: null,
                            emptyText: 'Select date...',
                            listeners: {
                                select: function(cmp) {
                                    this.down('#applyButton').setDisabled(false);
                                },
                                scope: this
                            }
                        }
                    ]
                }
            );

            this.addDocked({
                xtype: 'toolbar',
                dock: 'bottom',
                padding: '0 0 10 0',
                layout: {
                    type: 'hbox',
                    pack: 'center'
                },
                ui: 'footer',
                items: [
                    {
                        xtype: 'rallybutton',
                        itemId: 'applyButton',
                        text: 'Apply',
                        cls: 'primary rly-small',
                        disabled: true,
                        handler:  this._onApplyClicked,
                        scope: this
                    },
                    {
                        xtype: 'rallybutton',
                        text: 'Cancel',
                        cls: 'secondary rly-small',
                        handler: function() {
                            this.close();
                        },
                        scope: this
                    }
                ]
            });
        },

        afterRender: function() {
            this.callParent(arguments);
            this.down('#dateField').focus(false, 150);
        },

        _onApplyClicked: function() {
            var val = Rally.util.DateTime.toIsoString(this.down('#dateField').getValue());
            var args = {
                field: this.dateField,
                displayName: this.dateField.displayName,
                value: val
            };
            this.fireEvent('edit', this, args);
            this.close();
        }
    });
