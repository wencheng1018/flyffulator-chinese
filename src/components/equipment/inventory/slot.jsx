import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useTooltip } from '../../../tooltipcontext';
import { createTooltip } from '../../../flyff/flyfftooltip';
import * as Utils from '../../../flyff/flyffutils';
import { useTranslation } from "react-i18next";
import CachedImage from '../../shared/CachedImage';

import '../../../styles/equipment.scss';

function Slot({ backgroundIcon, content, className, onRemove }, ref) {
  const { showTooltip, hideTooltip } = useTooltip();
  const slotRef = useRef(null);
  const { i18n } = useTranslation();

  function toggleTooltip(enabled) {
    if (content == null) {
      return;
    }

    if (enabled) {
      const settings = {
        rect: slotRef.current.getBoundingClientRect(),
        text: createTooltip(content, i18n)
      };
      showTooltip(settings);
    }
    else {
      hideTooltip();
    }
  }

  useImperativeHandle(ref, () => ({
    content: content
  }));

  function clearSlot(e) {
    e.stopPropagation();
    onRemove(content);
    toggleTooltip(false);
  }

  return (
    <div className={`slot ${className}`}
      onMouseEnter={() => toggleTooltip(true)}
      onMouseLeave={() => toggleTooltip(false)}
      ref={slotRef}>
      {
        backgroundIcon != null && backgroundIcon.length > 0 &&
        <CachedImage src={backgroundIcon} draggable={false} id="placeholder" />
      }

      {
        content != null &&
        <>
          {
            (content.itemProp != undefined && content.passive == undefined) ? 
            <CachedImage src={`https://api.flyff.com/image/item/${content.itemProp.icon}`} draggable={false} id="slot-content" />
            :
            <CachedImage src={`https://api.flyff.com/image/skill/colored/${content.icon}`} draggable={false} id="slot-content" />
          }

          {
            (content.passive == undefined && content.itemProp && content.itemProp.rarity != "common") &&
            <div id="slot-rarity-corner" style={{
              background: `linear-gradient(45deg, #ffffff00 0%, #ffffff00 50%, ${Utils.getItemNameColor(content.itemProp)} 51%, ${Utils.getItemNameColor(content.itemProp)} 100%)`
            }}></div>
          }

          {
            onRemove != undefined &&
            <button className="flyff-close-button" onClick={(e) => clearSlot(e)}>
              <img src={`${Utils.BASE_PATH}/close-icon.svg`} alt="remove" />
            </button>
          }
        </>
      }
    </div>
  )
}

export default forwardRef(Slot);
