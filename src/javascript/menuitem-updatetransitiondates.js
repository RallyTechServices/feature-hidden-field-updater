Ext.define('Rally.ui.menu.bulk.UpdateTransitionDates', {
    alias: 'widget.rallyrecordmenuitembulkupdatetransitiondates',
    extend: 'Rally.ui.menu.bulk.MenuItem',
    requires: ['Rally.ui.notify.Notifier'],

    config: {
        text: 'Update Transition Dates',
        handler: function() {
            this._onBulkUpdateClicked();
        },
        predicate: function(records) {
            return _.every(records, function(record) {
                return record.self.isArtifact() || record.self.isTimebox();
            });
        },

        saveRecords: function(records, originalRecords) {

            var promises = _.map(records, function(record){
                return this._saveRecord(record, args);
            }, this);

            Deft.Promise.all(promises).then({
                scope: this,
                success: function(results){
                    var errorMessage = null,
                        successfulRecords = [];

                    _.each(results, function(r){
                        if (r.result){
                            successfulRecords.push(r);
                        } else {
                            errorMessage = r.errorMessage;
                        }
                        this._showMessage(records, successfulRecords, errorMessage);
                    }, this);
                }
            });


        }
    },
    _saveRecord: function(record){
        var deferred = Ext.create('Deft.Deferred');

        record.save({
            callback: function(result, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve({result: result, errorMessage: null});
                } else {
                    deferred.resolve({result: null, errorMessage: operation.error.errors.join(',')});
                }
            }
        });
        return deferred;
    },
    _showMessage: function(records, successfulRecords, errorMessage) {
        var me = this;

        var unsuccessfulRecords = _.difference(records, successfulRecords);
        if(successfulRecords.length) {
            me.onSuccess(successfulRecords, unsuccessfulRecords, errorMessage);
        } else {
            Rally.ui.notify.Notifier.showError({
                message: resultSet.message
            });
            Ext.callback(me.onActionComplete, null, [successfulRecords, unsuccessfulRecords]);
        }

    },
    _onBulkUpdateClicked: function() {
        if (this.onBeforeAction(this.records) === false) {
            return;
        }
        var me = this;
        this._fetchTransitionDates(this.records).then({
            success: function(updatedRecords){
                me.saveRecords(updatedRecords, me.records);
            }
        });
    },
    _fetchTransitionDates: function(records){

    },
    /**
     * @override
     * @inheritdoc
     */
    onSuccess: function (successfulRecords, unsuccessfulRecords, errorMessage) {

        var message = successfulRecords.length + (successfulRecords.length === 1 ? ' item has been updated.' : ' items have been updated.');

        if(successfulRecords.length === this.records.length) {
            Rally.ui.notify.Notifier.show({
                message: message + '.'
            });
        } else {
            Rally.ui.notify.Notifier.showWarning({
                message: message + ', but ' + unsuccessfulRecords.length + ' failed: ' + errorMessage
            });
        }
        Ext.callback(me.onActionComplete, null, [successfulRecords, unsuccessfulRecords]);
    }
});
