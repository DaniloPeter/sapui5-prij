sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
  ],
  (Controller, Filter, FilterOperator, JSONModel) => {
    "use strict";

    return Controller.extend("ui5.test.controller.DataList", {
      onInit() {
        const oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.subscribe(
          "DataList",
          "applyFilter",
          this.onApplyFilter,
          this
        );
        oEventBus.subscribe("DataList", "exportData", this.onExportData, this);
        const oColumnVisibilityModel = new JSONModel({
          taskName: true,
          taskType: true,
          responsible: true,
          startDate: true,
          endDate: true,
        });
        oEventBus.subscribe(
          "App",
          "toggleEditMode",
          this.onToggleEditMode,
          this
        );
        const oList = this.byId("dataList"); // Получаем таблицу
        const aItems = oList.getItems(); // Получаем все элементы в таблице

        const oLocalModel = new JSONModel({ editMode: false });
        this.getView().setModel(oLocalModel, "local");

        this._applyStringEdit(false);
        this._updateSettingsButtonState(false);
        this._updateAddDataButtonState(false);
        this.getView().setModel(oColumnVisibilityModel, "columnVisibility");
      },

      getI18n(key) {
        const oI18nModel = this.getOwnerComponent().getModel("i18n");
        return oI18nModel.getResourceBundle().getText(key);
      },
      onDateChange(oEvent) {
        this._formatDateInput(oEvent);
      },
      _formatDateInput(oEvent) {
        const inputField = oEvent.getSource();
        let value = inputField.getValue();

        value = value.replace(/[^\d.]/g, ""); // Remove non-digit characters

        // Add format logic
        if (value.length >= 2 && value.length < 3) {
          value = value.slice(0, 2) + ".";
        }
        if (value.length >= 5 && value.length < 6) {
          value = value.slice(0, 5) + ".";
        }
        if (value.length >= 10) {
          value = value.slice(0, 10);
        }

        inputField.setValue(value);

        // Validate date
        this._validateDate(value, inputField);
      },
      _validateDate(value, inputField) {
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/; // DD.MM.YYYY format
        if (value && !datePattern.test(value)) {
          inputField.setValueState(sap.ui.core.ValueState.Error);
          inputField.setValueStateText(
            "Некорректный формат даты. Используйте ДД.ММ.ГГГГ."
          );
          return;
        }

        if (value) {
          const [day, month, year] = value.split(".").map(Number);

          // Validate month and day
          if (month < 1 || month > 12) {
            inputField.setValueState(sap.ui.core.ValueState.Error);
            inputField.setValueStateText("Месяц должен быть от 1 до 12.");
            return;
          }

          if (day < 1 || day > 31) {
            inputField.setValueState(sap.ui.core.ValueState.Error);
            inputField.setValueStateText("День должен быть от 1 до 31.");
            return;
          }

          // If validation passes
          inputField.setValueState(sap.ui.core.ValueState.None);
        }
      },
      onToggleEditMode(sChannel, sEvent, oData) {
        const isEditMode = oData.editMode;
        this._updateSettingsButtonState(isEditMode);
        this._updateAddDataButtonState(isEditMode);
        this._applyStringEdit(isEditMode);

        if (isEditMode) {
          const oColumnVisibilityModel =
            this.getView().getModel("columnVisibility");
          oColumnVisibilityModel.setData({
            taskName: true,
            taskType: true,
            responsible: true,
            startDate: true,
            endDate: true,
          });
        }

        this._applyColumnVisibility();
      },
      _applyColumnVisibility() {
        const oColumnVisibilityModel =
          this.getView().getModel("columnVisibility");
        const aColumns = [
          {
            name: "taskName",
            visible: oColumnVisibilityModel.getProperty("/taskName"),
          },
          {
            name: "taskType",
            visible: oColumnVisibilityModel.getProperty("/taskType"),
          },
          {
            name: "responsible",
            visible: oColumnVisibilityModel.getProperty("/responsible"),
          },
          {
            name: "startDate",
            visible: oColumnVisibilityModel.getProperty("/startDate"),
          },
          {
            name: "endDate",
            visible: oColumnVisibilityModel.getProperty("/endDate"),
          },
        ];

        const oList = this.byId("dataList");
        const aTableColumns = oList.getColumns();

        aColumns.forEach((col) => {
          const oColumn = aTableColumns.find(
            (c) => c.getHeader().getText() === this.getI18n(col.name)
          );
          if (oColumn) {
            oColumn.setVisible(col.visible);
          }
        });
      },

      async onSettings() {
        console.log("async"),
          (this.oDialog ??= await this.loadFragment({
            name: "ui5.test.view.SettingsDialog",
          }));

        console.log("before open"), this.oDialog.open();
      },
      _applyStringEdit(isEditMode) {
        const oList = this.byId("dataList"); // Get the table
        const aItems = oList.getItems(); // Get all items in the table
        aItems.forEach((item) => {
          const inputCells = item.getCells(); // Get all cells in the item

          // Assuming the order is: taskName, taskType, responsible (HBox), startDate, endDate
          const taskNameCell = inputCells[0]; // Task Name
          const taskTypeCell = inputCells[1]; // Task Type
          const responsibleHBox = inputCells[2]; // HBox for Responsible
          const responsibleInput = responsibleHBox.getItems()[0]; // Input in HBox
          const responsibleButton = responsibleHBox.getItems()[1]; // HBox contains the Input for Responsible
          const startDateCell = inputCells[3]; // Start Date
          const endDateCell = inputCells[4]; // End Date

          // Set editable based on isEditMode
          taskNameCell.setEditable(isEditMode);
          taskTypeCell.setEditable(isEditMode);
          responsibleInput.setEditable(isEditMode);
          startDateCell.setEditable(isEditMode);
          endDateCell.setEditable(isEditMode);
          responsibleButton.setEnabled(isEditMode);
        });
      },

      _updateSettingsButtonState(isEditMode) {
        const oSettingsButton = this.byId("settingsButton");
        if (oSettingsButton) {
          oSettingsButton.setEnabled(!isEditMode);
        }
      },
      _updateAddDataButtonState(isEditMode) {
        const oAddDataButton = this.byId("addDataButton");
        if (oAddDataButton) {
          oAddDataButton.setEnabled(isEditMode);
        }
      },
      onDialogClose() {
        const oModel = this.getView().getModel("columnVisibility");
        this._applyColumnVisibility();

        console.log("before close"), this.byId("settingsDialog").close();
      },

      onApplyFilter(oData) {
        this.applyResponsibleFilter(oData);
      },

      applyResponsibleFilter(oData) {
        const aFilter = [];
        if (oData.responsible) {
          aFilter.push(
            new Filter(
              "responsible",
              FilterOperator.Contains,
              oData.responsible
            )
          );
        }

        if (oData.taskType && oData.taskType !== "0") {
          aFilter.push(
            new Filter("taskType", FilterOperator.Contains, oData.taskType)
          );
        }
        if (oData.startDate) {
          aFilter.push(
            new Filter("startDate", FilterOperator.Contains, oData.startDate)
          );
        }

        if (oData.endDate) {
          aFilter.push(
            new Filter("endDate", FilterOperator.Contains, oData.endDate)
          );
        }

        const oList = this.byId("dataList");
        const oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);
      },
      onTaskNameChange(oEvent) {
        const sNewTaskName = oEvent.getParameter("value");
        const oSource = oEvent.getSource();
        const oItem = oSource.getParent();
        const oContext = oItem.getBindingContext("task");

        const oModel = this.getView().getModel("task");
        oModel.setProperty("taskName", sNewTaskName, oContext);
      },
      onTaskTypeChange(oEvent) {
        const sNewTaskType = oEvent.getParameter("selectedItem").getKey(); // Get the selected key
        const oSource = oEvent.getSource();
        const oItem = oSource.getParent(); // Get the parent ColumnListItem
        const oContext = oItem.getBindingContext("task"); // Make sure the context is correct

        if (oContext) {
          const oModel = this.getView().getModel("task"); // Ensure you're using the right model
          oModel.setProperty("taskType", sNewTaskType, oContext);
          console.log(`Updated taskType to: ${sNewTaskType}`); // For debugging
        } else {
          console.error("Binding context not found for taskType change!");
        }
      },
      onExportData() {
        const oList = this.byId("dataList");
        const oBinding = oList.getBinding("items");
        const aFilteredData = oBinding
          .getCurrentContexts()
          .map((ctx) => ctx.getObject());

        const header = [
          "Task Name",
          "Task Type",
          "Responsible",
          "Start Date",
          "End Date",
        ];
        let csv = "\uFEFF";
        csv += header.join(";") + "\n";

        aFilteredData.forEach((item) => {
          csv += `"${item.taskName}";"${item.taskType}";"${item.responsible}";"${item.startDate}";"${item.endDate}"\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "exported_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      onApplyFilter(sChannel, sEvent, oData) {
        this.applyResponsibleFilter(oData);
      },

      onExit() {
        const oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.unsubscribe(
          "DataList",
          "applyFilter",
          this.onApplyFilter,
          this
        );
        oEventBus.unsubscribe(
          "DataList",
          "exportData",
          this.onExportData,
          this
        );
      },
      onFilterData(oEvent) {
        const aFilter = [];
        const sQuery = oEvent.getParameter("query");
        if (sQuery) {
          aFilter.push(new Filter("taskName", FilterOperator.Contains, sQuery));
        }

        const oList = this.byId("dataList");
        const oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);
      },
    });
  }
);