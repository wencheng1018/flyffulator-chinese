import { useTooltip } from "../../tooltipcontext";

function Tooltip() {
    const { isTooltipOpen, tooltipContent } = useTooltip();

    if (!isTooltipOpen) {
        return null;
    }

    // 计算tooltip的位置，确保不超出屏幕范围
    const tooltipWidth = 300; // 预估的tooltip最大宽度
    const tooltipHeight = 400; // 预估的tooltip最大高度
    const margin = 10; // 距离屏幕边缘的最小边距

    let left = tooltipContent.rect.x + tooltipContent.rect.width + 5;
    let top = tooltipContent.rect.y;

    // 检查右边是否超出屏幕
    if (left + tooltipWidth > window.innerWidth - margin) {
        // 如果右边超出，显示在左边
        left = tooltipContent.rect.x - tooltipWidth - 5;
        // 如果左边也超出，则显示在右边但调整位置
        if (left < margin) {
            left = window.innerWidth - tooltipWidth - margin;
        }
    }

    // 检查下边是否超出屏幕
    if (top + tooltipHeight > window.innerHeight - margin) {
        // 如果下边超出，调整top位置
        top = window.innerHeight - tooltipHeight - margin;
    }

    // 检查上边是否超出屏幕
    if (top < margin) {
        top = margin;
    }

    return (
        <div className="tooltip" style={{left: left, top: top}}>
            {tooltipContent.text}
        </div>
    );
}

export default Tooltip;
