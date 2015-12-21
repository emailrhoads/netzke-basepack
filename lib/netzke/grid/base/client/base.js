{
  multiSelect: true,

  initComponent: function(){
    // if we are being created by the locking feature - everything is configured already, nothing to do
    if (this.isLocked) return this.callParent();

    this.plugins = this.plugins || [];

    // Enable filters feature
    this.plugins.push('gridfilters');

    // Normalize columns. Extract data fields and meta column.
    this.netzkeProcessColumns();

    // Prepare column model config with columns in the correct order; columns out of order go to the end.
    var colModelConfig = [];
    var columns = this.columns;

    Ext.each(this.columnsOrder, function(c) {
      var mainColConfig;
      Ext.each(this.columns.items, function(oc) {
        if (c.name === oc.name) {
          mainColConfig = Ext.apply({}, oc);
          return false;
        }
      });

      colModelConfig.push(Ext.apply(mainColConfig, c));
    }, this);

    this.columns.items = colModelConfig;

    this.store = this.netzkeBuildStore();

    // Cell editing
    if (!this.prohibitUpdate && this.editInline) {
      this.plugins.push(Ext.create('Ext.grid.plugin.CellEditing', {pluginId: 'celleditor'}));
    }

    // Toolbar
    this.dockedItems = this.dockedItems || [];
    if (this.paging) {
      this.dockedItems.push({
        xtype: 'pagingtoolbar',
        dock: 'bottom',
        listeners: {
          'beforechange': this.disableDirtyPageWarning ? {} : {fn: this.netzkeBeforePageChange, scope: this}
        },
        store: this.store,
        items: this.bbar && ["-"].concat(this.bbar)
      });
    } else if (this.bbar) {
      this.dockedItems.push({
        xtype: 'toolbar',
        dock: 'bottom',
        items: this.bbar
      });
    }

    delete this.bbar;

    this.callParent();

    // Context menu
    if (this.contextMenu) {
      this.on('itemcontextmenu', this.handleItemContextMenu, this);
    }

    this.netzkeSetActionEvents();

    // When starting editing as assocition column, pre-load the combobox store from the meta column, so that we don't see the real value of this cell (the id of the associated record), but rather the associated record by the configured method.
    this.on('beforeedit', function(editor, e){
      if (e.column.assoc && e.record.get('meta') && e.column.getEditor()) {
        var c = e.column,
        combo = c.getEditor(),
        store = combo.store,
        id = e.record.get(e.field);

        // initial load of 1 single record for the combobox store, which contains the display text (stored in the meta field) for the current value
        if (id && -1 == store.find('value', id)) {
          store.loadData([[e.record.get(e.field), e.record.get('meta').associationValues[e.field]]], true);
        }

      }
    }, this);

    this.on('afterlayout', function() {
      // Persistence-related events (afterrender to avoid blank event firing on render)
      if (this.persistence) {
        // Inform the server part about column operations
        this.on('columnresize', this.netzkeSaveColumns, this);
        this.on('columnmove', this.netzkeSaveColumns, this);
        this.on('columnhide', this.netzkeSaveColumns, this);
        this.on('columnshow', this.netzkeSaveColumns, this);
      }
    }, this);

    if(this.getStore().autoSync){
      // if autoSync is enabled, cancel event and call handleApply() instead
      this.getStore().on('beforesync', function(){
        this.handleApply();
        return false;
      }, this);
    }

    // If edit in form is enabled, but edit in cell is disabled, change double-click to edit in form
    if (!this.editInline) {
      this.on('itemdblclick', function(view, record) {
        this.doEditInForm(record);
      }, this);
    }

    // Remember grid selection on reloads
    if(this.netzkeRememberSelection && this.netzkeRestoreSelection){
      this.getStore().on('beforeload', this.netzkeRememberSelection, this);
      this.getView().on('refresh', this.netzkeRestoreSelection, this);
    }
  },

  netzkeBuildStore: function() {
    var store = Ext.create('Ext.data.Store', this.netzkeStoreConfig());

    delete this.dataStore;

    store.getProxy().getReader().on('endpointcommands', function(commands) {
      this.netzkeBulkExecute(commands);
    }, this);

    return store;
  },

  netzkeStoreConfig: function(){
    var defaults = {
      proxy: this.netzkeBuildProxy(),
      fields: this.fields,
      pruneModifiedRecords: true,
      remoteSort: true,
      remoteFilter: true,
      buffered: !this.paging
    };

    if (!this.paging) defaults.pageSize = 300;

    return Ext.apply({}, this.storeConfig, defaults);
  },

  netzkeBuildProxy: function() {
    return Ext.create('Netzke.Basepack.Grid.Proxy', this.netzkeProxyConfig());
  },

  netzkeProxyConfig: function(){
    return {
      reader: this.netzkeBuildReader(),
      grid: this
    }
  },

  netzkeBuildReader: function() {
    return Ext.create('Netzke.Basepack.Grid.ArrayReader');
  },

  netzkeBeforePageChange: function(){
    var store = this.getStore();
    if (store.getNewRecords().length > 0 || store.getModifiedRecords().length > 0) {
      return confirm(this.i18n.proceedWithUnappliedChanges);
    }
  }
}