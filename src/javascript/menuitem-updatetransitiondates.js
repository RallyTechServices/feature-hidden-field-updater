Ext.define('Rally.ui.menu.bulk.UpdateTransitionDates', {
    alias: 'widget.rallyrecordmenuitembulkupdatetransitiondates',
    extend: 'Rally.ui.menu.bulk.MenuItem',
    requires: ['Rally.ui.notify.Notifier'],

    config: {
        text: 'Update Transition Dates',
        stateHash: {
            "Done": "c_Done"
        },
        handler: function() {
            this._onBulkUpdateClicked();
        }
    },

        predicate: function(records) {
            return _.every(records, function(record) {
                return record.self.isArtifact() || record.self.isTimebox();
            });
        },

        saveRecords: function(records) {

            if (records.length === 0){
                this._showMessage([],[],'');
                return;
            }

            var promises = _.map(records, function(record){
                return this._saveRecord(record);
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
            if (unsuccessfulRecords.length > 0){
                Rally.ui.notify.Notifier.showError({
                    message: errorMessage
                });
            } else {
                Rally.ui.notify.Notifier.showWarning({
                    message: "No state transition data was found or updated for the selected record(s)."
                });
            }
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
        var deferred = Ext.create('Deft.Deferred'),
            objectIds = _.map(records, function(r){ return r.get('ObjectID'); });

        Ext.create('Rally.data.lookback.SnapshotStore',{
            fetch: ['ObjectID','State','_ValidFrom','_ValidTo',"_PreviousValues.State"],
            find: {
                ObjectID: {$in: objectIds}
            },
            hydrate: ['State',"_PreviousValues.State"],
            removeUnauthorizedSnapshots: true,
            compress: true,
            limit: 'Infinity',
            //sorters: [{
            //    property: '_ValidFrom',
            //    direction: 'ASC'
            //}]
        }).load({
            callback: function(snapshots, operation){
                var snapsByOid = this.aggregateSnapsByOidForModel(snapshots);
                var updatedRecords = this._updateTransitionFields(records, snapsByOid);
                deferred.resolve(updatedRecords);
            },
            scope: this
        });

        return deferred;
    },
    _updateTransitionFields: function(records, snapsByOid){
        var stateHash = this.stateDateFields,
        states = _.map(this.states, function(s){ return s.get('StringValue')}),
            updatedRecords = [];

        _.each(records, function(r){
            var snaps = snapsByOid[r.get('ObjectID')] || [],
                currentState = (r.get('State') && r.get('State').Name) || null,
                currentIdx = currentState ? _.indexOf(states, currentState) : -1;

                _.each(stateHash, function(field, state){
                    if (_.indexOf(states, state) <= currentIdx){  //only populate if the current state is greater\equal to the state
                        _.each(snaps, function(snap){

                            if (snap.State === state && snap["_PreviousValues.State"]!== "" && snap["_PreviousValues.State"] !== state){
                                var transitionDate = snap._ValidFrom;
                                r.set(field, transitionDate);
                                updatedRecords.push(r);
                            }
                        });
                    }
                });
        });
        return updatedRecords;
    },
    aggregateSnapsByOidForModel: function(snaps){
        //Return a hash of objects (key=ObjectID) with all snapshots for the object
        var snaps_by_oid = {};
        Ext.each(snaps, function(snap){
            var oid = snap.ObjectID || snap.get('ObjectID');
            if (snaps_by_oid[oid] == undefined){
                snaps_by_oid[oid] = [];
            }
            snaps_by_oid[oid].push(snap.getData());

        });
        return snaps_by_oid;
    },
    /**
     * @override
     * @inheritdoc
     */
    onSuccess: function (successfulRecords, unsuccessfulRecords, errorMessage) {
        var me = this;
        var message = successfulRecords.length + (successfulRecords.length === 1 ? ' item has been updated.' : ' items have been updated.');

        if(successfulRecords.length === this.records.length) {
            Rally.ui.notify.Notifier.show({
                message: message + '.'
            });
        } else {
            if (errorMessage){
                errorMessage = " there was an error: " + errorMessage;
            } else {
                errorMessage = " there was no transition data for the configured States."
            }
            Rally.ui.notify.Notifier.showWarning({
                message: message + ', and ' + unsuccessfulRecords.length + ' were not updated because ' + errorMessage
            });
        }
        Ext.callback(me.onActionComplete, null, [[], []]);
       // Ext.callback(me.onActionComplete, null, [successfulRecords, unsuccessfulRecords]);
    }
});
