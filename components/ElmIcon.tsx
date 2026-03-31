
import React from 'react';
import { ELM_ICON_PATHS } from './ElmIcons';

interface ElmIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
    color?: string;
}

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
