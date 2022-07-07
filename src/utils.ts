import React, { useState } from "react";
import { useMountedState } from "react-use";
// import * as BibTeXParser from "@retorquere/bibtex-parser";
import { BlockEntity, PageIdentity } from "@logseq/libs/dist/LSPlugin.user";

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
  template = template.replaceAll("{citekey}", citeKey);
  template = template.replaceAll("{type}", type);
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
      logseq.Editor.insertBlock(currentBlock.uuid, `[[${note.key}]]`, {
        sibling: false,
      });
    } else {
      logseq.App.showMsg(
        "Oops, looks like this wasn't called from inside a block. Please try again!"
      );
    }
  }
};

const insertLiteratureNoteInline = async (note) => {
  const currentBlock = await logseq.Editor.getCurrentBlock();
  if (currentBlock != null) {
    await logseq.Editor.insertBatchBlock(
      currentBlock.uuid,
      await parseTemplateBlock(note.type, note.key, note.fields),
      { sibling: true }
    );
  }
};

export const actionRouter = (actionKey: any, note, uuid = undefined) => {
  if (actionKey == "inline" || actionKey == 0) {
    insertLiteratureNoteInline(note);
  }
  if (actionKey == "goToReference" || actionKey == 1) {
    createLiteratureNote(note, true);
  }
  if (actionKey == "insertLink" || actionKey == 2) {
    createLiteratureNote(note, false);
  }
  logseq.hideMainUI();
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
function triggerParse(block) {
  if (block.content) {
    console.log("hi");
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
