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

const parseContent = (type= '', citeKey = "", fields = {}) => {
  console.log("parseContent")
  console.log(type)
  console.log(citeKey)
  console.log(fields)
}

const createLiteratureNote = (note) => {
  //create a page 
  logseq.Editor.createPage(note.key, {})
}

const navigateToLiteratureNote = (note) => {
  console.log("navigateToLiteratureNote")
  parseContent(note.type, note.key, note.fields)
  console.log(note)
}

const insertLiteratureNoteReference = (note) => {
  console.log("insertLiteratureNoteReference")
  console.log(note)
}

const insertLiteratureNoteInline = (note) => {
  console.log("insertLiteratureNoteInline")
  console.log(note)
}

export const actionRouter = (actionKey: any, note) => {
  console.log("actionRouterCalled")
  console.log(actionKey)
  if (actionKey == "inline" || actionKey == 0) {
    insertLiteratureNoteInline(note);
  }
  if (actionKey == "goToReference" || actionKey == 1) {
    navigateToLiteratureNote(note);
  }
  if (actionKey == "insertLink" || actionKey == 2) {
    insertLiteratureNoteReference(note);
  }
}
