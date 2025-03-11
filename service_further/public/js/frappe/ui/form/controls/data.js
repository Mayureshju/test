console.log("Hello")
frappe.ui.form.ControlData.prototype.make_input = function () {
    if (this.$input) return;

    let { html_element, input_type, input_mode } = this.constructor;

    // Wrap input in floating label container
    this.$wrapper.addClass("floating-input-wrapper");

    this.$input = $("<" + html_element + ">")
        .attr("type", input_type)
        .attr("inputmode", input_mode)
        .attr("autocomplete", "off")
        .addClass("input-with-feedback form-control floating-input")
        .prependTo(this.input_area);
    // dynamically Create floating label
    // can be changed or repositioned to take the label that is already present?
    this.$label = $(`<label class="floating-label">${__(this.df.label)}</label>`);
    this.$label.insertBefore(this.$input);

    this.$input.on("focusin", () => {
            this.$wrapper.addClass("has-focus");
    });

    this.$input.on("focusout",()=>{
        console.log(this.$input.val(), Boolean(this.input.val));
        
        if(this.$input.val()==="")
            this.$wrapper.removeClass("has-focus");
    })

    this.$input.on("paste", (e) => {
        let pasted_data = frappe.utils.get_clipboard_data(e);
        let maxlength = this.$input.attr("maxlength");
        if (maxlength && pasted_data.length > maxlength) {
            let warning_message = __(
                "The value you pasted was {0} characters long. Max allowed characters is {1}.",
                [cstr(pasted_data.length).bold(), cstr(maxlength).bold()]
            );

            // Only show edit link to users who can update the doctype
            if (this.frm && frappe.model.can_write(this.frm.doctype)) {
                let doctype_edit_link = null;
                if (this.frm.meta.custom) {
                    doctype_edit_link = frappe.utils.get_form_link(
                        "DocType",
                        this.frm.doctype,
                        true,
                        __("this form")
                    );
                } else {
                    doctype_edit_link = frappe.utils.get_form_link(
                        "Customize Form",
                        "Customize Form",
                        true,
                        null,
                        {
                            doc_type: this.frm.doctype,
                        }
                    );
                }
                let edit_note = __(
                    "{0}: You can increase the limit for the field if required via {1}",
                    [__("Note").bold(), doctype_edit_link]
                );
                warning_message += `<br><br><span class="text-muted text-small">${edit_note}</span>`;
            }

            frappe.msgprint({
                message: warning_message,
                indicator: "orange",
                title: __("Data Clipped"),
            });
        }
    });

    this.set_input_attributes();
    this.input = this.$input.get(0);
    this.has_input = true;
    this.bind_change_event();
    this.setup_autoname_check();
    this.setup_copy_button();
    if (this.df.options == "URL") {
        this.setup_url_field();
    }

    if (this.df.options == "Barcode") {
        this.setup_barcode_field();
    }
}
