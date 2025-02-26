frappe.ui.form.ControlInput.prototype.set_input_areas = function () {
    if (this.only_input) {
        this.input_area = this.wrapper;
    } else {
        this.label_area = this.label_span = this.$wrapper.find("label").get(0);

        console.log("Overridden!", this);
        // hiding labels here
        

        // temporary thing to check

        this.input_area = this.$wrapper.find(".control-input").get(0);
        this.$input_wrapper = this.$wrapper.find(".control-input-wrapper");
        // keep a separate display area to rendered formatted values
        // like links, currencies, HTMLs etc.
        this.disp_area = this.$wrapper.find(".control-value").get(0);
    }
}