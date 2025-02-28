// frappe.ui.form.ControlInput.prototype.set_input_areas = function () {
//     if (this.only_input) {
//       this.input_area = this.wrapper;
//     } else {
//       this.label_area = this.label_span = this.$wrapper.find("label").get(0);
//       console.log("Overridden!", this);
      
//       // Hide the label
//       this.label_area.style.display = "none";
      
//       // Get the label text
//       const labelText = this.label_area.textContent || this.df?.label || "";
//       console.log("Label text:", labelText);
      
//       // Find the input field and set placeholder
//       const $input = this.$wrapper.find('input, textarea, select');
//       if ($input.length) {
//         $input.attr('placeholder', labelText);
//       } else {
//         setTimeout(() => {
//           const $delayedInput = this.$wrapper.find('input, textarea, select');
//           if ($delayedInput.length) {
//             console.log("Input found",this);
//             $delayedInput.attr('placeholder', labelText);
//           }
//         }, 100);
//       }
      
//       this.input_area = this.$wrapper.find(".control-input").get(0);
//       this.$input_wrapper = this.$wrapper.find(".control-input-wrapper");
//       this.disp_area = this.$wrapper.find(".control-value").get(0);
//     }
//   }


