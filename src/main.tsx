import "@logseq/libs";
import "virtual:windi.css";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import axios from "axios";
import { logseq as PL } from "../package.json";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";
import * as BibTeXParser from "@retorquere/bibtex-parser";
import SearchBar from "./searchbar";
import { handleClosePopup } from "./handleClosePopup";
import MiniSearch from "minisearch";
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
    key: "referenceFormat",
    title: "Format of created references",
    description: "Enter the desired citation format, use {citekey}",
    default: "{citekey}",
    type: "string",
  },
  {
    key: "pageTemplate",
    title: "Template for the page",
    description: "Enter the path your paperpile DB",
    default: "path/to/paperpile",
    type: "string",
  },
  {
    key: "pageProperties",
    title: "Properties to be added by default",
    description: "Type the properties you want to be added by default",
    default: ["author", "title", "journal", "year", "volume", "number", "pages", "doi", "url"],
    type: "enum",
    enumPicker: "checkbox",
    enumChoices: ["author", "title", "journal", "year", "url", "abstract", "keywords", "publisher"],
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
];

const createDB = () => {
  const options: BibTeXParser.ParserOptions = {
    errorHandler: (err) => {
      console.warn("Citation plugin: error loading BibLaTeX entry:", err);
    },
  };
  const parsed = BibTeXParser.parse(paperpile, options) as BibTeXParser.Bibliography;
  showDB(parsed.entries, 0)
}

const showDB = (parsed, mode) => {
  console.log(parsed)
  paperpileParsed = parsed;
  ReactDOM.render(
    <React.StrictMode>
      <SearchBar paperpileParsed={{ parse: paperpileParsed, currentModeInput: mode}}/>
    </React.StrictMode>,
    document.getElementById("app")
  );
  logseq.showMainUI();
  handleClosePopup();
}
const parseBibtex = async () => {
  
};
const getPaperPile = async () => {
  console.log(`file://${logseq.settings.paperpilePath}`);
  axios.get(`file://${logseq.settings.paperpilePath}`).then((result) => {
    paperpile = result.data;
    createDB();
  });
};
logseq.useSettingsSchema(settings);
function main() {
  console.info(`#${pluginId}: MAIN`);
  function createModel() {
    return {
      show() {
        if (paperpile === "") {
          getPaperPile();
        }
        else {
          showDB(paperpileParsed, 0)
        }
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "template-plugin-open";

  logseq.provideStyle(css`
    .${openIconName} {
      opacity: 0.55;
      font-size: 20px;
      margin-top: 4px;
    }

    .${openIconName}:hover {
      opacity: 0.9;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: openIconName,
    template: `
      <div data-on-click="show" class="${openIconName}">⚙️</div>
    `,
  });
}

logseq.ready(main).catch(console.error);
