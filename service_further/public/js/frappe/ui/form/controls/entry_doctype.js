// frappe.ui.form.ControlEntryDoctype = class ControlEntryDoctype extends frappe.ui.form.ControlLink {
    
//     can_write() {
//         return true;
//     }
    
//     // Ensure get_options always returns "DocType" for autocomplete
//     get_options() {
//         return "DocType";
//     }
    
//     make_input() {
//         // Call the parent's method to render the Link field with autocomplete
//         super.make_input();

//         // Ensure a label exists; if not, create one
//         if (!this.$label || this.$label.length === 0) {
//             this.$label = $('<label class="control-label">' + (this.df.label || '') + '</label>');
//             this.$wrapper.prepend(this.$label);
//         }
        
//         // Add a dummy focus_on_label method directly on the label element,
//         // so that any call like this.$label.focus_on_label() doesn't error out.
//         if (this.$label && !this.$label.focus_on_label) {
//             this.$label.focus_on_label = function() {};
//         }
        
//         // Also, set a dummy control-level method, if needed:
//         if (!this.focus_on_label) {
//             this.focus_on_label = () => {};
//         }
        
//         // Create a container for quick entry fields below the main input
//         this.$quick_entry_container = $('<div class="quick-entry-container" style="margin-top: 5px;"></div>')
//             .appendTo(this.input_area);
        
//         // Bind change event: when a DocType is selected, load quick entry fields
//         this.$input.on("change", () => {
//             this.load_quick_entry_fields();
//         });
//     }
    
//     load_quick_entry_fields() {
//         const selected_doctype = this.$input.val();
//         if (!selected_doctype) return;
        
//         frappe.call({
//             // Make sure this path matches your Python module path exactly
//             method: "custom_controls.custom_data_entry.get_quick_entry_fields",
//             args: { doctype: selected_doctype },
//             callback: (r) => {
//                 if (r.message) {
//                     // Clear any previously rendered quick entry fields
//                     this.$quick_entry_container.empty();
                    
//                     // Render each quick entry field (with a label and an input)
//                     r.message.forEach((field) => {
//                         let $field_wrapper = $('<div class="quick-entry-field" style="margin-bottom: 5px;"></div>');
//                         $('<label style="display:block;">')
//                             .text(field.label)
//                             .appendTo($field_wrapper);
//                         $('<input type="text" class="form-control" style="width:100%;">')
//                             .attr("data-fieldname", field.fieldname)
//                             .appendTo($field_wrapper);
//                         this.$quick_entry_container.append($field_wrapper);
//                     });
//                 }
//             }
//         });
//     }
    
//     // Override get_value to return an object with the main DocType and quick entry data
//     get_value() {
//         const main_val = this.$input.val();
//         let quick_data = {};
//         this.$quick_entry_container.find("input[data-fieldname]").each(function() {
//             quick_data[$(this).attr("data-fieldname")] = $(this).val();
//         });
//         return { doctype: main_val, quick_entry: quick_data };
//     }
// };

// // Register the custom control so that fields with type "Entry Doctype" use it
// frappe.ui.form.ControlFactory.add("Entry Doctype", frappe.ui.form.ControlEntryDoctype);

// console.log("Entry Doctype custom control loaded");
frappe.ui.form.ControlEntryDoctype = class ControlEntryDoctype extends frappe.ui.form.ControlData {
    static trigger_change_on_input_event = false;

    make_input() {
        const me = this;
        // Render the main link input field with an open button
        $(`<div class="link-field ui-front" style="position: relative;">
            <input type="text" class="input-with-feedback form-control">
            <span class="link-btn" style="display: none;">
                <a class="btn-open" style="display: inline-block;" title="${__("Open Link")}">
                    ${frappe.utils.icon("arrow-right", "xs")}
                </a>
            </span>
        </div>`).prependTo(this.input_area);

        this.$input_area = $(this.input_area);
        this.$input = this.$input_area.find("input");
        this.$link = this.$input_area.find(".link-btn");
        this.$link_open = this.$link.find(".btn-open");
        this.set_input_attributes();

        // Container for quick entry fields below the main input
        this.$quick_entry_container = $(`
            <div class="quick-entry-container" style="margin-top: 10px; border: 1px solid #ddd; padding: 10px; border-radius: 3px;">
                <div class="quick-entry-fields"></div>
            </div>
        `).appendTo(this.input_area);

        // Setup focus and blur event handlers
        this.$input.on("focus", function () {
            if (!me.$input.val()) {
                me.$input.val("").trigger("input");
            }
            me.show_link_and_clear_buttons();
        });

        this.$input.on("blur", function () {
            setTimeout(function () {
                me.$link.hide();
                me.hide_link_and_clear_buttons();
            }, 250);
        });

        // Show/hide buttons on mouse enter/leave of the input area
        this.$input_area.on("mouseenter", () => {
            this.show_link_and_clear_buttons();
        });
        this.$input_area.on("mouseleave", () => {
            if (!this.$input.is(":focus")) {
                this.hide_link_and_clear_buttons();
            }
        });

        this.$input.attr("data-target", this.df.options);
        this.input = this.$input.get(0);
        this.has_input = true;
        this.translate_values = true;

        // Call additional setup methods to avoid missing method errors
        this.setup_buttons();
        this.setup_awesomeplete();
        this.bind_change_event();

        // Bind change event to load quick entry fields when a DocType is selected
        this.$input.on("change", () => {
            this.load_quick_entry_fields();
        });
    }

    load_quick_entry_fields() {
        const selected_doctype = this.$input.val();
        if (!selected_doctype) return;

        frappe.call({
            method: "frappe.client.get_meta",
            args: { doctype: selected_doctype },
            callback: (r) => {
                if (r.message) {
                    const meta = r.message;
                    // Filter for fields that are required or marked for quick entry
                    const quick_entry_fields = meta.fields.filter(
                        (field) => field.reqd || field.in_quick_entry
                    );

                    // Clear any previously rendered quick entry fields
                    this.$quick_entry_container.find(".quick-entry-fields").empty();

                    // Render each quick entry field with a label and input element
                    quick_entry_fields.forEach((field) => {
                        const $field_wrapper = $(`
                            <div class="quick-entry-field" style="margin-bottom: 10px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${field.label}</label>
                                <input type="text" class="form-control" style="width: 100%;" data-fieldname="${field.fieldname}">
                            </div>
                        `);
                        this.$quick_entry_container.find(".quick-entry-fields").append($field_wrapper);
                    });
                } else {
                    frappe.msgprint(__("Failed to load quick entry fields"));
                }
            },
            error: (err) => {
                frappe.msgprint(__("An error occurred while fetching fields"));
            }
        });
    }

    get_value() {
        const main_val = this.$input.val();
        let quick_data = {};
        this.$quick_entry_container.find("input[data-fieldname]").each(function() {
            quick_data[$(this).attr("data-fieldname")] = $(this).val();
        });
        return { doctype: main_val, quick_entry: quick_data };
    }

    // --- Dummy / Minimal Implementations for Missing Methods ---

    setup_buttons() {
        // Example: Bind click event on open button to navigate to the linked document
        this.$link_open.on("click", () => {
            const link = this.$input.val();
            if (link) {
                frappe.set_route("Form", this.df.options, link);
            }
        });
    }

    setup_awesomeplete() {
        // If autocomplete is needed, initialize it here.
        // Leaving as a no-op for now.
    }

    bind_change_event() {
        // Bind any additional change events as required.
        // Leaving as a no-op for now.
    }

    show_link_and_clear_buttons() {
        // Show the link button (and potentially a clear button if implemented)
        this.$link.show();
    }

    hide_link_and_clear_buttons() {
        // Hide the link button (and clear button)
        this.$link.hide();
    }
};

// Register the custom control so that fields of type "Link" use it.
frappe.ui.form.ControlFactory.add("Entry Doctype", frappe.ui.form.ControlEntryDoctype);

console.log("Custom Link control with quick entry fields loaded");
