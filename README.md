#Feature Hidden Field Updater

The purpose of this highly customized app is to update hidden (or visible) fields on the lowest level portfolio item model.  
The goal is to be able to set fields with a date that is not editable in the feature details page (the way that is controlled is by making the fields "hidden").  
The dates in the hidden fields are intended for exporting purposes to a third party analysis tool.  

This app is a grid that contains 2 new bulk actions on the gear menu (this means that the items must be selected in order to see the menu items on the gear menu):

######*Set Start Date...*  
This allows the user to set a date in a hidden custom date field.  The purpose is to be able to use this to set the planned date for the feature.  

######*Update Transition Dates*
This menu item updates any number of date custom fields with the date that the item last transitioned into the mapped state.  
* If the item has not yet reached the mapped state (but did transition into it in the past), the custom date field will not be populated for that state.  
* If an item has transitioned into the state multiple times, the date populated will be the latest date that the item has transitioned into the state.  

![ScreenShot](/images/feature-hidden-field-updater.png)
      
The custom date fields that are populated can be configured in the App Settings:  
      
![ScreenShot](/images/feature-hidden-field-updater-app-settings.png)

If no fields are mapped for the feature states, then the "Update Transition Fields" menu item will not be available during a bulk update.  
