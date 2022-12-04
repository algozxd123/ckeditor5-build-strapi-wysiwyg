/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FootnotesCommand from './footnotescommand';

export default class FootnotesEditing extends Plugin {
    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add(
            'addFootnotes', new FootnotesCommand(this.editor)
        );
    }
    _defineSchema() {
        const schema = this.editor.model.schema;

        // Extend the text node's schema to accept the footnotes attribute.
        schema.extend('$text', {
            allowAttributes: ['footnotes']
        });
    }
    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversion from a model attribute to a view element
        conversion.for('downcast').attributeToElement({
            model: 'footnotes',

            // Callback function provides access to the model attribute value
            // and the DowncastWriter
            view: (modelAttributeValue, conversionApi) => {
                const { writer } = conversionApi;

                return writer.createAttributeElement('fn', {
                    title: modelAttributeValue,
                    class: "footnote",
                    contenteditable: false
                });
            }
        });

        // Conversion from a view element to a model attribute
        conversion.for('upcast').elementToAttribute({
            view: {
                name: 'fn',
                attributes: ['title']
            },
            model: {
                key: 'footnotes',

                // Callback function provides access to the view element
                value: viewElement => {
                    const title = viewElement.getAttribute('title');
                    return title;
                }
            }
        });
    }
}