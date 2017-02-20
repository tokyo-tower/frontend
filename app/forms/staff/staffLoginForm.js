"use strict";
const form = require("express-form");
const SIGNATURE_MAX_LENGTH = 10;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (req) => {
    return form(form.field('userId', req.__('Form.FieldName.userId')).trim().required('', req.__('Message.required{{fieldName}}', { fieldName: '%s' })), form.field('password', req.__('Form.FieldName.password')).trim().required('', req.__('Message.required{{fieldName}}', { fieldName: '%s' })), form.field('signature', req.__('Form.FieldName.signature')).trim()
        .required('', req.__('Message.required{{fieldName}}', { fieldName: '%s' }))
        .maxLength(SIGNATURE_MAX_LENGTH, req.__('Message.maxLength{{fieldName}}{{max}}', { fieldName: '%s', max: SIGNATURE_MAX_LENGTH.toString() })), form.field('language', req.__('Form.FieldName.language')).trim().required('', req.__('Message.required{{fieldName}}', { fieldName: '%s' })), form.field('remember', req.__('Form.FieldName.remember')));
};