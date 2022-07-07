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
  // {
  //   key: "pageProperties",
  //   title: "Properties to be added by default",
  //   description: "Type the properties you want to be added by default",
  //   default: [
  //     "author",
  //     "title",
  //     "journal",
  //     "year",
  //     "volume",
  //     "number",
  //     "pages",
  //     "doi",
  //     "url",
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
  //     "volume",
  //     "number",
  //     "pages",
  //     "doi",
  //     "url",
  //   ],
  // },
  // {
  //   key: "customPageContent",
  //   title: "Custom Page Content to be inserted by default to the first block ",
  //   description:
  //     "Type the properties you want to be added by default to the first block of the page, use \\n to create a newline, you can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} in the value section",
  //   default: "",
  //   type: "string",
  // },
  {
    key: "smartsearch",
    title: "Enable smart search?",
    description:
      "Would you like to enable smart search with fuzzy matching or stick with simple keyword based search?",
    default: false,
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
  {
    key: "templatePage",
    title: "Template Page",
    description: "Enter the name of the template page. On creating a literature note, this page's template will be followed. You can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} as placeholders",
    default: "",
    type: "string",
  },
  {
    key: "templateBlock",
    title: "Template Block",
    description: "Enter the name of the template block, use logseq's in built template feature or smartblocks. On inserting inline references, this block's template will be followed. You can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} as placeholders",
    default: "",
    type: "string",
  },
  {
    key: "pageTitle",
    title: "Page Title",
    description: "Enter the template for the title of the page. You can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} as placeholders",
    default: "{citekey}",
    type: "string",
  }
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
  axios
    .get(`file://${logseq.settings.paperpilePath}`)
    .then((result) => {
      paperpile = result.data;
      createDB(mode);
    })
    .catch((err) => {
      logseq.App.showMsg("Whoops!, Something went wrong when fetching the citation DB. Please check the path and try again."); 
      console.log(err)});

  // axios.get('https://httpbin.org/status/200').
  // // Will throw a TypeError because the property doesn't exist.
  // then(res => console.log("res.doesNotExist.throwAnError")).
  // catch(err => err);
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
  logseq.Editor.registerSlashCommand("Create Inline Literature Note", async() => {
    dispatchPaperpileParse(0);
  });
  logseq.Editor.registerSlashCommand("Create Inline Link to Lit Note", async() => {
    dispatchPaperpileParse(1);
  });
  logseq.Editor.registerSlashCommand("Search and open reference as page", async() => {
    dispatchPaperpileParse(2);
  });
}

logseq.ready(main).catch(console.error);
