import { useEffect, useRef, useState } from "react";
import * as Utils from "../../flyff/flyffutils";

function Dropdown({ options, onSelectionChanged, valueKey, onRemove, style, orderedKeys }) {
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
        <div className="flyff-dropdown" style={{ ...style, minWidth: '200px' }} ref={containerRef}>
            <div onClick={toggleDropdown} className="flyff-dropdown-arrow" role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDropdown();
                }
            }}>
                <span className="dropdown-value" style={{ fontSize: '14px' }}>{options[valueKey]}</span>
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
                        (orderedKeys ? orderedKeys : Object.keys(options)).map((key, index) => {
                            // 战士系职业ID映射
                            const warriorJobs = {
                                '764': '[1转]战士',
                                '5330': '[2转]骑士',
                                '2246': '[2转]刀锋战士',
                                '28125': '[3转]圣殿骑士',
                                '23509': '[3转]屠戮者'
                            };
                            
                            // 检查是否是战士系职业
                            const isWarriorJob = Object.keys(warriorJobs).includes(key);
                            
                            return (
                                <div 
                                    key={key} 
                                    className={`dropdown-option ${key === valueKey ? 'selected' : ''} ${key.startsWith('group_') ? 'dropdown-group-header' : ''}`}
                                    style={{ position: "relative", fontSize: '13px' }}
                                >
                                    {/* 战士系连线 */}
                                    {isWarriorJob && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: 0, 
                                            left: 0, 
                                            width: '100%', 
                                            height: '100%', 
                                            pointerEvents: 'none',
                                            zIndex: 1
                                        }}>
                                            {/* [1转]战士 → [2转]骑士 */}
                                            {key === '764' && (
                                                <svg style={{ position: 'absolute', top: '100%', left: '8px', width: '100%', height: '40px' }}>
                                                    <path 
                                                        d="M 0 0 V 20 H 16 V 40" 
                                                        stroke="rgba(200, 200, 200, 0.3)" 
                                                        strokeWidth="1" 
                                                        strokeDasharray="2,2" 
                                                        fill="none"
                                                    />
                                                </svg>
                                            )}
                                            {/* [1转]战士 → [2转]刀锋战士 */}
                                            {key === '764' && (
                                                <svg style={{ position: 'absolute', top: '100%', left: '8px', width: '100%', height: '80px' }}>
                                                    <path 
                                                        d="M 0 0 V 60 H 16 V 80" 
                                                        stroke="rgba(200, 200, 200, 0.3)" 
                                                        strokeWidth="1" 
                                                        strokeDasharray="2,2" 
                                                        fill="none"
                                                    />
                                                </svg>
                                            )}
                                            {/* [2转]骑士 → [3转]圣殿骑士 */}
                                            {key === '5330' && (
                                                <svg style={{ position: 'absolute', top: '100%', left: '8px', width: '100%', height: '80px' }}>
                                                    <path 
                                                        d="M 0 0 V 60 H 16 V 80" 
                                                        stroke="rgba(200, 200, 200, 0.3)" 
                                                        strokeWidth="1" 
                                                        strokeDasharray="2,2" 
                                                        fill="none"
                                                    />
                                                </svg>
                                            )}
                                            {/* [2转]刀锋战士 → [3转]屠戮者 */}
                                            {key === '2246' && (
                                                <svg style={{ position: 'absolute', top: '100%', left: '8px', width: '100%', height: '40px' }}>
                                                    <path 
                                                        d="M 0 0 V 20 H 16 V 40" 
                                                        stroke="rgba(200, 200, 200, 0.3)" 
                                                        strokeWidth="1" 
                                                        strokeDasharray="2,2" 
                                                        fill="none"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                    
                                    {key.startsWith('group_') ? (
                                        <div style={{ fontWeight: 'bold', color: '#d386ff', padding: '4px 0', fontSize: '14px', position: 'relative', zIndex: 2 }}>{options[key]}</div>
                                    ) : (
                                        <>
                                            <div onClick={() => selectOption(key)} style={{ paddingLeft: '16px', position: 'relative', zIndex: 2 }}>{options[key]}</div>
                                            {
                                                onRemove != undefined &&
                                                <button className="flyff-close-button right" onClick={(e) => removeOption(e, key)}>
                                                    <img src={`${Utils.BASE_PATH}/close-icon.svg`} alt="remove" />
                                                </button>
                                            }
                                        </>
                                    )}
                                </div>
                            );
                        })
                    }
                </div>
            }
        </div>
    );
}

export default Dropdown;