import "@logseq/libs";
import "virtual:windi.css";

import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { logseq as PL } from "../package.json";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";
import * as BibTeXParser from "@retorquere/bibtex-parser";
import SearchBar from "./searchbar";
import { handleClosePopup } from "./handleClosePopup";
const css = (t, ...args) => String.raw(t, ...args);

export var paperpile = "";
export var paperpileParsed = [];
const pluginId = PL.id;
const settings: SettingSchemaDesc[] = [
  {
    key: "paperpilePath",
    title: "Path to PaperPile DB",
    description: "Enter the path your paperpile DB",
    default: "path/to/paperpile",
    type: "string",
  },
  {
    key: "pageProperties",
    title: "Properties to be added by default",
    description: "Type the properties you want to be added by default",
    default: [
      "author",
      "title",
      "journal",
      "year",
      "volume",
      "number",
      "pages",
      "doi",
      "url",
    ],
    type: "enum",
    enumPicker: "checkbox",
    enumChoices: [
      "author",
      "title",
      "journal",
      "year",
      "url",
      "abstract",
      "keywords",
      "publisher",
      "volume",
      "number",
      "pages",
      "doi",
      "url",
    ],
  },
  {
    key: "pageFirstBlock",
    title: "First block of the page",
    description:
      "Optional: Enter the first block of the page. This will mean that the following text will automatically be inserted with the properties. ",
    default: "",
    type: "string",
  },
  {
    key: "smartsearch",
    title: "Enable smart search?",
    description:
      "Would you like to enable smart search with fuzzy matching or stick with simple keyword based search?",
    default: true,
    type: "boolean",
  },
  {
    key: "indexAbstract",
    title: "Enable indexing abstract? (Can impact performance!))",
    description:
      "Would you like to to index abstract in search? This would mean that the search results are prioritized primarily by title, but the contents of the abstract is also taken into consideration.",
    default: true,
    type: "boolean",
  },
  // {
  //   key: "inlineReferenceProperties",
  //   title: "Properties to be included as inline property",
  //   description: "Select the properties you want to be included as inline property",
  //   default: [
  //     "author",
  //     "title",
  //   ],
  //   type: "enum",
  //   enumPicker: "checkbox",
  //   enumChoices: [
  //     "author",
  //     "title",
  //     "journal",
  //     "year",
  //     "url",
  //     "abstract",
  //     "keywords",
  //     "publisher",
  //   ],
  // },
  {
    key: "inlineReferenceFirstBlock",
    title: "First block of the inline reference",
    description:
      "Enter the first block of the inline reference. This will mean that the following text will automatically be inserted with the properties. You can use the placeholders {author}, {citekey}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url}, {abstract} and {type}",
    default: "",
    type: "string",
  },
  {
    key: "inlineReferenceSecondBlock",
    title: "Optional Second block of the inline reference",
    description:
      "Enter the second block of the inline reference. This will mean that the following text will automatically be inserted after the first block. You can use the placeholders {author}, {citekey}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url}, {abstract} and {type}",
    default: "",
    type: "string",
  },
  {
    key: "indentSecondBlockofInlineReference",
    title: "Indent first block of inline reference?",
    description:
      "Would you like to indent the second block of the inline reference?",
    default: true,
    type: "boolean",
  },
];

const dispatchPaperpileParse = (mode) => {
  if (paperpile === "") {
    getPaperPile(mode);
  } else {
    showDB(paperpileParsed, mode);
  }
};
const createDB = (mode) => {
  const options: BibTeXParser.ParserOptions = {
    errorHandler: (err) => {
      console.warn("Citation plugin: error loading BibLaTeX entry:", err);
    },
  };
  const parsed = BibTeXParser.parse(
    paperpile,
    options
  ) as BibTeXParser.Bibliography;

  paperpileParsed = parsed.entries;
  console.log(paperpileParsed);
  dispatchPaperpileParse(mode);
};

const showDB = (parsed, mode) => {
  paperpileParsed = parsed;
  console.log("mode is ", mode);

  ReactDOM.unmountComponentAtNode(document.getElementById("app"));
  ReactDOM.render(
    <React.StrictMode>
      <SearchBar
        paperpileParsed={{ parse: paperpileParsed, currentModeInput: mode }}
      />
    </React.StrictMode>,
    document.getElementById("app")
  );
  logseq.showMainUI();
  handleClosePopup();
};

const getPaperPile = async (mode) => {
  console.log(`file://${logseq.settings.paperpilePath}`);
  axios.get(`file://${logseq.settings.paperpilePath}`).then((result) => {
    paperpile = result.data;
    createDB(mode);
  });
};
logseq.useSettingsSchema(settings);
function main() {
  console.info(`#${pluginId}: MAIN`);
  function createModel() {
    return {
      show() {
        dispatchPaperpileParse(0);
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  // const openIconName = "template-plugin-open";

  // logseq.provideStyle(css`
  //   .${openIconName} {
  //     opacity: 0.55;
  //     font-size: 20px;
  //     margin-top: 4px;
  //   }

  //   .${openIconName}:hover {
  //     opacity: 0.9;
  //   }
  // `);

  // logseq.App.registerUIItem("toolbar", {
  //   key: openIconName,
  //   template: `
  //     <div data-on-click="show" class="${openIconName}">⚙️</div>
  //   `,
  // });

  logseq.App.registerCommand(
    "openAsPage",
    {
      key: "openedLitNote",
      label: "Search and open reference as page",
      keybinding: { binding: "mod+shift+o" },
    },
    () => {
      dispatchPaperpileParse(2);
    }
  );
  logseq.App.registerCommand(
    "insertLink",
    {
      key: "inlineLitNote",
      label: "Create Inline Link to Lit Note",
      keybinding: { binding: "mod+shift+l" },
    },
    () => {
      dispatchPaperpileParse(1);
    }
  );
  logseq.App.registerCommand(
    "insertInline",
    {
      key: "inlineNote",
      label: "Create Inline Note",
      keybinding: { binding: "mod+shift+i" },
    },
    () => {
      dispatchPaperpileParse(0);
    }
  );
}

logseq.ready(main).catch(console.error);
