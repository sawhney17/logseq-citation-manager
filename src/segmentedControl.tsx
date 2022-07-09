// Credits to https://letsbuildui.dev/articles/building-a-segmented-control-component
import React from "react";
import { useRef, useState, useEffect } from "react";
import "./styles.css";

const SegmentedControl = ({
  name,
  segments,
  callback,
  defaultIndex,
  controlRef,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const componentReady = useRef();
 
  // Determine when the component is "ready"
  useEffect(() => {
    //@ts-expect-error
    componentReady.current = true;
  }, []);

  useEffect(() => {
    const activeSegmentRef = segments[activeIndex].ref;
    setTimeout(() => {
      const { offsetWidth, offsetLeft } = activeSegmentRef.current;
      const { style } = controlRef.current;
      style.setProperty("--highlight-width", `${offsetWidth}px`);
      style.setProperty("--highlight-x-pos", `${offsetLeft}px`);
    }, 40);
  }, [activeIndex, callback, controlRef, segments]);

  const onInputChange = (value, index) => {
    setActiveIndex(index);
    callback(value, index);
  };

  return (
    <div className="controls-container" ref={controlRef}>
      <div className={`controls ${componentReady.current ? "ready" : "idle"}`}>
        {segments?.map((item, i) => (
          <div
            key={item.value}
            className={`segment ${i === activeIndex ? "active" : "inactive"}`}
            ref={item.ref}
          >
            <input
              type="radio"
              value={item.value}
              id={item.label}
              name={name}
              onChange={() => onInputChange(item.value, i)}
              checked={i === activeIndex}
            />
            <label htmlFor={item.label}>{item.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
