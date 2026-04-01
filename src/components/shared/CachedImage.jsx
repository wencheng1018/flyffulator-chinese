import { useState, useEffect } from 'react';

// 带缓存的图片组件
function CachedImage({ src, alt, style, className, draggable = false, id }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) return;

    // 先尝试从缓存中获取
    const cached = sessionStorage.getItem(`img_cache_${src}`);
    if (cached) {
      setImageSrc(cached);
      setIsLoading(false);
      return;
    }

    // 如果没有缓存，加载图片
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 转换为dataURL并缓存
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        sessionStorage.setItem(`img_cache_${src}`, dataUrl);
        setImageSrc(dataUrl);
      } catch (e) {
        // 如果转换失败，直接使用原始URL
        setImageSrc(src);
      }
      setIsLoading(false);
    };

    img.onerror = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.src = src;
  }, [src]);

  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      style={style}
      className={className}
      draggable={draggable}
      id={id}
    />
  );
}

export default CachedImage;
