import { useEffect, useRef, useState } from "react";

function Dropdown({ options, onSelectionChanged, valueKey, onRemove, style }) {
    const [opened, setOpened] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({ top: "110%" });
    const dropdownRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (opened && dropdownRef.current) {
            if (dropdownRef.current.getBoundingClientRect().bottom >= window.innerHeight) {
                setDropdownStyle({ bottom: "110%" });
            }
            else {
                setDropdownStyle({ top: "110%" });
            }
        }
        else {
            setDropdownStyle({ top: "110%" });
        }
    }, [opened]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpened(false);
            }
        }

        if (opened) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [opened]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (!opened) return;

            switch (event.key) {
                case "Escape":
                    setOpened(false);
                    break;
                case "Enter":
                case " ":
                    event.preventDefault();
                    break;
            }
        }

        if (opened) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [opened]);
    
    if (options == null || Object.keys(options).length == 0) {
        return null;
    }

    function selectOption(optionKey) {
        setOpened(false);
        onSelectionChanged(optionKey);
    }

    function removeOption(e, optionKey) {
        e.stopPropagation();
        onRemove(optionKey);
    }

    function toggleDropdown() {
        setOpened(!opened);
    }

    return (
        <div className="flyff-dropdown" style={{ ...style }} ref={containerRef}>
            <div onClick={toggleDropdown} className="flyff-dropdown-arrow" role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDropdown();
                }
            }}>
                <span className="dropdown-value">{options[valueKey]}</span>
                <img 
                    style={{ transform: opened ? "rotate(180deg)" : "rotate(0deg)" }} 
                    draggable={false} 
                    src="/arrow-down.png" 
                    alt="dropdown arrow"
                />
            </div>
            {
                opened &&
                <div className="flyff-dropdown-options" style={dropdownStyle} ref={dropdownRef}>
                    {
                        Object.entries(options).map(([key, value]) => (
                            <div 
                                key={key} 
                                className={`dropdown-option ${key === valueKey ? 'selected' : ''}`}
                                style={{ position: "relative" }}
                            >
                                <div onClick={() => selectOption(key)}>{value}</div>
                                {
                                    onRemove != undefined &&
                                    <button className="flyff-close-button right" onClick={(e) => removeOption(e, key)}>
                                        <img src="close-icon.svg" alt="remove" />
                                    </button>
                                }
                            </div>
                        ))
                    }
                </div>
            }
        </div>
    );
}

export default Dropdown;