import { useTranslation } from "react-i18next";
import '../../styles/calculations.scss';

function Experience() {
    const { t } = useTranslation();

    return (
        <div id="experience" style={{ textAlign: "center", padding: "40px" }}>
            <h2 style={{ color: "#ffd700", marginBottom: "20px" }}>经验计算功能</h2>
            <p style={{ color: "#ffffff", fontSize: "18px" }}>怪物数据已移除，经验计算功能暂不可用。</p>
        </div>
    )
}

export default Experience;
