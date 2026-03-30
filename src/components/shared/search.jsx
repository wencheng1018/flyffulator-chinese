import { useState, useEffect } from "react";
import { useSearch } from "../../searchcontext";
import { useTranslation } from "react-i18next";

import Slot from '../equipment/inventory/slot';
import pets from "../../assets/Pets.json";
import items from "../../assets/Items.json";
import Entity from "../../flyff/flyffentity";
import skills from "../../assets/Skills.json";
import Context from "../../flyff/flyffcontext";
import * as Utils from "../../flyff/flyffutils";
import ItemElem from "../../flyff/flyffitemelem";
import monsters from "../../assets/Monsters.json";
import housingNpcs from "../../assets/HousingNPCs.json";

function Search() {
    const { isSearchOpen, searchProperties, hideSearch } = useSearch();
    const [results, setResults] = useState([]);
    const [currentQuery, setCurrentQuery] = useState('');
    const { i18n } = useTranslation();

    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
        // 处理中文特殊情况
        if (shortCode === 'zh') {
            shortCode = 'cn'; // Classes.json中使用cn作为中文键
        }
    }
    console.log('Current language:', i18n.resolvedLanguage);
    console.log('Short code:', shortCode);

    // 当角色等级变化时，重新执行搜索以更新装备排序
    useEffect(() => {
        if (isSearchOpen && searchProperties && searchProperties.type == "item") {
            search(currentQuery);
        }
    }, [Context.player.level, isSearchOpen, searchProperties, currentQuery]);

    if (!isSearchOpen) {
        return null;
    }

    function search(query) {
        setCurrentQuery(query);
        let res = [];
        
        console.log('Search function called with query:', query);
        console.log('Search properties:', searchProperties);

        // 即使查询为空，也显示基于角色等级和职业的所有装备
        if (query.length >= 0) {
            // 只对英文进行大小写转换，中文不转换
            if (/^[a-zA-Z\s]+$/.test(query)) {
                query = query.toLowerCase();
            }

            if (searchProperties.type == "item") {
                for (const [, item] of Object.entries(items)) {
                    // 根据角色等级和职业过滤装备
                    if (searchProperties.checkCanUse) {
                        if (!Context.player.canUseItem(item)) {
                            continue;
                        }
                    }

                    if (searchProperties.targetItemLevel != undefined) {
                        if (item.minimumTargetItemLevel != undefined && item.minimumTargetItemLevel > searchProperties.targetItemLevel) {
                            continue;
                        }
                    }

                    if (searchProperties.subcategory != null) {
                        if (searchProperties.subcategory instanceof Array) {
                            if (!searchProperties.subcategory.includes(item.subcategory)) {
                                continue;
                            }
                        }
                        else if (item.subcategory != searchProperties.subcategory) {
                            continue;
                        }
                    }

                    if (searchProperties.category != null) {
                        if (searchProperties.category instanceof Array) {
                            if (!searchProperties.category.includes(item.category)) {
                                continue;
                            }
                        }
                        else if (item.category != searchProperties.category) {
                            continue;
                        }

                        // only display actual pets, not skins or the ones with modified flags                        
                        if (item.category === "raisedpet") {
                            const petFound = Object.values(pets).find((pet) => pet.petItemId === item.id);
                            if (!petFound) {
                                continue;
                            }
                        }
                    }

                    // Powerups are messy, just do their conditions here
                    if (searchProperties.powerup) {
                        let powerupFound = false;
                        if ((item.abilities != undefined && item.duration != undefined) ||
                            item.category == "buff" || item.category == "scroll") {
                            powerupFound = true;
                        }

                        if (!powerupFound) {
                            continue;
                        }
                    }

                    // 直接使用cns键获取中文名称，同时支持英文搜索
                    var cnsName = item.name.cns;
                    var enName = item.name.en;
                    
                    // 调试信息：针对ID为33的"学徒手套"
                    if (item.id === 33) {
                        console.log('Item ID:', item.id);
                        console.log('CNS Name:', cnsName);
                        console.log('EN Name:', enName);
                        console.log('Query:', query);
                        console.log('CNS Match:', cnsName && cnsName.includes(query));
                        console.log('EN Match:', enName && enName.toLowerCase().includes(query.toLowerCase()));
                    }
                    
                    // 如果查询为空，直接添加符合条件的装备
                    if (query === '') {
                        res.push(new ItemElem(item));
                        continue;
                    }
                    
                    // 检查中文名称是否匹配
                    if (cnsName && cnsName.includes(query)) {
                        console.log('Adding item by CNS match:', item.id, cnsName);
                        res.push(new ItemElem(item));
                        continue;
                    }
                    
                    // 检查英文名称是否匹配（不区分大小写）
                    if (enName && enName.toLowerCase().includes(query.toLowerCase())) {
                        console.log('Adding item by EN match:', item.id, enName);
                        res.push(new ItemElem(item));
                        continue;
                    }

                    if (searchProperties.searchByStats && item.abilities != undefined) {
                        for (const ability of item.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                res.push(new ItemElem(item));
                                break;
                            }
                        }
                    }
                }
            }
            else if (searchProperties.type == "monster") {
                for (const [, monster] of Object.entries(monsters)) {
                    if (monster.name.en.toLowerCase().includes(query)) {
                        res.push(new Entity(monster));
                    }
                }

                res.sort((a, b) => a.level - b.level);
            }
            else if (searchProperties.type == "skill") {
                for (const [, skill] of Object.entries(skills)) {
                    // 处理技能名称的中文特殊情况
                    let skillLangKey = shortCode;
                    if (shortCode === 'cn') {
                        skillLangKey = 'cns'; // Skills.json中使用cns作为中文键
                    }
                    const skillName = skill.name[skillLangKey] ?? skill.name.en;
                    if (skillName.toLowerCase().includes(query)) {
                        res.push(skill);
                    }
                }
            }
            else if (searchProperties.type == "personalOrCoupleHousingNpc") {
                for (const [, housingNpc] of Object.entries(housingNpcs)) {
                    if (!housingNpc.name.en.includes("Personal House NPC")) {
                        continue;
                    }

                    var selectedLanguageNpcName = housingNpc.name[shortCode] ?? housingNpc.name.en;
                    if (selectedLanguageNpcName.toLowerCase().includes(query)) {
                        // Npcs dont have an icon. Assign a more or less fitting icon here
                        housingNpc.icon = "asschecatsre.png"
                        res.push(housingNpc);
                        continue;
                    }

                    if (searchProperties.searchByStats && housingNpc.abilities != undefined) {
                        for (const ability of housingNpc.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                housingNpc.icon = "asschecatsre.png";
                                res.push(housingNpc);
                                break;
                            }
                        }
                    }
                }
            }
            else if (searchProperties.type == "guildHousingNpc") {
                for (const [, housingNpc] of Object.entries(housingNpcs)) {
                    if (!housingNpc.name.en.includes("Guild House NPC")) {
                        continue;
                    }

                    var selectedLanguageGuildNpcName = housingNpc.name[shortCode] ?? housingNpc.name.en;
                    if (selectedLanguageGuildNpcName.toLowerCase().includes(query)) {
                        // Npcs dont have an icon. Assign a more or less fitting icon here
                        housingNpc.icon = "asschecatsre.png"
                        res.push(housingNpc);
                        continue;
                    }

                    if (searchProperties.searchByStats && housingNpc.abilities != undefined) {
                        for (const ability of housingNpc.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                housingNpc.icon = "asschecatsre.png";
                                res.push(housingNpc);
                                break;
                            }
                        }
                    }
                }
            };
        }

        // 对装备搜索结果进行排序，优先按稀有度从高到低排序
        if (searchProperties.type == "item") {
            // 稀有度排序优先级（从高到低）
            const rarityOrder = {
                'ultimate': 7,
                'legendary': 6,
                'unique': 5,
                'veryrare': 4,
                'rare': 3,
                'uncommon': 2,
                'common': 1
            };
            
            const playerLevel = Context.player.level;
            res.sort((a, b) => {
                // 获取装备的稀有度
                const rarityA = a.itemProp.rarity || 'common';
                const rarityB = b.itemProp.rarity || 'common';
                
                // 首先按稀有度从高到低排序
                const rarityScoreA = rarityOrder[rarityA] || 0;
                const rarityScoreB = rarityOrder[rarityB] || 0;
                
                if (rarityScoreA !== rarityScoreB) {
                    return rarityScoreB - rarityScoreA;
                }
                
                // 稀有度相同时，按等级排序
                const levelA = a.itemProp.minimumTargetItemLevel || 0;
                const levelB = b.itemProp.minimumTargetItemLevel || 0;
                
                // 首先，将符合当前等级的装备排在前面
                const aUsable = levelA <= playerLevel;
                const bUsable = levelB <= playerLevel;
                
                if (aUsable && !bUsable) return -1;
                if (!aUsable && bUsable) return 1;
                
                // 对于都符合当前等级的装备，按照等级从高到低排序
                if (aUsable && bUsable) {
                    return levelB - levelA;
                }
                
                // 对于都不符合当前等级的装备，按照等级从低到高排序
                return levelA - levelB;
            });
        }
        
        setResults(res);
    }

    function close() {
        setResults([]);
        hideSearch();
    }

    function handleItemClick(result) {
        searchProperties.onSet(result);
        close();
    }

    return (
        <div className="search-modal" onClick={close} onKeyDown={(e) => { if (e.key == "Escape") close(); }}>
            <div id="search-box" onClick={(e) => e.stopPropagation()}>
                <div className="window-title">{i18n.t("search_title")}</div>
                <div className="window-content">
                    <input type="text" name="query" autoFocus id="search-field" placeholder={i18n.t("search_placeholder", { type: searchProperties.typeLocalization ? (i18n.t(searchProperties.typeLocalization)) : searchProperties.type, })} onChange={e => search(e.target.value)} />
                    {
                        results.length > 0 &&
                        <hr />
                    }
                    <div id="search-results" tabIndex={-1}>
                        {
                            searchProperties.type == "item" &&
                            results.map(result =>
                                <div id="search-result" key={result.itemProp.id} onClick={() => handleItemClick(result)} tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleItemClick(result);
                                        }

                                        if (e.key == "ArrowDown") {
                                            e.currentTarget.nextSibling && e.currentTarget.nextSibling.focus();
                                        }
                                        if (e.key == "ArrowUp") {
                                            e.currentTarget.previousSibling && e.currentTarget.previousSibling.focus();
                                        }

                                        e.preventDefault(); // prevent scrolling
                                    }}
                                >
                                    <Slot className={"slot-item"} content={result} />
                                    <span style={{ color: Utils.getItemNameColor(result.itemProp) }}>{result.itemProp.name[shortCode === 'cn' ? 'cns' : shortCode] ?? result.itemProp.name.en}</span>
                                </div>
                            )
                        }

                        {
                            searchProperties.type == "monster" &&
                            results.map(result =>
                                <div id="search-result" key={result.monsterProp.id} onClick={() => handleItemClick(result)} tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleItemClick(result);
                                        }

                                        if (e.key == "ArrowDown") {
                                            e.currentTarget.nextSibling && e.currentTarget.nextSibling.focus();
                                        }
                                        if (e.key == "ArrowUp") {
                                            e.currentTarget.previousSibling && e.currentTarget.previousSibling.focus();
                                        }

                                        e.preventDefault(); // prevent scrolling
                                    }}
                                >
                                    <img style={{ width: 32, height: 32, objectFit: "contain" }} src={`https://api.flyff.com/image/monster/${result.monsterProp.icon}`} alt={result.monsterProp.name.en} />
                                    <span>{result.monsterProp.name[shortCode] ?? result.monsterProp.name.en} (level {result.monsterProp.level})</span>
                                </div>
                            )
                        }

                        {
                            (searchProperties.type == "skill" || searchProperties.type == "personalOrCoupleHousingNpc" || searchProperties.type == "guildHousingNpc") &&
                            results.map(result =>
                                <div id="search-result" key={result.id} onClick={() => handleItemClick(result)} tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleItemClick(result);
                                        }

                                        if (e.key == "ArrowDown") {
                                            e.currentTarget.nextSibling && e.currentTarget.nextSibling.focus();
                                        }
                                        if (e.key == "ArrowUp") {
                                            e.currentTarget.previousSibling && e.currentTarget.previousSibling.focus();
                                        }

                                        e.preventDefault(); // prevent scrolling
                                    }}
                                >
                                    <Slot className={"slot-skill"} content={result} />
                                    <span>{(() => {
                                        // 处理技能名称的中文特殊情况
                                        let nameLangKey = shortCode;
                                        if (shortCode === 'cn') {
                                            nameLangKey = 'cns'; // Skills.json中使用cns作为中文键
                                        }
                                        return result.name[nameLangKey] ?? result.name.en;
                                    })()}</span>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;
