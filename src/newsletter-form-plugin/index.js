import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import {
  toWidget,
  viewToModelPositionOutsideModelElement,
} from "@ckeditor/ckeditor5-widget/src/utils";
import Widget from "@ckeditor/ckeditor5-widget/src/widget";
import Command from "@ckeditor/ckeditor5-core/src/command";

import {
  addListToDropdown,
  createDropdown,
} from "@ckeditor/ckeditor5-ui/src/dropdown/utils";
import Collection from "@ckeditor/ckeditor5-utils/src/collection";
import Model from "@ckeditor/ckeditor5-ui/src/model";

class NewsletterForm extends Plugin {
  static get requires() {
    return [NewsletterFormEditing, NewsletterFormUI];
  }
}

class NewsletterFormCommand extends Command {
  execute({ value }) {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    editor.model.change((writer) => {
      //Insert the text at the user's current position
      editor.model.insertContent(writer.createText("({[" + value + "]})"));
    });
  }

  refresh() {
    const model = this.editor.model;
    const selection = model.document.selection;

    const isAllowed = model.schema.checkChild(
      selection.focus.parent,
      "newsletterform"
    );

    this.isEnabled = isAllowed;
  }
}

class NewsletterFormUI extends Plugin {
  init() {
    const editor = this.editor;
    const t = editor.t;
    const newsletterformNames = editor.config.get("newsletterformConfig.types");

    // The "newsletterform" dropdown must be registered among the UI components of the editor
    // to be displayed in the toolbar.
    editor.ui.componentFactory.add("newsletterform", (locale) => {
      const dropdownView = createDropdown(locale);

      // Populate the list in the dropdown with items.
      addListToDropdown(
        dropdownView,
        getDropdownItemsDefinitions(newsletterformNames)
      );

      dropdownView.buttonView.set({
        // The t() function helps localize the editor. All strings enclosed in t() can be
        // translated and change when the language of the editor changes.
        label: t("Newsletter Forms"),
        tooltip: true,
        withText: true,
      });

      // Disable the newsletterform button when the command is disabled.
      const command = editor.commands.get("newsletterform");
      dropdownView.bind("isEnabled").to(command);

      // Execute the command when the dropdown item is clicked (executed).
      this.listenTo(dropdownView, "execute", (evt) => {
        editor.execute("newsletterform", { value: evt.source.commandParam });
        editor.editing.view.focus();
      });

      return dropdownView;
    });
  }
}

function getDropdownItemsDefinitions(newsletterformNames) {
  const itemDefinitions = new Collection();

  for (const name of newsletterformNames) {
    const definition = {
      type: "button",
      model: new Model({
        commandParam: name,
        label: name,
        withText: true,
      }),
    };

    // Add the item definition to the collection.
    itemDefinitions.add(definition);
  }

  return itemDefinitions;
}

class NewsletterFormEditing extends Plugin {
  static get requires() {
    return [Widget];
  }

  init() {
    console.log("NewsletterFormEditing#init() got called");

    this._defineSchema();

    this.editor.commands.add(
      "newsletterform",
      new NewsletterFormCommand(this.editor)
    );

    this.editor.editing.mapper.on(
      "viewToModelPosition",
      viewToModelPositionOutsideModelElement(this.editor.model, (viewElement) =>
        viewElement.hasClass("newsletterform")
      )
    );
    this.editor.config.define("newsletterformConfig", {
      types: ["date", "first name", "surname"],
    });
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register("newsletterform", {
      // Allow wherever text is allowed:
      allowWhere: "$text",

      // The newsletterform will act as an inline node:
      isInline: true,

      // The inline widget is self-contained so it cannot be split by the caret and it can be selected:
      isObject: true,

      // The inline widget can have the same attributes as text (for example linkHref, bold).
      allowAttributesOf: "$text",

      // The newsletterform can have many types, like date, name, surname, etc:
      allowAttributes: ["name"],
    });
  }
}

export default NewsletterForm;
