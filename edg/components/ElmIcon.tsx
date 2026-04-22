/**
 * ElmIcon.tsx
 * ---------------------------------------------------------------
 * 项目自定义矢量图标组件（Element-Plus 风格）。
 * 按 name 从 ElmIcons.ts 的 ELM_ICON_PATHS 表中查到对应 SVG path，再以统一尺寸/颜色渲染。
 * 使用位置：几乎所有页面（取代部分 lucide-react 图标，保持视觉一致）。
 * ---------------------------------------------------------------
 */
import React from 'react';
import { ELM_ICON_PATHS } from './ElmIcons';

// props：name 图标键名；size 宽高；color 填充色；其余 SVG props 透传
interface ElmIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
    color?: string;
}

/**
 * ElmIcon —— 统一 SVG 图标渲染器
 * 若 name 未在图标表中命中则 console.warn 并返回 null
 */
export const ElmIcon: React.FC<ElmIconProps> = ({
    name, 
    size = 18, 
    color = 'currentColor', 
    className = '',
    style = {},
    ...props 
}) => {
    const path = ELM_ICON_PATHS[name];
    
    if (!path) {
        console.warn(`ElmIcon: Icon "${name}" not found.`);
        return null;
    }

    return (
        <svg
            viewBox="0 0 1024 1024"
            width={size}
            height={size}
            fill={color}
            className={`inline-block align-middle ${className}`}
            style={{ ...style }}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d={path} />
        </svg>
    );
};
