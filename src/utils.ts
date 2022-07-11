import React, { useState } from "react";
import { useMountedState } from "react-use";
// import * as BibTeXParser from "@retorquere/bibtex-parser";
import { BlockEntity, PageIdentity } from "@logseq/libs/dist/LSPlugin.user";
import { Entry } from "@retorquere/bibtex-parser";
// import { cachedOperations, performCachedOperations } from "./main";

const reg = /{.*}/g;
var data = null;
var type = "";
var citeKey = "";
var fields: { [key: string]: string[] } = {};

export const useAppVisible = () => {
  const [visible, setVisible] = useState(logseq.isMainUIVisible);
  const isMounted = useMountedState();
  React.useEffect(() => {
    const eventName = "ui:visible:changed";
    const handler = async ({ visible }: any) => {
      if (isMounted()) {
        setVisible(visible);
      }
    };
    logseq.on(eventName, handler);
    return () => {
      logseq.off(eventName, handler);
    };
  }, []);
  return visible;
};

export const useSidebarVisible = () => {
  const [visible, setVisible] = useState(false);
  const isMounted = useMountedState();
  React.useEffect(() => {
    logseq.App.onSidebarVisibleChanged(({ visible }) => {
      if (isMounted()) {
        setVisible(visible);
      }
    });
  }, []);
  return visible;
};

const parseTemplate = (text) => {
  var template = text;
  console.log("repl2acements");
  console.log(citeKey);
  console.log(fields);
  console.log(type);
  template = template.replaceAll("{citekey}", citeKey);
  template = template.replaceAll("{key}", citeKey);
  template = template.replaceAll("{type}", type);
  console.log(template);
  try {
    template = template.replaceAll(
      /{author\s*lastname}/g,
      //@ts-ignore-error
      fields.author[0].split(",")[0]
    );
    template = template.replaceAll(
      /{author\s*firstname}/g,
      //@ts-ignore-error
      fields.author[0].split(",")[1]
    );
    template = template.replaceAll(
      /{author\s*lastname}\+/g,
      fields.author.forEach((value) => {
        return value.split(",")[0];
      })
    );
    template = template.replaceAll(
      /{author\s*firstname\+}/g,
      fields.author.forEach((value) => {
        return value.split(",")[1];
      })
    );
  } catch (error) {
    // console.error(error);
  }
  template = template.replaceAll("{file++}", () => {
    let text = "";
    fields.file?.forEach((individualFile) => {
      text =
        text +
        `${logseq.settings.fileTemplate
          .replaceAll(/{filelink}/gi, individualFile)
          .replaceAll(/{citekey}/gi, citeKey)}`;
    });
    return text
  });
  for (const key in fields) {
    if (fields.hasOwnProperty(key)) {
      const element = fields[key];
      template = template.replaceAll(`{${key}}`, element[0]);
      template = template.replaceAll(`{${key}+}`, element.toString());
      template = template.replaceAll(`{${key}++}`, () => {
        let text = "";
        element.forEach((elemental) => {
          text = text + `[[${elemental}]]`;
        });
        return text;
      });
    }
  }
  template = template.replaceAll(/{[A-z]*\+*}/g, "");
  return template;
};
const createLiteratureNote = async (isNoteReference, originalContent, uuid) => {
  const pageTitle = parseTemplate(logseq.settings.pageTitle);
  if ((await logseq.Editor.getPage(pageTitle)) == null) {
    const blocks = await parseTemplatePage();
    logseq.Editor.createPage(
      pageTitle,
      { fun: "block" },
      { redirect: isNoteReference }
    ).then((page) => {
      logseq.Editor.getPageBlocksTree(page.name).then((block2) => {
        logseq.Editor.insertBatchBlock(block2[0].uuid, blocks).then(() => {
          logseq.Editor.removeBlock(block2[0].uuid);
        });
      });
    });
  }

  if (!isNoteReference) {
    const currentBlock = await logseq.Editor.getCurrentBlock();

    if (currentBlock != null) {
      //If logseq.settings.linkAlias is not "" then the formattedLink will be [parseTemplate(linkAlias)]([[pageTitle]])
      const formattedLink =
        logseq.settings.linkAlias != ""
          ? `[${parseTemplate(logseq.settings.linkAlias)}]([[${pageTitle}]])`
          : `[[${pageTitle}]]`;
      logseq.Editor.updateBlock(
        currentBlock.uuid,
        `${originalContent}${formattedLink}`
      );
    } else {
      logseq.App.showMsg(
        "Oops, looks like this wasn't called from inside a block. Please try again!"
      );
      logseq.Editor.updateBlock(uuid, `${originalContent}`);
    }
  } else {
    logseq.App.pushState("page", { name: pageTitle });
    logseq.Editor.updateBlock(uuid, `${originalContent}`);
  }
};

const insertLiteratureNoteInline = async (uuid) => {
  const currentBlock = await logseq.Editor.getBlock(uuid);
  const blocks = await parseTemplateBlock();
  if (currentBlock != null) {
    await logseq.Editor.insertBatchBlock(currentBlock.uuid, blocks, {
      sibling: true,
    });
  }
};
// , 1000);};
//Dispatch document keydown event for teh tab key

export const actionRouter = (
  actionKey: any,
  note: Entry,
  uuid = undefined,
  oc = undefined
) => {
  console.log("This is the new found note data");
  console.log(note);
  console.log(note.type + "is the type");
  type = note.type;
  citeKey = note.key;
  fields = note.fields;

  if (actionKey == "inline" || actionKey == 0) {
    insertLiteratureNoteInline(uuid);
    if (uuid != undefined && oc != undefined) {
      logseq.Editor.updateBlock(uuid, oc);
    }
  }

  if (actionKey == "goToReference" || actionKey == 1) {
    createLiteratureNote(true, oc, uuid);
  }
  if (actionKey == "insertLink" || actionKey == 2) {
    createLiteratureNote(false, oc, uuid);
  }
  logseq.hideMainUI();
  //provided uuid and Oc is not null, update block
};

const parseTemplatePage = async () => {
  var initialPage: PageIdentity[] = await logseq.Editor.getPageBlocksTree(
    logseq.settings.templatePage
  );
  data = initialPage;
  data.forEach((item) => {
    triggerParse(item);
  });
  return data;
};

const parseTemplateBlock = async () => {
  var initialBlock: BlockEntity[] = await logseq.DB.q(
    `(property template ${logseq.settings.templateBlock})`
  );
  data = await logseq.Editor.getBlock(initialBlock[0].uuid, {
    includeChildren: true,
  });
  triggerParse(data);
  return data.children;
};
function triggerParse(block: BlockEntity) {
  if (block.content) {
    delete block.left;
    delete block.file;
    delete block.page;
    delete block.pathrefs;
    delete block.parent;
    delete block.page;
    delete block.level;
    delete block.id;
    let regexMatched = block.content.match(reg);
    for (const x in regexMatched) {
      let toBeParsed = block.content;
      var currentMatch = regexMatched[x];
      let formattedMatch = parseTemplate(currentMatch);
      let newRegexString = toBeParsed.replace(currentMatch, formattedMatch);
      block.content = newRegexString;
      block.properties = {};
    }
  }
  if (block.children) {
    block.children.map(triggerParse);
  }
}
