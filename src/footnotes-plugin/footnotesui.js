/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { ContextualBalloon, clickOutsideHandler } from '@ckeditor/ckeditor5-ui';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
import Range from '@ckeditor/ckeditor5-engine/src/view/range';
import FormView from './footnotesview';
import './styles.css';
import getRangeText from './utils.js';


export default class FootnotesUI extends Plugin {
    static get requires() {
        return [ContextualBalloon];
    }

    init() {
        const editor = this.editor;
        editor.editing.view.addObserver(ClickObserver);

        // Create the balloon and the form view.
        this._balloon = this.editor.plugins.get(ContextualBalloon);
        this.formView = this._createFormView();

        editor.ui.componentFactory.add('footnotes', () => {
            const button = new ButtonView();

            button.label = 'Footnotes';
            button.tooltip = true;
            button.withText = true;

            // Show the UI on button click.
            this.listenTo(button, 'execute', () => {
                this._showUI();
            });

            return button;
        });

        editor.listenTo( editor.editing.view.document, 'click', (evt, data) => {
            if (data.target.name == 'fn') {
                const commandValue = this.editor.commands.get('addFootnotes').value;

                if(commandValue) {
                    // const val = data.target._attrs.get('title');
                    this._showUI();
                }
            }
         });
    }

    _createFormView() {
        const editor = this.editor;
        const formView = new FormView(editor.locale);

        // Execute the command after clicking the "Save" button.
        this.listenTo(formView, 'submit', () => {
            // Grab values from the footnotes and title input fields.
            const value = {
                fn: "F",
                title: formView.titleInputView.fieldView.element.value
            };
            editor.execute('addFootnotes', value);

            // Hide the form view after submit.
            this._hideUI();
        });

        // Hide the form view after clicking the "Cancel" button.
        this.listenTo(formView, 'cancel', () => {
            this._hideUI();
        });

        // Hide the form view when clicking outside the balloon.
        clickOutsideHandler({
            emitter: formView,
            activator: () => this._balloon.visibleView === formView,
            contextElements: [this._balloon.view.element],
            callback: () => this._hideUI()
        });

        return formView;
    }

    _showUI(val) {
        const selection = this.editor.model.document.selection;

        // Check the value of the command.
        const commandValue = this.editor.commands.get('addFootnotes').value;

        this._balloon.add({
            view: this.formView,
            position: this._getBalloonPositionData()
        });

        // Disable the input when the selection is not collapsed.
        this.formView.fnInputView.isEnabled = selection.getFirstRange().isCollapsed;

        // Fill the form using the state (value) of the command.
        if (commandValue || val) {
            if(commandValue) {
                this.formView.fnInputView.fieldView.value = commandValue.fn;
                this.formView.titleInputView.fieldView.value = commandValue.title;
            }

            if(val) {
                this.formView.titleInputView.fieldView.value = val;
            }
        }
        // If the command has no value, put the currently selected text (not collapsed)
        // in the first field and empty the second in that case.
        else {
            const selectedText = getRangeText(selection.getFirstRange());

            this.formView.fnInputView.fieldView.value = selectedText;
            this.formView.titleInputView.fieldView.value = '';
        }

        this.formView.focus();
    }

    _hideUI() {
        // Clear the input field values and reset the form.
        this.formView.fnInputView.fieldView.value = '';
        this.formView.titleInputView.fieldView.value = '';
        this.formView.element.reset();

        this._balloon.remove(this.formView);

        // Focus the editing view after inserting the footnotes so the user can start typing the content
        // right away and keep the editor focused.
        this.editor.editing.view.focus();
    }

    _getBalloonPositionData() {
        const view = this.editor.editing.view;
        const viewDocument = view.document;
        let target = null;

        // Set a target position by converting view selection range to DOM
        target = () => view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange());

        return {
            target
        };
    }
}