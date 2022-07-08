// import { performCachedOperations } from "./main";

export const handleClosePopup = () => {
  //ESC
  document.addEventListener(
    'keydown',
    function (e) {
      if (e.keyCode === 27) {
        logseq.hideMainUI({ restoreEditingCursor: true });
        // performCachedOperations();
      }
      e.stopPropagation();
    },
    false
  );
};
