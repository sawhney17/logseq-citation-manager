import "@logseq/libs";
import "virtual:windi.css";

import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { logseq as PL } from "../package.json";
import {
  BlockIdentity,
  SettingSchemaDesc,
} from "@logseq/libs/dist/LSPlugin.user";
import * as BibTeXParser from "@retorquere/bibtex-parser";
import SearchBar from "./searchbar";
import { handleClosePopup } from "./handleClosePopup";
const css = (t, ...args) => String.raw(t, ...args);

interface cachedBlock {
  uuid: BlockIdentity;
  originalContent: string;
}

export var cachedOperations: cachedBlock[] = [];
export const performCachedOperations = () => {
  cachedOperations = cachedOperations.reverse()
  cachedOperations.forEach((operation) => {
    if (operation.uuid) {
      logseq.Editor.updateBlock(operation.uuid, operation.originalContent);
    }
  });
  cachedOperations = [];
};
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
    description:
      "Enter the name of the template page. On creating a literature note, this page's template will be followed. You can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} as placeholders",
    default: "",
    type: "string",
  },
  {
    key: "templateBlock",
    title: "Template Block",
    description:
      "Enter the name of the template block, use logseq's in built template feature or smartblocks. On inserting inline references, this block's template will be followed. You can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} as placeholders",
    default: "",
    type: "string",
  },
  {
    key: "pageTitle",
    title: "Page Title",
    description:
      "Enter the template for the title of the page. You can use {author}, {title}, {journal}, {year}, {volume}, {number}, {pages}, {doi}, {url} as placeholders",
    default: "{citekey}",
    type: "string",
  },
];

const dispatchPaperpileParse = async (mode, uuid) => {
  const block = await logseq.Editor.getBlock(uuid);
  if (paperpile === "") {
    getPaperPile(mode, uuid);
  } else {
    logseq.Editor.updateBlock(uuid, `inserting...`);
    cachedOperations.push({
      uuid: uuid,
      originalContent: block.content,
    });
    console.log(cachedOperations)
    showDB(paperpileParsed, mode, uuid, block.content);
  }
};
const createDB = (mode, uuid) => {
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
  dispatchPaperpileParse(mode, uuid);
};

const showDB = (parsed, mode, uuid, oc) => {
  paperpileParsed = parsed;
  console.log("mode is ", mode);

  ReactDOM.unmountComponentAtNode(document.getElementById("app"));
  console.log(uuid)
  ReactDOM.render(
    <React.StrictMode>
      <SearchBar
        paperpileParsed={{ parse: paperpileParsed, currentModeInput: mode, currentUuid: uuid, originalContent: oc}}
      />
    </React.StrictMode>,
    document.getElementById("app")
  );
  logseq.showMainUI();
  handleClosePopup();
};

const getPaperPile = async (mode, uuid) => {
  console.log(`file://${logseq.settings.paperpilePath}`);
  axios
    .get(`file://${logseq.settings.paperpilePath}`)
    .then((result) => {
      paperpile = result.data;
      createDB(mode, uuid);
    })
    .catch((err) => {
      logseq.App.showMsg(
        "Whoops!, Something went wrong when fetching the citation DB. Please check the path and try again."
      );
      console.log(err);
    });

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
      // show() {
      //   dispatchPaperpileParse(0, uuid);
      // },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  logseq.App.registerCommand(
    "openAsPage",
    {
      key: "openedLitNote",
      label: "Search and open reference as page",
      keybinding: { binding: "mod+shift+o" },
    },
    (e) => {
      dispatchPaperpileParse(1, e.uuid);
    }
  );
  logseq.App.registerCommand(
    "insertLink",
    {
      key: "inlineLitNote",
      label: "Create Inline Link to Lit Note",
      keybinding: { binding: "mod+shift+l" },
    },
    (e) => {
      dispatchPaperpileParse(2, e.uuid);
    }
  );
  logseq.App.registerCommand(
    "insertInline",
    {
      key: "inlineNote",
      label: "Create Inline Note",
      keybinding: { binding: "mod+shift+i" },
    },
    (e) => {
      dispatchPaperpileParse(0, e.uuid);
    }
  );
  logseq.Editor.registerSlashCommand(
    "Create Inline Literature Note",
    async (e) => {
      dispatchPaperpileParse(0, e.uuid);
    }
  );
  logseq.Editor.registerSlashCommand(
    "Create Inline Link to Lit Note",
    async (e) => {
      dispatchPaperpileParse(2, e.uuid);
    }
  );
  logseq.Editor.registerSlashCommand(
    "Search and open reference as page",
    async (e) => {
      dispatchPaperpileParse(1, e.uuid);
    }
  );
}

logseq.ready(main).catch(console.error);
