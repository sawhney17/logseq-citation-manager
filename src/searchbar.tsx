import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import "@logseq/libs";
import "./tailwind.css";
import MiniSearch from "minisearch";
// import Switch from "react-input-switch";
// import SegmentedControl from "rn-segmented-control";
import SegmentedControl from "./segmentedControl";
import { actionRouter } from "./utils";
import { shouldEditAgain, setEditAgain, resetEditAgain } from "./main";

const modes = ["inline", "goToReference", "insertLink"];
const SearchBar: React.FC<{ paperpileParsed }> = (paperpileParsed, uuid) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchRef] = React.useState([]);
  const [highlightedResult, setHighlightedRef] = React.useState(null);
  const [smartblocks, setSmartblocks] = React.useState([]);
  const firstUpdate = useRef(true);
  const [currentMode, setCurrentMode] = useState(
    paperpileParsed.paperpileParsed.currentModeInput
  );
  //on render focus on the input citationSearchbar
  React.useEffect(() => {
    setTimeout(() => {
      const input = document.getElementById("citationSearchbar");
      if (input) {
        input.focus();
      }
    }, 100);
  }, []);
  const currentModeRef = useRef(currentMode);

  const setCurrentModeRef = (mode: string) => {
    currentModeRef.current = mode;
    setCurrentMode(mode);
  };

  const highlightedRef = React.useRef(highlightedResult);
  const setHighlightedResult = (data) => {
    highlightedRef.current = data;
    setHighlightedRef(data);
  };

  const searchRef = React.useRef(searchResults);
  const setSearchResults = (data) => {
    searchRef.current = data;
    setSearchRef(data);
  };
  function updateTemplates() {
    setSmartblocks(
      paperpileParsed.paperpileParsed.parse
        .map((item) => {
          try {
            let pair;
            if (logseq.settings.indexAbstracts) {
              pair = {
                title: item.fields.title[0],
                citekey: item.key,
                // All authors joined into a single string
                authors: item.fields.author?.length > 0 ? item.fields.author.toString().toLowerCase().replaceAll(/,/g, "") : (
                  item.fields.editor?.length > 0 ? item.fields.editor.toString().toLowerCase().replaceAll(/,/g, "") : ""),
                abstract: item.fields.abstract,
              };
            } else {
              pair = {
                title: item.fields.title[0],
                // All authors joined into a single string
                authors: item.fields.author.toString().toLowerCase().replaceAll(/,/g, ""),
                citekey: item.key,
              };
            }
            return { ...pair, ...item };
          } catch (e) {}
        })
        .filter(Boolean)
    );
  }
  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  React.useEffect(() => {
    let results: Array<any>;
    updateTemplates();
    if (searchTerm != "") {
      if (!logseq.settings.smartsearch) {
        results = smartblocks.filter((template) => {
          if (template.fields.title[0] != undefined) {
            return (
              template.fields.title[0].toLowerCase() +
              template.fields.author.toString().toLowerCase().replaceAll(/,/g, "")
            ).includes(searchTerm.toLowerCase());
          }
        });
      } else {
        let miniSearch = new MiniSearch({
          fields: ["title", "abstract", "citekey", "year"], // fields to index for full-text search
          storeFields: ["key", "fields", "type"], // fields to return with search results
          idField: "key",
          searchOptions: {
            boost: { title: 3 },
            prefix: true,
            fuzzy: 0.2,
          },
        });
        miniSearch.addAll(smartblocks);
        results = miniSearch.search(searchTerm);
      }
    } else {
      results = smartblocks;
    }
    results.length = Math.min(
      results.length,
      logseq.settings.resultsCount || 100
    );
    setSearchResults(results);
  }, [searchTerm]);
  React.useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setHighlightedResult(0);
  }, [searchResults]);

  React.useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    document.addEventListener("keydown", keyControl);
    updateHighlight();
    return () => document.removeEventListener("keydown", keyControl);
  }, [highlightedResult]);

  const handleEnter = (index = null) => {
    console.log(shouldEditAgain());
    if (shouldEditAgain()) {
      setEditAgain();
      const resultKey = index == null ? highlightedResult : index;
      if (resultKey != null) {
        let citationDetails = searchRef.current[resultKey];
        const uuidCurrent = paperpileParsed.paperpileParsed.currentUuid;
        const ocCurrent = paperpileParsed.paperpileParsed.originalContent;
        actionRouter(
          currentModeRef.current,
          citationDetails,
          uuidCurrent,
          ocCurrent
        );
      }
    }
  };
  const keyControl = (event) => {
    if (event.keyCode === 40) {
      if (highlightedRef.current < searchRef.current.length - 1) {
        let hello = highlightedRef.current + 1;
        setHighlightedResult(hello);
      } else {
        setHighlightedResult(1);
        setHighlightedResult(0);
      }
      event.preventDefault();
    }
    if (event.keyCode === 38) {
      //Up arrow
      if (highlightedResult > 0) {
        setHighlightedResult(highlightedRef.current - 1);
      } else {
        setHighlightedResult(searchRef.current.length - 1);
        setHighlightedResult(1);
        setHighlightedResult(0);
      }
      event.preventDefault();
    }
    if (event.keyCode === 13) {
      //Enter
      handleEnter();

      event.preventDefault();
    }
    event.handled = true;
  };

  const updateHighlight = () => {
    for (const x in searchRef.current) {
      if (x == highlightedResult) {
        document
          .getElementById(searchRef.current[x].key)
          .classList.add("bg-[#4c4c4c]");
        var element = document.getElementById(searchRef.current[x].key);
        // document.getElementById('citationScrollableDiv').scrollTop = element.offsetTop - 3*element.offsetHeight;
      } else {
        document
          .getElementById(searchRef.current[x].key)
          .classList.remove("bg-[#4c4c4c]");
      }
    }
  };

  return (
    <div className="overlay">
      <div className="flex justify-center w-screen z-0">
        <div className="smartblock-inserter w-full">
          <div className="w-full p-2">
            <div>
              <input
                type="text"
                className="cp__palette-input w-full"
                placeholder="Search for a Reference..."
                value={searchTerm}
                onChange={handleChange}
                id="citationSearchbar"
              />
              <SegmentedControl
                name="group-1"
                callback={(val) => setCurrentModeRef(val)}
                defaultIndex={currentModeRef.current}
                controlRef={useRef()}
                segments={[
                  {
                    label: "Insert Inline",
                    value: "inline",
                    ref: useRef(),
                  },
                  {
                    label: "Go To Reference",
                    value: "goToReference",
                    ref: useRef(),
                  },
                  {
                    label: "Link to Reference",
                    value: "insertLink",
                    ref: useRef(),
                  },
                ]}
              />
            </div>
          </div>
          <div className="w-full scrollable p-2" id="citationScrollableDiv">
            <ul className="w-full text-sm ">
              {searchResults.map((item, index) => (
                <div
                  id={item.key}
                  onClick={() => {
                    handleEnter(index);
                  }}
                  className="hover:bg-[#4c4c4c] p-2 rounded-lg flex flex-auto"
                >
                  <div className=" max-w-4">
                    <div
                      title="template"
                      className="text-xs rounded border mr-2 px-1 w-5"
                      onClick={() => {
                        handleEnter(index);
                      }}
                    >
                      C
                    </div>
                  </div>
                  <li
                    className="inline-block px-2 searchItem"
                    onClick={() => {
                      handleEnter(index);
                    }}
                  >
                    {item.fields.title[0]}
                    <div><i>{item.fields.author.toString()}</i></div>
                  </li>
                </div>
              ))}
              {/* {searchResults.for((item, index) => (
                <div
                  id={item.key}
                  onClick={() => {
                    handleEnter(index);
                  }}
                  className="hover:bg-[#4c4c4c] p-2 rounded-lg flex flex-auto"
                >
                  <div className=" max-w-4">
                    <div
                      title="template"
                      className="text-xs rounded border mr-2 px-1 w-5"
                      onClick={() => {
                        handleEnter(index);
                      }}
                    >
                      C
                    </div>
                  </div>
                  <li
                    className="inline-block px-2 searchItem"
                    onClick={() => {
                      handleEnter(index);
                    }}
                  >
                    {item.fields.title[0]}
                  </li>
                </div>
              ))} */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
