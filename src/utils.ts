import React, { useState } from "react";
import { useMountedState } from "react-use";
// import * as BibTeXParser from "@retorquere/bibtex-parser";
import { BlockEntity, PageIdentity } from "@logseq/libs/dist/LSPlugin.user";
import { cachedOperations, performCachedOperations } from "./main";

const reg = /{.*}/g;
var data = null;
var type = "";
var citekey = "";
var filters = "";

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

const parseTemplate = (type = "", citeKey = "", fields = {}, text) => {
  let template = text;
  console.log(fields);
  template = template.replaceAll("{citekey}", citeKey);
  template = template.replaceAll("{type}", type);
  template = template.replaceAll("{type}", type);
  try {
    template = template.replaceAll(
      /{author\s*lastname}/g,
      fields.author[0].split(",")[0]
    );
    template = template.replaceAll(
      /{author\s*firstname}/g,
      fields.author[0].split(",")[1]
    );
  } catch (error) {
    console.error(error);
  }

  for (const key in fields) {
    if (fields.hasOwnProperty(key)) {
      const element = fields[key];
      template = template.replaceAll(`{${key}}`, element[0]);
    }
  }
  template = template.replaceAll(/{.*}/g, "");
  console.log(template);
  return template;
};
const createLiteratureNote = async (note, isNoteReference) => {
  if ((await logseq.Editor.getPage(note.key)) == null) {
    const blocks = await parseTemplatePage(note.type, note.key, note.fields);
    logseq.Editor.createPage(
      parseTemplate(
        note.type,
        note.key,
        note.fields,
        logseq.settings.pageTitle
      ),
      {},
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
      logseq.Editor.insertBlock(currentBlock.uuid, `[[${note.key}]]`);
    } else {
      logseq.App.showMsg(
        "Oops, looks like this wasn't called from inside a block. Please try again!"
      );
    }
  }
  performCachedOperations();
};

const insertLiteratureNoteInline = async (note, uuid) => {
  const currentBlock = await logseq.Editor.getBlock(uuid);
  const blocks = await parseTemplateBlock(note.type, note.key, note.fields);
  console.log(blocks);
  // setTimeout(async() => {

  if (currentBlock != null) {
    await logseq.Editor.insertBatchBlock(currentBlock.uuid, blocks, {
      sibling: true,
    });
  }
};
// , 1000);};

export const actionRouter = (actionKey: any, note, uuid = undefined, oc  = undefined) => {
  if (actionKey == "inline" || actionKey == 0) {
    console.log(uuid);
    insertLiteratureNoteInline(note, uuid);
  }
  if (actionKey == "goToReference" || actionKey == 1) {
    createLiteratureNote(note, true);
  }
  if (actionKey == "insertLink" || actionKey == 2) {
    createLiteratureNote(note, false);
  }
  logseq.hideMainUI();
  //provided uuid and Oc is not null, update block
  console.log(uuid)
  console.log(oc)
  console.log("oc")
  if (uuid != undefined && oc != undefined) {
    logseq.Editor.updateBlock(uuid, oc);
  }
};

const parseTemplatePage = async (type2, citekey2, filters2) => {
  var initialPage: PageIdentity[] = await logseq.Editor.getPageBlocksTree(
    logseq.settings.templatePage
  );
  data = initialPage;
  type = type2;
  citekey = citekey2;
  filters = filters2;
  data.forEach((item) => {
    triggerParse(item);
  });
  console.log(data);
  return data;
};

const parseTemplateBlock = async (type2, citekey2, filters2) => {
  var initialBlock: BlockEntity[] = await logseq.DB.q(
    `(property template ${logseq.settings.templateBlock})`
  );
  data = await logseq.Editor.getBlock(initialBlock[0].uuid, {
    includeChildren: true,
  });
  type = type2;
  citekey = citekey2;
  filters = filters2;
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
      let formattedMatch = parseTemplate(type, citekey, filters, currentMatch);
      let newRegexString = toBeParsed.replace(currentMatch, formattedMatch);
      block.content = newRegexString;
      block.properties = {};
    }
  }
  if (block.children) {
    block.children.map(triggerParse);
  }
}
