import { useState, useEffect } from 'react';
import { useSearch } from '../../searchcontext';
import { useTranslation } from "react-i18next";
import { getHealing } from '../../flyff/flyffdamagecalculator';
import { runAutoAttackWorker } from './utils/runAutoAttackWorker';
import { runSkillWorker } from './utils/runSkillWorker';
import { runMonsterWorker } from './utils/runMonsterWorker';

import '../../styles/calculations.scss';
import Entity from '../../flyff/flyffentity';
import Context from '../../flyff/flyffcontext';
import * as Utils from "../../flyff/flyffutils";
import HoverInfo from '../shared/hoverinfo';
import LineChart from './charts/linechart';
import BasicStat from './charts/basicstat';
import NumberInput from '../shared/numberinput';
import RangeInput from '../shared/rangeinput';
import ImportCharacter from '../base/importcharacter';

function Calculations() {
    const AA_DEFAULT_SAMPLE_SIZE = 200;
    const AA_MAX_SAMPLE_SIZE = 10000;
  
    const SKILL_DEFAULT_SAMPLE_SIZE = 100;
    const SKILL_MAX_SAMPLE_SIZE = 10000;
  
    const MONSTER_DEFAULT_SAMPLE_SIZE = 100;
    const MONSTER_MAX_SAMPLE_SIZE = 10000;

    const { showSearch } = useSearch();
    const [bigSampleActive, setBigSampleActive] = useState(false);
    const [aaBigSampleSize, setAaBigSampleSize] = useState(2000);
    const [skillBigSampleSize, setSkillBigSampleSize] = useState(100);
    const [monsterBigSampleSize, setMonsterBigSampleSize] = useState(100);
    const [targetType, setTargetType] = useState(Context.defender.isPlayer() ? 1 : (Context.defender.monsterProp.dummy ? 0 : 2));
    const [refresh, setRefresh] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [autoAttackData, setAutoAttackData] = useState([]);
    const [skillData, setSkillData] = useState([]);
    const [monsterData, setMonsterData] = useState([]);
    const [isLoadingAA, setIsLoadingAA] = useState(false);
    const [isLoadingSkill, setIsLoadingSkill] = useState(false);
    const [isLoadingMonster, setIsLoadingMonster] = useState(false);

    const { t, i18n } = useTranslation();

    function SpinnerOverlay() {
        return (
            <div className="spinner-overlay">
                <div className="spinner" />
            </div>
        );
    }    

    useEffect(() => {
        setBigSampleActive(false);
    }, [
        Context.player,
        Context.defender,
        refresh,
        targetType,
        aaBigSampleSize,
        skillBigSampleSize,
        monsterBigSampleSize,
    ]);

    useEffect(() => {
        let cancelled = false;
        setIsLoadingAA(true);
        setIsLoadingSkill(true);
        setIsLoadingMonster(true);
        
        // Add waterbomb
        if (Context.settings.waterbombEnabled && Context.attacker.getStat("skillchance", true, 11389) > 0) {
            Context.player.skillLevels[11389] = 1;
        }

        
        // Counter attack
        if (Context.player.skillLevels[2506] != undefined) {
            Context.player.skillLevels[6725] = Context.player.skillLevels[2506];
        }
    
        const context = {
            player: Context.player.serialize(),
            attacker: Context.attacker.serialize(),
            defender: Context.defender.serialize(),
            attackFlags: Context.attackFlags,
            skill: Context.skill,
            settings: Context.settings,
            expSettings: Context.expSettings
        }

        runAutoAttackWorker(context, bigSampleActive ? aaBigSampleSize : AA_DEFAULT_SAMPLE_SIZE)
            .then(data => {
                if (!cancelled) {
                    setAutoAttackData(data);
                    setIsLoadingAA(false);
                }
            })
            .catch(error => {
                console.error("Error in auto attack worker:", error);
                setIsLoadingAA(false);
            });

        runSkillWorker(context, bigSampleActive ?  skillBigSampleSize : SKILL_DEFAULT_SAMPLE_SIZE)
            .then(data => {
                if (!cancelled) {
                    setSkillData(data);
                    setIsLoadingSkill(false);
                }
            })
            .catch(error => {
                console.error("Error in auto attack worker:", error);
                setIsLoadingSkill(false);
            });

        runMonsterWorker(context, bigSampleActive ?  monsterBigSampleSize : MONSTER_DEFAULT_SAMPLE_SIZE)
            .then(data => {
                if (!cancelled) {
                    setMonsterData(data);
                    setIsLoadingMonster(false);
                }
            })
            .catch(error => {
                console.error("Error in auto attack worker:", error);
                setIsLoadingMonster(false);
            });
    
        return () => {
            cancelled = true;
        };
    }, [Context.player, Context.defender, bigSampleActive, refresh]);

    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
        // 处理中文特殊情况
        if (shortCode === 'zh') {
            shortCode = 'cn'; // Classes.json中使用cn作为中文键
        }
    }

    function setTarget(index) {
        if (index == 0) { // Training dummy
            Context.defender = new Entity(Utils.TRAINING_DUMMY);
            setTargetType(index);
        }
        else if (index == 1) { // Other player
            setIsImporting(true);
        }
        else if (index == 2) { // Monster
            showSearch({
                type: "monster", onSet: (res) => {
                    Context.defender = res;
                    setTargetType(index);

                    // Reset the damage done for experience calculations
                    Context.expSettings.teammates[0].totalDamageFactor = 100;
                    for (let i = 1; i < Context.expSettings.teammates.length; i++) {
                        Context.expSettings.teammates[i].totalDamageFactor = 0;
                    }
                }
            });
        }
    }

    function importCharacter(json) {
        Context.defender = new Entity(null);
        Context.defender.unserialize(json);
        setIsImporting(false);
        setTargetType(1);
    }

    function generateHealing() {
        let data = {};
        for (const [skill, level] of Object.entries(Context.player.skillLevels)) {
            if (level <= 0) {
                continue; // Shouldn't happen
            }

            const skillProp = Utils.getSkillById(skill);

            // TODO: Skip master variations for now
            if (skillProp.inheritSkill) {
                continue;
            }

            const healing = getHealing(skillProp);
            if (healing <= 0) {
                continue; // Not a healing skill
            }

            data[skill] = healing;
        }

        return data;
    }

    function generateDefense() {
        // This is annoying but defense is a random between two values defined by your equipment.
        // Not reliable and probably a better way to find it but its ok

        Context.skill = null;
        Context.attackFlags = Utils.ATTACK_FLAGS.GENERIC;

        let out = [];
        for (let i = 0; i < 100; i++) {
            const res = Context.player.getDefense();
            out.push(res);
        }

        const minValue = Math.min(...out);
        const maxValue = Math.max(...out);

        return `${minValue}~${maxValue}`;
    }

    function getMagicDefense() {
        Context.skill = null;
        Context.attackFlags = Utils.ATTACK_FLAGS.MAGIC;

        let defense = Context.player.getDefense();
        defense += defense * Context.player.getStat("magicdefense", true) / 100;
        return Math.floor(defense);
    }

    function setSetting(setting, value) {
        Context.settings[setting] = value;
        setRefresh(!refresh);
    }

    return (
        <div id="calculations">
            <div id="basic-stats" style={{ 
                flex: 1, 
                padding: "20px",
                background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
                borderRadius: "8px",
                border: "1px solid #444",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                margin: "20px"
            }}>
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(2, 1fr)", 
                    gap: "15px"
                }}>
                    <BasicStat title={t("strength")} value={Context.player.getBaseStat("str")}
                        information={"这是你的总力量，包括来自装备或其他地方的任何加成。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                    />

                    <BasicStat title={t("stamina")} value={Context.player.getBaseStat("sta")}
                        information={"这是你的总体质，包括来自装备或其他地方的任何加成。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                    />

                    <BasicStat title={t("dexterity")} value={Context.player.getBaseStat("dex")}
                        information={"这是你的总敏捷，包括来自装备或其他地方的任何加成。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                    />

                    <BasicStat title={t("intelligence")} value={Context.player.getBaseStat("int")}
                        information={"这是你的总智力，包括来自装备或其他地方的任何加成。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                    />
                </div>

                <hr style={{ 
                    margin: "20px 0", 
                    border: "1px solid #444"
                }} />

                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "15px"
                }}>
                    <BasicStat title={t("maximum_hp")} value={Context.player.getHP()}
                        information={"这是你的最大生命值。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L302"}
                    />

                    <BasicStat title={t("maximum_mp")} value={Context.player.getMP()}
                        information={"这是你的最大 MP。MP 是使用大多数魔法技能的必要条件。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L324"}
                    />

                    <BasicStat title={t("maximum_fp")} value={Context.player.getFP()}
                        information={"这是你的最大 FP。FP 是使用大多数非魔法技能的必要条件。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L345"}
                    />
                </div>

                <hr style={{ 
                    margin: "20px 0", 
                    border: "1px solid #444"
                }} />

                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(2, 1fr)", 
                    gap: "15px"
                }}>
                    <BasicStat title={t("speed")} value={Context.player.getMovementSpeed()}
                        information={"这是你当前的移动速度因子。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L365"}
                        percentage
                    />

                    <BasicStat title={t("jump_height")} value={(Context.player.getStat("jumpheight", false) + 200) / 2}
                        information={"这是你当前的跳跃高度因子。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                    />

                    <BasicStat title={t("casting_speed")} value={100 + Context.player.getStat("decreasedcastingtime", true)}
                        information={"这是你当前的施法速度加成。施法速度影响你施放魔法技能所需的时间。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                    />

                    <BasicStat
                        title={t("healing")}
                        value={Context.player.getStat("healing", true)}
                        information='这个值会增加你的治疗技能所造成的治疗量。'
                        sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                        percentage
                        optional
                    />
                </div>

                <hr style={{ 
                    margin: "20px 0", 
                    border: "1px solid #444"
                }} />

                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(2, 1fr)", 
                    gap: "15px"
                }}>
                    <BasicStat title={t("attack")} value={Context.player.getAttack()}
                        information={"这是你的攻击力。这是你一般伤害的近似值，因为你的真实伤害在很大程度上取决于当前的上下文。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L423"}
                    />

                    <BasicStat title={t("skill_damage")} value={Context.player.getStat("skilldamage", true)}
                        information={"这个值是你技能伤害的加成乘数。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                        optional
                    />

                    <BasicStat title={t("pve_damage")} value={Context.player.getStat("pvedamage", true)}
                        information={"这个值是你对怪物伤害的加成乘数。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                        optional
                    />

                    <BasicStat title={t("pvp_damage")} value={Context.player.getStat("pvpdamage", true)}
                        information={"这个值是你对其他玩家伤害的加成乘数。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                        optional
                    />

                    <BasicStat title={t("attack_speed")} value={Math.floor(Context.player.getAttackSpeed() * 100) / 2}
                        information={"这个值影响你释放后续自动攻击的速度。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L378"}
                        percentage
                    />

                    <BasicStat title={t("hit_rate")} value={Context.player.getContextHitRate(Context.defender).probAdjusted}
                        information={"你的自动攻击击中（不miss或被招架）目标的频率。\n\n这个值与你在游戏中看到的值不同，但它是针对当前目标的真实命中率。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L550"}
                        percentage
                    />

                    <BasicStat title={t("critical_chance")} value={Context.player.getCriticalChance()}
                        information={"你的自动攻击产生暴击的频率。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L949"}
                        percentage
                    />

                    <BasicStat title={t("critical_damage")} value={Context.player.getStat("criticaldamage", true)}
                        information={"这个值是你的暴击伤害的加成乘数。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                    />

                    <BasicStat title={t("block_penetration")} value={Context.player.getStat("blockpenetration", true)}
                        information={"这个值会降低目标格挡你自动攻击的几率。\n\n这是一个因子，意味着50%的格挡穿透会使目标的格挡几率降低50%，使他们只剩下原本的一半。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                        optional
                    />
                </div>

                <hr style={{ 
                    margin: "20px 0", 
                    border: "1px solid #444"
                }} />

                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(2, 1fr)", 
                    gap: "15px"
                }}>
                    <BasicStat title={t("defense")} value={generateDefense()}
                        information={"这个值会降低你从自动攻击中受到的伤害。\n\n虽然这个值明显低于你在游戏中看到的值，但它是伤害计算中使用的真实值。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L147"}
                    />

                    <BasicStat title={t("magic_defense")} value={getMagicDefense()}
                        information={"这个值会降低你从魔法攻击中受到的伤害。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L166"}
                    />

                    <BasicStat
                        title={t("magic_resistance")}
                        value={Context.player.getStat('magicdefense', true)}
                        information='这个值会以这个百分比减少你受到的魔法伤害。'
                        sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                        percentage
                        optional
                    />

                    <BasicStat title={t("critical_resist")} value={Context.player.getStat("criticalresist", true)}
                        information={"这个值会降低目标对你造成暴击的几率。\n\n这是一个因子，意味着50%的暴击抵抗会使目标只剩下50%的原始暴击几率。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                        percentage
                    />

                    <BasicStat
                        title={t("incoming_damage")}
                        value={Context.player.getStat("incomingdamage", true)}
                        information='这个值会乘以你受到的伤害量。负值会减少你受到的伤害量。'
                        sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                        percentage
                        optional
                    />

                    <BasicStat
                        title={t("pve_damage_reduction")}
                        value={Context.player.getStat('pvedamagereduction', true)}
                        information='这个值会减少你从怪物那里受到的伤害。'
                        sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                        percentage
                        optional
                    />

                    <BasicStat
                        title={t("pvp_damage_reduction")}
                        value={Context.player.getStat('pvpdamagereduction', true)}
                        information='这个值会减少你从其他玩家那里受到的伤害。'
                        sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                        percentage
                        optional
                    />

                    <BasicStat title={t("parry")} value={Context.player.getParry()}
                        information={"这是你的闪避值。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L535"}
                        percentage
                    />

                    <BasicStat title={t("melee_block")} value={Utils.clamp(Context.player.getBlockChance(false, Context.defender), 6.25, 92.5)}
                        information={"你格挡当前目标近战攻击的频率。\n\n这个值可能与你在角色窗口中看到的值不同，因为它考虑了所有因素，如最小值、最大值和对手的属性。这是你的真实格挡率。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L965"}
                        percentage
                    />

                    <BasicStat title={t("ranged_block")} value={Utils.clamp(Context.player.getBlockChance(true, Context.defender), 6.25, 92.5)}
                        information={"你格挡当前目标远程攻击的频率。\n\n这个值可能与你在角色窗口中看到的值不同，因为它考虑了所有因素，如最小值、最大值和对手的属性。这是你的真实格挡率。"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L965"}
                        percentage
                    />
                </div>
            </div>

            <ImportCharacter open={isImporting} onImport={importCharacter} close={() => setIsImporting(false)} />
        </div>
    )
}

export default Calculations;
