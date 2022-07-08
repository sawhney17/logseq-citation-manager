// import { performCachedOperations } from "./main";

import { originalContentC, uuidOriginals } from "./main";

export const handleClosePopup = () => {
  //ESC
  document.addEventListener(
    'keydown',
    function (e) {
      if (e.keyCode === 27) {
        logseq.hideMainUI({ restoreEditingCursor: true });
        // performCachedOperations();
        logseq.Editor.updateBlock(uuidOriginals, `${originalContentC}`);
      }
      e.stopPropagation();
    },
    false
  );
};
