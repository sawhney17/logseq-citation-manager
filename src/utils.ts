import React, { useState } from "react";
import { useMountedState } from "react-use";
import * as BibTeXParser from '@retorquere/bibtex-parser';

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

const parseProperties = (type = '', citeKey = "", fields = {}, isPage: boolean) => {
  let desiredProperties;
  if (isPage) {
    desiredProperties = logseq.settings.pageProperties
  }
  else {
    desiredProperties = logseq.settings.inlineReferenceProperties
  }
  //Loop through each item in desired properties. If "fields"  contains that property, add it to a new object
  const newFields = {}
  //If desired properties requires type or citeKey, add them to the new object
  if (desiredProperties.includes('type')) {
    newFields["type"] = type
  }
  if (desiredProperties.includes('citeKey')) {
    newFields["citeKey"] = citeKey
  }
  desiredProperties.forEach((property) => {
    if (fields[property]) {
      newFields[property] = fields[property][0]
    }
  })
  console.log(newFields)
  //Create a new page with the new fields
  return newFields
}
const parseTemplate = (type = '', citeKey = "", fields = {}, isPage: boolean, isSecondBlock = false) => {
  let template = ''
  if (isPage) {
    if (logseq.settings.pageFirstBlock != '') {
      template = logseq.settings.pageFirstBlock
    }
  }
  else {

    if (!isSecondBlock) {
      template = logseq.settings.inlineReferenceFirstBlock
    }
    else {
      if (logseq.settings.inlineReferenceSecondBlock != '') {
        template = logseq.settings.inlineReferenceSecondBlock
      }
    }
    // }
  }
  for (const key in fields) {
    if (fields.hasOwnProperty(key)) {
      const element = fields[key];
      template = template.replaceAll(`{${key}}`, element[0])
    }
  }
  template = template.replaceAll('{key}', citeKey)
  template = template.replaceAll('{type}', type)
  template = template.replaceAll(/{.*}/g, "")
  return template
}
const createLiteratureNote = async (note, toRedirect) => {
  //create a page
  let pageProperties = parseProperties(note.type, note.key, note.fields, true)
  const page = await logseq.Editor.createPage(note.key, pageProperties, { redirect: toRedirect })
  //create a block on teh page
  if (parseTemplate(note.type, note.key, note.fields, true) != '') {
    logseq.Editor.upsertBlockProperty(page.originalName, 'content', parseTemplate(note.type, note.key, note.fields, true))
  }
}

const navigateToLiteratureNote = (note) => {
  createLiteratureNote(note, true)
}

const insertLiteratureNoteReference = async (note) => {
  createLiteratureNote(note, false)
  const currentBlock = await logseq.Editor.getCurrentBlock()
  if (currentBlock != null) {
    logseq.Editor.insertBlock(currentBlock.uuid, `[[${note.key}]]`)
  }
  else {
    logseq.App.showMsg("Oops, looks like this wasn't called from inside a block. Please try again!")
  }
}

const insertLiteratureNoteInline = async (note) => {
  console.log("run")
  const currentBlock = await logseq.Editor.getCurrentBlock()
  if (currentBlock != null) {
    const newBlock = await logseq.Editor.insertBlock(currentBlock.uuid, parseTemplate(note.type, note.key, note.fields, false))
    if (parseTemplate(note.type, note.key, note.fields, false, true) != '') {
      logseq.Editor.insertBlock(newBlock.uuid, parseTemplate(note.type, note.key, note.fields, false, true))
    }

  }
}

export const actionRouter = (actionKey: any, note, uuid = undefined) => {
  // console.log("actionRouterCalled")
  // console.log(actionKey)
  if (actionKey == "inline" || actionKey == 0) {
    insertLiteratureNoteInline(note);
  }
  if (actionKey == "goToReference" || actionKey == 1) {
    navigateToLiteratureNote(note);
  }
  if (actionKey == "insertLink" || actionKey == 2) {
    insertLiteratureNoteReference(note);
  }
  logseq.hideMainUI()
}