import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class Footnote extends Plugin {
	static get pluginName() {
		return 'footnote'
	}

	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add( 'footnote', () => {
			// The button will be an instance of ButtonView.
			const button = new ButtonView();

			button.set( {
				label: 'FN',
				withText: true
			} );

			//Execute a callback function when the button is clicked
			button.on( 'execute', () => {
				//Change the model using the model writer
				editor.model.change( writer => {

					//Insert the text at the user's current position
					editor.model.insertContent( writer.createText( "[Fn][/Fn]" ) );
				} );
			} );

			return button;
		} );
	}
};