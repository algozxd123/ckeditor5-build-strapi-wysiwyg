/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

 import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
 import FootnotesEditing from './footnotesediting';
 import FootnotesUI from './footnotesui';
 
 export default class Footnotes extends Plugin {
     static get requires() {
         return [ FootnotesEditing, FootnotesUI ];
     }
 }