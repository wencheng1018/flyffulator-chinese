import { useEffect, useRef, useState } from "react";
import * as Utils from "../../flyff/flyffutils";

function Dropdown({ options, onSelectionChanged, valueKey, onRemove, style, orderedKeys }) {
    const [opened, setOpened] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({ top: "100%" });
    const dropdownRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (opened) {
            requestAnimationFrame(() => {
                if (dropdownRef.current && containerRef.current) {
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const dropdownHeight = dropdownRef.current.offsetHeight || 200;
                    const spaceBelow = window.innerHeight - containerRect.bottom;
                    
                    if (spaceBelow < dropdownHeight + 10 && containerRect.top > dropdownHeight + 10) {
                        setDropdownStyle({ bottom: "100%", top: "auto", marginBottom: "4px" });
                    }
                    else {
                        setDropdownStyle({ top: "100%", bottom: "auto", marginTop: "4px" });
                    }
                }
            });
        }
        else {
            setDropdownStyle({ top: "100%", bottom: "auto", marginTop: "4px" });
        }
    }, [opened]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpened(false);
            }
        }

        if (opened) {
            document.addEventListener("mouseup", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mouseup", handleClickOutside);
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

    function toggleDropdown(e) {
        if (e) {
            e.stopPropagation();
        }
        setOpened(!opened);
    }

    return (
        <div className="flyff-dropdown" style={{ minWidth: '200px', ...style }} ref={containerRef}>
            <div onClick={toggleDropdown} className="flyff-dropdown-arrow" role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    toggleDropdown(e);
                }
            }}>
                <span className="dropdown-value" style={{ fontSize: '14px' }}>{options[valueKey] || ''}</span>
                <img 
                    style={{ transform: opened ? "rotate(180deg)" : "rotate(0deg)" }} 
                    draggable={false} 
                    src={`${Utils.BASE_PATH}/arrow-down.png`} 
                    alt="dropdown arrow"
                />
            </div>
            {
                opened &&
                <div className="flyff-dropdown-options" style={{ ...dropdownStyle, minWidth: '200px' }} ref={dropdownRef}>
                    {
                        (orderedKeys ? orderedKeys : Object.keys(options)).map((key) => (
                            <div 
                                key={key} 
                                className={`dropdown-option ${key === valueKey ? 'selected' : ''} ${key.startsWith('group_') ? 'dropdown-group-header' : ''}`}
                                style={{ position: "relative", fontSize: '13px', cursor: key.startsWith('group_') ? 'default' : 'pointer', zIndex: 1001 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!key.startsWith('group_')) {
                                        selectOption(key);
                                    }
                                }}
                            >
                                {key.startsWith('group_') ? (
                                    <div style={{ fontWeight: 'bold', color: '#d386ff', padding: '4px 0', fontSize: '14px' }}>{options[key]}</div>
                                ) : (
                                    <>
                                        <div style={{ paddingLeft: '16px' }}>{options[key]}</div>
                                        {
                                            onRemove != undefined &&
                                            <button className="flyff-close-button right" onClick={(e) => removeOption(e, key)}>
                                                <img src={`${Utils.BASE_PATH}/close-icon.svg`} alt="remove" />
                                            </button>
                                        }
                                    </>
                                )}
                            </div>
                        ))
                    }
                </div>
            }
        </div>
    );
}

export default Dropdown;