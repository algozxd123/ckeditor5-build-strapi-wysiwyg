/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Command from '@ckeditor/ckeditor5-core/src/command';
import findAttributeRange from '@ckeditor/ckeditor5-typing/src/utils/findattributerange';
import getRangeText from './utils.js';
import { toMap } from '@ckeditor/ckeditor5-utils';

export default class FootnotesCommand extends Command {
    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const firstRange = selection.getFirstRange();

        // When the selection is collapsed, the command has a value if the caret is in an footnotes.
        if (firstRange.isCollapsed) {
            if (selection.hasAttribute('footnotes')) {
                const attributeValue = selection.getAttribute('footnotes');

                // Find the entire range containing the footnotes under the caret position.
                const footnotesRange = findAttributeRange(selection.getFirstPosition(), 'footnotes', attributeValue, model);

                this.value = {
                    fn: getRangeText(footnotesRange),
                    title: attributeValue,
                    range: footnotesRange
                };
            } else {
                this.value = null;
            }
        }
        // When the selection is not collapsed, the command has a value if the selection contains a subset of a single footnotes
        // or an entire footnotes.
        else {
            if (selection.hasAttribute('footnotes')) {
                const attributeValue = selection.getAttribute('footnotes');

                // Find the entire range containing the footnotes under the caret position.
                const footnotesRange = findAttributeRange(selection.getFirstPosition(), 'footnotes', attributeValue, model);

                if (footnotesRange.containsRange(firstRange, true)) {
                    this.value = {
                        fn: getRangeText(firstRange),
                        title: attributeValue,
                        range: firstRange
                    };
                } else {
                    this.value = null;
                }
            } else {
                this.value = null;
            }
        }

        // The command is enabled when the "footnotes" attribute can be set on the current model selection.
        this.isEnabled = model.schema.checkAttributeInSelection(selection, 'footnotes');
    }

    execute({ fn, title }) {
        const model = this.editor.model;
        const selection = model.document.selection;

        model.change(writer => {
            // If selection is collapsed then update the selected footnotes or insert a new one at the place of caret.
            if (selection.isCollapsed) {
                // When a collapsed selection is inside text with the "footnotes" attribute, update its text and title.
                if (this.value) {
                    const { end: positionAfter } = model.insertContent(
                        writer.createText(fn, { footnotes: title }),
                        this.value.range
                    );
                    // Put the selection at the end of the inserted footnotes.
                    writer.setSelection(positionAfter);
                }
                // If the collapsed selection is not in an existing footnotes, insert a text node with the "footnotes" attribute
                // in place of the caret. Because the selection is collapsed, the attribute value will be used as a data for text.
                // If the footnotes is empty, do not do anything.
                else if (fn !== '') {
                    const firstPosition = selection.getFirstPosition();

                    // Collect all attributes of the user selection (could be "bold", "italic", etc.)
                    const attributes = toMap(selection.getAttributes());

                    // Put the new attribute to the map of attributes.
                    attributes.set('footnotes', title);

                    // Inject the new text node with the footnotes text with all selection attributes.
                    const { end: positionAfter } = model.insertContent(writer.createText(fn, attributes), firstPosition);

                    const content = '&#8205;';
                    const viewFragment = this.editor.data.processor.toView(content);
                    const modelFragment = this.editor.data.toModel(viewFragment);
                    this.editor.model.insertContent(modelFragment);

                    // Put the selection at the end of the inserted footnotes. Using an end of a range returned from
                    // insertContent() just in case nodes with the same attributes were merged.
                    positionAfter.path[1]+=1;
                    writer.setSelection(positionAfter);
                }

                // Remove the "footnotes" attribute attribute from the selection. It stops adding a new content into the footnotes
                // if the user starts to type.
                writer.removeSelectionAttribute('footnotes');
            } else {
                // If the selection has non-collapsed ranges, change the attribute on nodes inside those ranges
                // omitting nodes where the "footnotes" attribute is disallowed.
                const ranges = model.schema.getValidRanges(selection.getRanges(), 'footnotes');

                for (const range of ranges) {
                    writer.setAttribute('footnotes', title, range);
                }
            }
        });
    }
}