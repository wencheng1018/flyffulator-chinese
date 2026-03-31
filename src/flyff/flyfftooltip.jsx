import * as Utils from "../flyff/flyffutils";
import ItemElem from "../flyff/flyffitemelem";
import Context from "../flyff/flyffcontext";

/**
 * Create a tooltip for the given item or skill
 * @param {object} content The item or skill
 * @param {object} i18n Localization
 * @returns a JSX element conatining the tooltip
 */
export function createTooltip(content, i18n) {
    if (content instanceof ItemElem) {
        return setupItem(content, i18n);
    }
    else if (content.passive != undefined) {
        return setupSkill(content, i18n);
    }
    else if (content.consumedPoints != undefined) {
        return setupPartySkill(content, i18n);
    }
    else {
        return setupHousingNpc(content, i18n);
    }
}

/**
 * Get the tooltip text for the given item
 * @param {ItemElem} itemElem The item elem
 * @param {object} i18n Localization
 */
function setupItem(itemElem, i18n) {
    const out = [];
    const itemProp = itemElem.itemProp;
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
        // 处理中文特殊情况
        if (shortLanguageCode === 'zh') {
            shortLanguageCode = 'cn'; // Classes.json中使用cn作为中文键
        }
    }

    const isUltimate = itemProp.rarity == "ultimate";

    if (isUltimate) {
        out.push(<img src={`${Utils.BASE_PATH}/ultimate-icon.png`} style={{ height: "18px" }} className="rainbow-background"></img>);
    }

    // Ultimate jewels

    for (let i = 0; i < itemElem.getMaximumUltimateJewelSlots(); ++i) {
        if (i < itemElem.ultimateJewels.length) {
            out.push(<img src={`https://api.flyff.com/image/item/${itemElem.ultimateJewels[i].itemProp.icon}`} style={{ height: "18px", marginLeft: 3 }} className="rainbow-image"></img>);
        }
        else {
            out.push(<img src={`https://api.flyff.com/image/item/placeholderjewel.png`} style={{ height: "18px", marginLeft: 3 }}></img>);
        }
    }

    // Name

    if (isUltimate) {
        out.push(<br />); // Line break for all the ultimate tag and jewels
    }

    const statAwakeString = Utils.getStatAwakeTitle(itemElem, i18n);
    // 处理装备名称的中文特殊情况
    let itemNameLangKey = shortLanguageCode;
    if (shortLanguageCode === 'cn') {
        itemNameLangKey = 'cns'; // Items.json中使用cns作为中文键
    }

    out.push(<span style={{
        fontWeight: 700,
        color: Utils.getItemNameColor(itemProp)
    }}>{typeof itemProp.name === 'string' ? itemProp.name : (itemProp.name[itemNameLangKey] ?? itemProp.name.en)} {statAwakeString}</span>);

    // TODO: Origin awakes (STA+, etc.)

    if (itemElem.upgradeLevel > 0) {
        out.push(<span style={{ color: Utils.getItemNameColor(itemProp), fontWeight: 700 }}> +{itemElem.upgradeLevel}</span>);
    }

    if (itemElem.piercings.length > 0) {
        out.push(<span style={{ color: "#d386ff" }}> ({itemElem.piercings.length}/{itemElem.piercings.length})</span>)
    }

    // TODO: Lifestyle stuff

    // Pets

    if (itemProp.category == "raisedpet") {
        out.push("\n[养成宠物]");
    }
    else if (itemProp.category == "pickuppet") {
        out.push("\n[Pick-Up Pet]");
    }
    else if (itemProp.category == "weapon") {
        if (itemProp.twoHanded) {
            out.push(`\n${i18n.t("tooltip_two_handed")}`)
        }
        else {
            out.push(`\n${i18n.t("tooltip_one_handed")}`)
        }
    }

    // Sex

    if (itemProp.sex == "male") {
        out.push(`\n${i18n.t("tooltip_sex_male")}`);
    }
    else if (itemProp.sex == "female") {
        out.push(`\n${i18n.t("tooltip_sex_female")}`);
    }

    // Attack & Defense

    let baseAbility = {};
    let isAttack = false;
    if (itemProp.minAttack != undefined && itemProp.maxAttack != undefined) {
        baseAbility.min = itemProp.minAttack + Context.player.getStat("minability", false);
        baseAbility.max = itemProp.maxAttack + Context.player.getStat("maxability", false);
        isAttack = true;
    }
    else if (itemProp.minDefense != undefined && itemProp.maxDefense != undefined) {
        baseAbility.min = itemProp.minDefense + Context.player.getStat("minability", false);
        baseAbility.max = itemProp.maxDefense + Context.player.getStat("maxability", false);
    }

    if (baseAbility.min != undefined) {
        const mul = itemElem.getUpgradeMultiplier();
        let add = 0;
        const upgradeLevel = itemElem.upgradeLevel + (itemProp.rarity == "ultimate" ? 10 : 0);
        if (upgradeLevel > 0) {
            add = Math.floor(Math.pow(upgradeLevel, 1.5));
        }

        const ability = {
            min: Math.floor(baseAbility.min * mul) + add,
            max: Math.floor(baseAbility.max * mul) + add
        };

        const baseStyle = { color: "#ffffff" };
        if (mul > 1.0) {
            baseStyle.color = "#00ffe1";
        }
        else if (mul == 1) {
            baseStyle.color = "inherit";
        }
        else if (mul >= 0.8) {
            baseStyle.color = "#00ff00";
        }
        else if (mul >= 0.6) {
            baseStyle.color = "#ff0000";
        }
        else {
            baseStyle.color = "#b2b2b2";
        }

        if (isAttack) {
            out.push(`\n${i18n.t("tooltip_attack")}`);
        }
        else {
            out.push(`\n${i18n.t("tooltip_defense")}`);
        }

        out.push(<span style={baseStyle}>{ability.min} ~ {ability.max}</span>);

        if (baseAbility.min != ability.min || baseAbility.max != ability.max) {
            if (isAttack) {
                out.push(`\n基础攻击: `);
            }
            else {
                out.push(`\n基础防御: `);
            }

            out.push(<span style={{ color: "#b2b2b2" }}>{ability.min} ~ {ability.max}</span>);
        }
    }

    // Blessings

    if (itemProp.category == "fashion") {
        const hasBlessing = itemElem.randomStats.find((e) => e);

        if (hasBlessing) {
            out.push(<span style={{ color: "#d386ff" }}><br />{i18n.t("tooltip_blessing")}</span>);
        }

        for (const blessing of itemElem.randomStats) {
            if (blessing) {
                out.push(<span style={{ color: "#d386ff" }}><br />{Utils.getStatNameByIdOrDefault(blessing.parameter, i18n)}+{blessing.value}{blessing.rate ? "%" : ""}</span>);
            }
        }
    }

    if (itemProp.attackSpeed != undefined) {
        out.push(`\n${i18n.t("tooltip_attack_speed")}${itemProp.attackSpeed}`);
    }

    // Element

    if (itemElem.element != "none" && itemElem.elementUpgradeLevel > 0) {
        out.push(<span style={{ fontWeight: itemElem.hasElementStone ? 800 : 'inherit' }}><br />{i18n.t(`element_${itemElem.element}`)}+{itemElem.elementUpgradeLevel}</span>);
    }
    if (itemProp.element != "none") {
        out.push(`\n${i18n.t("tooltip_element")}${i18n.t(`element_${itemProp.element}`)}`);
    }

    // Stats

    if (itemProp.category != "recovery"
        && itemProp.category != "trans"
        && itemProp.category != "buff"
        && itemProp.category != "scroll"
        && itemProp.abilities != undefined) {
        const abilityStyle = { color: "#ffeaa1" };

        if (itemElem.statRanges.length == 0) {
            for (const ability of itemProp.abilities) {
                out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }
            }
        }
        else {
            for (const ability of itemElem.statRanges) {
                out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.value}</span>);
                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }

                out.push(<span style={abilityStyle}> ({ability.add}~{ability.addMax})</span>);

                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }
            }
        }
    }

    // Ultimate stats

    if (itemProp.possibleRandomStats != undefined) {
        for (let i = 0; i < itemElem.randomStats.length; i++) {
            const stat = itemElem.randomStats[i];
            const color = i < 2 ? "#ffff00" : "#ff9900";
            out.push(<span style={{ color }}><br />{Utils.getStatNameByIdOrDefault(stat.parameter, i18n)}+{stat.value}{stat.rate ? "%" : ""}</span>);
        }
    }

    for (const statAwake of itemElem.statAwake) {
        if (statAwake != null) {
            out.push(`\n${Utils.getStatNameByIdOrDefault(statAwake.parameter, i18n)} +${statAwake.value}`);
        }
    }

    // Jewelery stats

    if (itemProp.category == "jewelry" && itemProp.upgradeLevels != undefined) {
        const abilityStyle = { color: "#ffeaa1" };
        for (const ability of itemProp.upgradeLevels[itemElem.upgradeLevel].abilities) {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
            if (ability.rate) {
                out.push(<span style={abilityStyle}>%</span>);
            }
        }
    }

    // TODO: itemElem origin awake here

    // Armor set upgrade

    if (itemProp.category == "armor") {
        const upgradeLevel = Context.player.getArmorSetUpgradeLevel();
        if (upgradeLevel > 0) {
            const bonus = Utils.getUpgradeBonus(upgradeLevel);
            for (const ability of bonus.setAbilities) {
                out.push(<span><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
                if (ability.rate) {
                    out.push(<span>%</span>);
                }
            }
        }
    }

    // Medicine

    if (itemProp.category == "recovery" && itemProp.abilities != undefined) {
        for (const ability of itemProp.abilities) {
            switch (ability.parameter) {
                case "fp":
                    out.push(`\n${i18n.t("tooltip_restore_fp")}${ability.add}`);
                    break;
                case "mp":
                    out.push(`\n${i18n.t("tooltip_restore_mp")}${ability.add}`);
                    break;
                default:
                    out.push(`\n${i18n.t("tooltip_restore_hp")}${ability.add}`);
                    break;
            }
        }

        // TODO: Effective restoration. Not included in API
    }

    // Couple

    if (itemProp.subcategory == "couplering") {
        const style = { color: "#d386ff" };
        if (itemProp.coupleTeleports != undefined && itemProp.coupleTeleports > 0) {
            out.push(<span style={style}><br />{i18n.t("tooltip_couple_teleports")}: {itemProp.coupleTeleports}</span>);
        }
        if (itemProp.coupleCheers != undefined && itemProp.coupleCheers > 0) {
            out.push(<span style={style}><br />{i18n.t("tooltip_couple_cheers")}: {itemProp.coupleCheers}</span>);
        }
        if (itemProp.coupleBankSlots != undefined && itemProp.coupleBankSlots > 0) {
            out.push(<span style={style}><br />{i18n.t("tooltip_couple_storage")}: {itemProp.coupleBankSlots}</span>);
        }
    }

    // Job

    if (itemProp.class != undefined) {
        const job = Utils.getClassById(itemProp.class);
        if (job != undefined) {
            out.push(`\n${i18n.t("tooltip_required_job")}${job.name[shortLanguageCode] ?? job.name.en}`);
        }
    }

    // Level

    if (itemProp.level != undefined && itemProp.level > 1) {
        out.push(`\n${i18n.t("tooltip_required_level")}${itemProp.level}`);
        let levelsBelowRequirement = itemProp.level - Context.player.level;
        if (levelsBelowRequirement >= 1 && levelsBelowRequirement <= 5) {
            out.push(<span style={{ color: "#ff0000" }}> (-5)</span>);
        } 
        else if (levelsBelowRequirement >= 6 && levelsBelowRequirement <= 10) {
            out.push(<span style={{ color: "#ff0000" }}> (-10)</span>);
        }
    }

    // Required material item level

    if (itemProp.category == "material" && itemProp.minimumTargetItemLevel != undefined) {
        out.push(<span style={{ color: "#9e9e9e" }}><br />{i18n.t("tooltip_required_target_level")}: {itemProp.minimumTargetItemLevel}</span>);
    }

    // TODO: itemElem pet stuff
    if (itemProp.category == "raisedpet") {
        const pet = itemElem;
        const petDefinition = Utils.getPetDefinitionByItemId(pet.itemProp.id)

        out.push(<span style={{ color: '#009e00' }}><br />{i18n.t("tooltip_pet_tier")}: {Utils.getPetTierByLevels(pet.petStats)} {i18n.t("tooltip_pet_tier_unit")}</span>)
        out.push(<span style={{ color: '#ff0000' }}><br />{i18n.t("tooltip_pet_bonus")}: {`${Utils.getStatNameByIdOrDefault(petDefinition.parameter, i18n)} +${Utils.getPetStatSum(petDefinition, pet.petStats)}${petDefinition.rate ? '%' : ''}`}</span>)
        out.push(<span style={{ color: '#007fff' }}><br />({Object.values(pet.petStats).map((lv) => lv ? `${i18n.t("tooltip_pet_level")}${lv}` : null).filter(_ => _).join('/')})</span>)

        out.push(<span style={{ color: '#7878dc' }}><br />{i18n.t("tooltip_pet_exp")}: 99.99%</span>)

        const petTier = Object.values(pet.petStats).filter((tier) => tier != null).length;
        out.push(<span style={{ color: '#ff0a0a' }}><br />{i18n.t("tooltip_pet_energy")}: {petDefinition.tiers[petTier - 1].maxEnergy} / {petDefinition.tiers[petTier - 1].maxEnergy}</span>)
    }

    // Rarity

    out.push(`\n${i18n.t("tooltip_rarity")}`);
    // 翻译稀有度
    const rarityMap = {
        "common": "普通",
        "uncommon": "精良",
        "rare": "稀有",
        "veryrare": "传说",
        "unique": "史诗",
        "legendary": "传说",
        "ultimate": "终极"
    };
    out.push(<span style={{ color: Utils.getItemNameColor(itemProp) }}>{rarityMap[itemProp.rarity] || itemProp.rarity}</span>);

    // Description

    if (itemProp.description && itemProp.description.en != "null") {
        if (itemProp.category == "raisedpet") {
            // 处理技能描述的中文特殊情况
            let descLangKey = shortLanguageCode;
            if (shortLanguageCode === 'cn') {
                descLangKey = 'cns'; // Skills.json中使用cns作为中文键
            }
            out.push(<span style={{ color: "#d386ff" }}><br />{itemProp.description && (itemProp.description[descLangKey] ?? itemProp.description.en)}</span>);
        }
        else {
            // 处理技能描述的中文特殊情况
            let descLangKey = shortLanguageCode;
            if (shortLanguageCode === 'cn') {
                descLangKey = 'cns'; // Skills.json中使用cns作为中文键
            }
            out.push(`\n${i18n.t("tooltip_description")}${itemProp.description && (itemProp.description[descLangKey] ?? itemProp.description.en)}`);
        }
    }

    if (itemProp.subcategory == "visualcloak") {
        out.push(`\n${i18n.t("tooltip_visual_cloak")}`);
    }

    // Buff items

    if (itemProp.category == "buff") {
        for (const ability of itemProp.abilities) {
            out.push(<span style={{ color: "#ffeaa1" }}><br />{ability.parameter}+{ability.add}{ability.rate && "%"}</span>);
        }
    }

    // Cooldown

    if (itemProp.cooldown != undefined) {
        out.push(`\n${i18n.t("tooltip_cooldown")}: ${itemProp.cooldown} ${i18n.t("tooltip_seconds")}`);
    }

    // Equip sets

    if (itemProp.category == "armor" || itemProp.category == "jewelry") {
        const set = Utils.getEquipSetByItemId(itemProp.id);
        if (set != null) {
            const equippedCount = Context.player.getEquipSetPieceCountByItem(itemProp);
            // 处理装备套装名称的中文特殊情况
            let setNameLangKey = shortLanguageCode;
            if (shortLanguageCode === 'cn') {
                setNameLangKey = 'cns'; // EquipSets.json中使用cns作为中文键
            }
            out.push(`\n\n${set.name && (set.name[setNameLangKey] ?? set.name.en)} (${equippedCount}/${set.parts.length})`);

            const loadedItems = Utils.getLoadedItems();
            if (loadedItems) {
                for (const part of set.parts) {
                    const item = loadedItems[part];
                    if (item != undefined) {
                        // 处理装备名称的中文特殊情况
                        let itemNameLangKey = shortLanguageCode;
                        if (shortLanguageCode === 'cn') {
                            itemNameLangKey = 'cns'; // Items.json中使用cns作为中文键
                        }
                        out.push(<span style={{ color: "#01ab19" }}><br />    {typeof item.name === 'string' ? item.name : (item.name[itemNameLangKey] ?? item.name.en)}</span>);
                    }
                }
            }

            const bonusStyle = { color: "#ff9d00" };
            const bonuses = {};

            // Accumulate all bonuses first then emit their sum
            for (const bonus of set.bonus) {
                if (bonus.equipped > equippedCount) {
                    continue;
                }

                const bonusKey = `${Utils.getStatNameByIdOrDefault(bonus.ability.parameter, i18n)}.${bonus.ability.rate ? 'Y' : 'N'}`;

                if (bonuses[bonusKey] == undefined) {
                    bonuses[bonusKey] = bonus.ability.add;
                }
                else {
                    bonuses[bonusKey] += bonus.ability.add;
                }
            }

            for (const [key, bonus] of Object.entries(bonuses)) {
                const [parameter, rateString] = key.split('.');
                const rate = rateString === 'Y';

                out.push(<span style={bonusStyle}><br />{i18n.t("tooltip_set_effect")}: {Utils.getStatNameByIdOrDefault(parameter, i18n)} +{bonus}</span>);
                if (rate) {
                    out.push(<span style={bonusStyle}>%</span>);
                }
            }
        }
    }

    // Skill awakes

    if (itemElem.skillAwake != null) {
        if (itemElem.skillAwake.skill != undefined) {
            const skill = Utils.getSkillById(itemElem.skillAwake.skill);
            // 处理技能名称的中文特殊情况
            let skillLangKey = shortLanguageCode;
            if (shortLanguageCode === 'cn') {
                skillLangKey = 'cns'; // Skills.json中使用cns作为中文键
            }
            out.push(<span style={{ color: "#ff007b" }}><br />{skill.name && (skill.name[skillLangKey] ?? skill.name.en)} damage+{itemElem.skillAwake.add}%</span>)
        }
        else if (itemElem.skillAwake.parameter != undefined) {
            out.push(<span style={{ color: "#ff007b" }}><br />{Utils.getStatNameByIdOrDefault(itemElem.skillAwake.parameter, i18n)}+{itemElem.skillAwake.add}%</span>)
        }
    }

    // Piercings

    // Collect bonuses
    const piercingBonuses = {};
    for (const card of itemElem.piercings) {
        if (card == null || card.itemProp.abilities == undefined) {
            continue;
        }

        for (const ability of card.itemProp.abilities) {
            if (ability.parameter in piercingBonuses) {
                piercingBonuses[ability.parameter].add += ability.add;
            } else {
                piercingBonuses[ability.parameter] = { ...ability };
            }
        }
    }

    for (const [parameter, effect] of Object.entries(piercingBonuses)) {
        out.push(<span style={{ color: "#d386ff" }}><br />{Utils.getStatNameByIdOrDefault(parameter, i18n)}+{effect.add}{effect.rate && "%"}</span>);
    }

    // Ultimate jewels
    const ultimateJewelBonuses = {};
    for (const jewel of itemElem.ultimateJewels) {
        for (const ability of jewel.itemProp.abilities) {
            if (ability.parameter in ultimateJewelBonuses) {
                ultimateJewelBonuses[ability.parameter].add += ability.add;
            } else {
                ultimateJewelBonuses[ability.parameter] = { ...ability };
            }
        }
    }

    for (const [parameter, effect] of Object.entries(ultimateJewelBonuses)) {
        out.push(<span style={{ color: "#00c8ff" }}><br />{Utils.getStatNameByIdOrDefault(parameter, i18n)}+{effect.add}{effect.rate && "%"}</span>);
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given skill
 * @param {object} skill The skill property
 * @param {I18n} i18n Localization
 */
function setupSkill(skill, i18n) {
    const out = [];
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
        // 处理中文特殊情况
        if (shortLanguageCode === 'zh') {
            shortLanguageCode = 'cn'; // Classes.json中使用cn作为中文键
        }
    }

    const skillLevel = Context.player.skillLevels[skill.id] ?? skill.levels.length;
    const levelProp = skillLevel != undefined ? skill.levels[skillLevel - 1] : skill.levels[0];

    // 处理技能名称的中文特殊情况
    let skillLangKey = shortLanguageCode;
    if (shortLanguageCode === 'cn') {
        skillLangKey = 'cns'; // Skills.json中使用cns作为中文键
    }
    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{skill.name && (skill.name[skillLangKey] ?? skill.name.en)}</span>);
    if (skillLevel != undefined) {
        out.push(`  Lv. ${skillLevel}`);
    }

    if (skill.element != "none") {
        out.push(`\n${i18n.t("skill_element")}${i18n.t(`element_${skill.element}`)}`);
    }

    if (levelProp.consumedMP != undefined) {
        out.push(`\n${i18n.t("skill_mp_cost")}${levelProp.consumedMP}`);
    }

    if (levelProp.consumedFP != undefined) {
        out.push(`\n${i18n.t("skill_fp_cost")}${levelProp.consumedFP}`);
    }

    for (const requirement of skill.requirements) {
        const req = Utils.getSkillById(requirement.skill);
        const playerLevel = Context.player.skillLevels[requirement.skill];
        // 处理技能名称的中文特殊情况
        let reqSkillLangKey = shortLanguageCode;
        if (shortLanguageCode === 'cn') {
            reqSkillLangKey = 'cns'; // Skills.json中使用cns作为中文键
        }
        const skillName = req.name && (req.name[reqSkillLangKey] ?? req.name.en);

        if (playerLevel == undefined || playerLevel < requirement.level) {
            out.push(<span style={{ color: "#ff0000" }}><br />{i18n.t("skill_requirement_missing", { skillName, level: requirement.level })}</span>);
        }
        else {
            out.push(`\n${i18n.t("skill_requirement", { skillName, level: requirement.level })}`);
        }
    }

    if (Context.player.level < skill.level) {
        out.push(<span style={{ color: "#ff0000" }}><br />{i18n.t("skill_character_level")}{skill.level}</span>);
    }
    else {
        out.push(`\n${i18n.t("skill_character_level")}${skill.level}`);
    }

    const statsStyle = { fontWeight: 800 };

    // Attack
    if (levelProp.maxAttack != undefined && levelProp.maxAttack > 0) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_base_damage")}{levelProp.minAttack} ~ {levelProp.maxAttack}</span>);
    }

    // TODO: Scales for pvp vs pve?

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "attack" && scale.maximum == undefined) {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else {
                    // TODO: Part scaling
                }
                out.push(<span style={statsStyle}><br />{i18n.t("skill_attack_scaling", { stat, scale: scale.scale })}</span>);
            }
        }
    }

    // Heal
    if (levelProp.abilities != undefined) {
        for (const ability of levelProp.abilities) {
            if (ability.parameter == "hp") {
                out.push(<span style={statsStyle}><br />{i18n.t("skill_base_heal")}{ability.add}</span>);
                break;
            }
        }
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "hp") {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else {
                    // TODO: Part scaling
                }
                out.push(<span style={statsStyle}><br />{i18n.t("skill_heal_scaling", { stat, scale: scale.scale })}</span>);
            }
        }
    }

    // Time
    if (levelProp.duration != undefined) {
        const secs = levelProp.duration % 60;
        const mins = Math.floor(levelProp.duration / 60);
        out.push(<span style={statsStyle}><br />{i18n.t("skill_base_time")}{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "duration") {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else {
                    // TODO: Part scaling
                }
                out.push(<span style={statsStyle}><br />{i18n.t("skill_time_scaling", { stat, scale: scale.scale })}</span>);
            }
        }
    }

    // TODO: Get rid of the limits and floors and show the real value directly from the API, such as seconds below 1

    // Casting time
    if (levelProp.casting != undefined && levelProp.casting >= 1) {
        const secs = levelProp.casting % 60;
        const mins = Math.floor(levelProp.casting / 60);
        out.push(<span style={statsStyle}><br />{i18n.t("skill_casting_time")}{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    // Cooldown
    // TODO: PvP cooldown seems to be missing from the API, check Holycross for example
    if (levelProp.cooldown != undefined) {
        const secs = Math.ceil(levelProp.cooldown) % 60;
        const mins = Math.floor(Math.ceil(levelProp.cooldown) / 60);
        out.push(<span style={statsStyle}><br />{i18n.t("skill_cooldown")}{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    // Range
    if (levelProp.spellRange != undefined) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_spell_range")}{levelProp.spellRange}</span>);

        if (skill.target == "party") {
            out.push(<span style={statsStyle}>{i18n.t("skill_spell_range_party")}</span>);
        }
        else if (skill.target == "area") {
            out.push(<span style={statsStyle}>{i18n.t("skill_spell_range_area")}</span>);
        }
    }

    // Probability
    if (levelProp.probability != undefined) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_probability")}{levelProp.probability}%</span>);

        if (levelProp.probabilityPVP != undefined && levelProp.probabilityPVP != levelProp.probability) {
            out.push(<span style={statsStyle}>{i18n.t("skill_probability_pvp", { probability: levelProp.probabilityPVP })}</span>);
        }
    }

    // TODO: wallLives missing from elementor skill
    if (levelProp.wallLives != undefined) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_wall_lives")}{levelProp.wallLives}</span>);
    }

    // Reflex hit
    if (levelProp.reflectedDamagePVE != undefined && levelProp.reflectedDamagePVP != undefined) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_reflected_damage", { pve: levelProp.reflectedDamagePVE, pvp: levelProp.reflectedDamagePVP })}</span>);
    }

    // Damage over time
    if (levelProp.dotTick != undefined) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_dot_tick", { tick: levelProp.dotTick })}</span>);
    }

    // Combo
    if (skill.combo != "general") {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_combo")}{skill.combo}</span>);
    }

    if (!skill.flying) {
        out.push(<span style={statsStyle}><br />{i18n.t("skill_flying")}</span>);
    }

    // Stats
    if (levelProp.abilities != undefined) {
        for (const ability of levelProp.abilities) {
            const abilityStyle = { color: "#6161ff" };
            let add = ability.add;
            let extra = 0;

            if (levelProp.scalingParameters != undefined) {
                for (const scale of levelProp.scalingParameters) {
                    if (scale.parameter == ability.parameter && scale.maximum != undefined) {
                        let bufferStat = 0;
                        
                        if (scale.stat != undefined) {
                            switch (scale.stat) {
                                case "int":
                                    bufferStat = Context.player.bufferInt;
                                    break;
                                case "str":
                                    bufferStat = Context.player.bufferStr;
                                    break;
                                case "dex":
                                    bufferStat = Context.player.bufferDex;
                                    break;
                                default:
                                    bufferStat = Context.player.bufferSta;
                                    break;
                            }
                        }
                        else {
                            // TODO: Part scaling
                        }
    
                        extra = Math.floor(Math.min(scale.scale * bufferStat, scale.maximum));
                    }
                }
            }

            // 避免NaN错误
            const finalValue = ability.set != undefined ? ability.set : (add + extra);
            const displayValue = isNaN(finalValue) ? 0 : finalValue;
            // 处理attribute类型的属性
            let statName = "";
            let shouldDisplay = true;
            
            if (ability.parameter === "attribute") {
                // 检查是否是特殊属性，这些属性的效果已经通过其他方式体现
                const specialAttributes = ["stun", "bleeding", "poison", "silent", "slow", "invisibility", "moonbeam", "counterattack", "double"];
                if (specialAttributes.includes(ability.attribute)) {
                    shouldDisplay = false;
                } else {
                    statName = Utils.getStatNameByIdOrDefault(ability.attribute, i18n);
                }
            } else {
                statName = Utils.getStatNameByIdOrDefault(ability.parameter, i18n);
            }
            
            // 只显示非特殊属性
            if (shouldDisplay) {
                // 根据值的正负显示正确的符号
                const sign = ability.set != undefined ? "=" : (displayValue >= 0 ? "+" : "");
                out.push(<span style={abilityStyle}><br />{statName}{sign}{displayValue}{ability.rate && "%"}</span>);
            }
            if (extra > 0 && !isNaN(add) && !isNaN(extra)) {
                out.push(<span style={{ color: "#ffaa00" }}> ({add}+{extra})</span>)
            }
        }

        if (levelProp.scalingParameters != undefined) {
            for (const ability of levelProp.abilities) {
                for (const scale of levelProp.scalingParameters) {
                    if (scale.parameter == ability.parameter && scale.maximum != undefined) {
                        let stat = "";
                        if (scale.stat != undefined) {
                            stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                        }
                        else {
                            // TODO: Part scaling
                        }

                        out.push(<span style={{ color: "#ffaa00" }}><br />
                            {Utils.getStatNameByIdOrDefault(scale.parameter, i18n)} {i18n.t("skill_scaling")}: +{scale.scale * 25}{ability.rate && "%"} {i18n.t("skill_per")} 25 {stat} ({i18n.t("skill_max")} {scale.maximum}{ability.rate && "%"})
                        </span>);
                    }
                }
            }
        }
    }

    // 处理技能描述的中文特殊情况
    let descLangKey = shortLanguageCode;
    if (shortLanguageCode === 'cn') {
        descLangKey = 'cns'; // Skills.json中使用cns作为中文键
    }
    // 确保使用正确的语言键获取技能描述
    const description = skill.description && (skill.description[descLangKey] ?? skill.description.en);
    out.push(`\n${description}`);

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given partySkill
 * @param {object} partySkill The partySkill property
 * @param {I18n} i18n Localization
 */
function setupPartySkill(partySkill, i18n) {
    const out = []
    var shortLanguageCode = 'en'
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0]
        // 处理中文特殊情况
        if (shortLanguageCode === 'zh') {
            shortLanguageCode = 'cn'; // Classes.json中使用cn作为中文键
        }
    }

    // 处理技能名称的中文特殊情况
    let skillLangKey = shortLanguageCode;
    if (shortLanguageCode === 'cn') {
        skillLangKey = 'cns'; // Skills.json中使用cns作为中文键
    }
    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{partySkill.name && (partySkill.name[skillLangKey] ?? partySkill.name.en)}</span>);
    // 处理技能描述的中文特殊情况
    let descLangKey = shortLanguageCode;
    if (shortLanguageCode === 'cn') {
        descLangKey = 'cns'; // Skills.json中使用cns作为中文键
    }
    out.push(`\n${partySkill.description && (partySkill.description[descLangKey] ?? partySkill.description.en)}`)

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given housingNpc
 * @param {object} housingNpc The housingNpc property
 * @param {I18n} i18n Localization
 */
function setupHousingNpc(housingNpc, i18n) {
    const out = [];
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
        // 处理中文特殊情况
        if (shortLanguageCode === 'zh') {
            shortLanguageCode = 'cn'; // Classes.json中使用cn作为中文键
        }
    }

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{housingNpc.name && (housingNpc.name[shortLanguageCode] ?? housingNpc.name.en)}</span>);
    const abilityStyle = { color: "#6161ff" };
    for (const ability of housingNpc.abilities) {
        if (ability.rate) {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{"+"}{ability.add}{"%"}</span>);
        } else {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{"+"}{ability.add}</span>);
        }
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}