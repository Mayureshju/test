frappe.ui.form.ControlEntryDoctype = class ControlEntryDoctype extends frappe.ui.form.ControlData {
    static trigger_change_on_input_event = false;

    make_input() {
        const me = this;
        // Create the input structure
        const $input_wrapper = $(`
            <div class="link-field ui-front" style="position: relative;">
                <input type="text" class="input-with-feedback form-control" placeholder="${__('Select Doctype')}">
                <span class="link-btn">
                    <a class="btn-clear no-decoration" title="${__('Clear')}">
                        ${frappe.utils.icon("close", "xs")}
                    </a>
                    <a class="btn-open no-decoration" title="${__('Open Form')}">
                        ${frappe.utils.icon("arrow-right", "xs")}
                    </a>
                </span>
            </div>
        `).prependTo(this.input_area);

        this.$input_area = $(this.input_area);
        this.$input = this.$input_area.find("input");
        this.$link = this.$input_area.find(".link-btn");
        this.$btn_clear = this.$link.find(".btn-clear");
        this.$btn_open = this.$link.find(".btn-open");

        // Quick entry container
        this.$quick_entry_container = $(`
            <div class="quick-entry-container" style="margin-top: 10px; border: 1px solid #d1d8dd; padding: 10px; border-radius: 4px; display: none;">
                <div class="quick-entry-fields"></div>
                <button class="btn btn-primary btn-sm save-quick-entry" style="margin-top: 10px;">${__('Save')}</button>
            </div>
        `).appendTo(this.input_area);

        this.set_input_attributes();

        // Defer event binding to ensure DOM is ready
        setTimeout(() => {
            this.bind_input_events();
            this.setup_awesomeplete();
            this.bind_change_event();
        }, 0); // Next tick equivalent in plain JS

        this.input = this.$input.get(0);
        this.has_input = true;

        // Add a focus_on_label method to the input wrapper for Vue compatibility
        this.$input_area[0].focus_on_label = () => {
            if (this.$input && this.$input.length) {
                this.$input.focus(); // Focus the input as a fallback
            } else {
                console.warn("Input not available for focus_on_label");
            }
        };
    }

    bind_input_events() {
        this.$input.on({
            focus: () => {
                setTimeout(() => {
                    if (this.$input.val()) {
                        this.show_link_buttons();
                    }
                    if (!this.awesomplete.list.length) {
                        this.load_doctype_list();
                    }
                }, 100);
            },
            blur: () => {
                setTimeout(() => {
                    if (!this.autocomplete_open) {
                        this.hide_link_buttons();
                    }
                }, 300);
            },
            input: frappe.utils.debounce(() => this.load_quick_entry_fields(), 300)
        });

        this.$btn_clear.on("click", () => {
            this.set_value(null);
            this.$quick_entry_container.hide();
        });

        this.$quick_entry_container.find(".save-quick-entry").on("click", () => {
            this.save_quick_entry();
        });
    }

    setup_awesomeplete() {
        this.awesomplete = new Awesomplete(this.input, {
            minChars: 0,
            maxItems: 99,
            autoFirst: true,
            list: [],
            data: (item) => ({
                label: __(item.label || item.value),
                value: item.value
            }),
            filter: () => true,
            replace: function(item) {
                this.input.value = item.label;
            }
        });

        this.$input.on({
            "awesomplete-selectcomplete": (e) => {
                this.load_quick_entry_fields();
            },
            "awesomplete-open": () => {
                this.autocomplete_open = true;
            },
            "awesomplete-close": () => {
                this.autocomplete_open = false;
            }
        });
    }

    load_doctype_list() {
        frappe.call({
            method: "frappe.desk.search.get_doctypes",
            args: {
                with_selectable: true,
                include_standard: false
            },
            callback: (r) => {
                if (r.message) {
                    const doctypes = r.message.map(dt => ({
                        label: __(dt),
                        value: dt
                    }));
                    this.awesomplete.list = doctypes;
                }
            },
            error: (err) => {
                console.error("Failed to load doctypes:", err);
            }
        });
    }

    load_quick_entry_fields() {
        const doctype = this.$input.val();
        if (!doctype) {
            this.$quick_entry_container.hide();
            return;
        }

        frappe.model.with_doctype(doctype, () => {
            const meta = frappe.get_meta(doctype);
            const quick_fields = meta.fields.filter(f =>
                (f.reqd || f.in_quick_entry) &&
                !["Section Break", "Column Break", "Tab Break"].includes(f.fieldtype)
            );

            this.$quick_entry_container.find(".quick-entry-fields").empty();

            if (!quick_fields.length) {
                this.$quick_entry_container.hide();
                return;
            }

            quick_fields.forEach(field => {
                const $field = this.create_field_input(field);
                this.$quick_entry_container.find(".quick-entry-fields").append($field);
            });

            this.$quick_entry_container.show();
            // Trigger an event for Vue to react to
            this.$input_area.trigger("quick-entry-loaded");
        });
    }

    create_field_input(field) {
        const fieldtype = field.fieldtype === "Check" ? "checkbox" : "text";
        const required = field.reqd ? "required" : "";

        return $(`
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: 500; margin-bottom: 5px;">
                    ${__(field.label || field.fieldname)}
                    ${field.reqd ? '<span class="text-danger">*</span>' : ''}
                </label>
                <input 
                    type="${fieldtype}" 
                    class="form-control" 
                    data-fieldname="${field.fieldname}" 
                    ${required}
                    ${field.options ? `data-options="${field.options}"` : ""}
                    style="max-width: 100%;"
                >
            </div>
        `);
    }

    save_quick_entry() {
        const doctype = this.$input.val();
        if (!doctype) return;

        const data = { doctype };
        this.$quick_entry_container.find("input").each(function() {
            const $input = $(this);
            const fieldname = $input.attr("data-fieldname");
            data[fieldname] = $input.attr("type") === "checkbox" ?
                $input.is(":checked") : $input.val();
        });

        frappe.call({
            method: "frappe.desk.form.save.save_quick_entry",
            args: {
                doctype: doctype,
                data: data
            },
            callback: (r) => {
                if (r.message) {
                    this.set_value(r.message.name);
                    frappe.show_alert({
                        message: __("Created successfully"),
                        indicator: "green"
                    });
                }
            },
            error: (err) => {
                frappe.msgprint({
                    title: __("Error"),
                    message: __("Failed to create {0}", [doctype]),
                    indicator: "red"
                });
                console.error("Save quick entry failed:", err);
            }
        });
    }

    set_value(value) {
        if (value && typeof value === "object") {
            this.$input.val(value.doctype);
            this.load_quick_entry_fields();
            if (value.quick_entry) {
                Object.entries(value.quick_entry).forEach(([fieldname, val]) => {
                    const $input = this.$quick_entry_container
                        .find(`input[data-fieldname="${fieldname}"]`);
                    if ($input.length) { // Check if input exists
                        if ($input.attr("type") === "checkbox") {
                            $input.prop("checked", val);
                        } else {
                            $input.val(val);
                        }
                    }
                });
            }
        } else {
            this.$input.val(value || "");
            this.$quick_entry_container.hide();
        }
        return this.validate_and_set_in_model(value).catch(err => {
            console.error("Error in set_value:", err);
            throw err; // Re-throw to maintain Frappe's error handling
        });
    }

    get_value() {
        const doctype = this.$input.val();
        if (!doctype) return null;

        const quick_data = {};
        this.$quick_entry_container.find("input").each(function() {
            const $input = $(this);
            quick_data[$input.attr("data-fieldname")] =
                $input.attr("type") === "checkbox" ? $input.is(":checked") : $input.val();
        });

        return { doctype, quick_entry: quick_data };
    }

    show_link_buttons() {
        if (this.$input.val()) {
            this.$link.show();
            this.$btn_open.attr("href", frappe.utils.get_form_link(this.$input.val(), ""));
        }
    }

    hide_link_buttons() {
        this.$link.hide();
    }

    validate(value) {
        if (!value || typeof value !== "object") return value;
        return frappe.model.with_doctype(value.doctype, () => {
            const meta = frappe.get_meta(value.doctype);
            const required_fields = meta.fields.filter(f => f.reqd);
            for (let field of required_fields) {
                if (!(field.fieldname in value.quick_entry) || !value.quick_entry[field.fieldname]) {
                    frappe.msgprint(__("{0} is required", [field.label]));
                    return null;
                }
            }
            return value;
        });
    }
};