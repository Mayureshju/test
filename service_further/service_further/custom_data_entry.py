# import frappe

# @frappe.whitelist()
# def get_quick_entry_fields(doctype):
#     meta = frappe.get_meta(doctype)
#     quick_fields = []
#     for field in meta.fields:
#         # Ensure the DocType has fields marked as quick entry (in_quick_entry should be truthy)
#         if field.get("in_quick_entry") or field.get("redq") == 1:
#             quick_fields.append({
#                 "fieldname": field.fieldname,
#                 "label": field.label
#             })
#     return quick_fields

import frappe

@frappe.whitelist()
def get_quick_entry_fields(doctype):
    meta = frappe.get_meta(doctype)
    quick_entry_fields = []

    for field in meta.fields:
        if field.reqd or field.in_quick_entry:  # Fetch mandatory or quick entry fields
            quick_entry_fields.append({
                "fieldname": field.fieldname,
                "label": field.label,
                "fieldtype": field.fieldtype
            })

    return quick_entry_fields