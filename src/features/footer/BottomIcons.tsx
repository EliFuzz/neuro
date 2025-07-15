import React from 'react';
import './BottomIcons.css';

interface BottomIconsProps {
    onToggleTheme: () => void;
}

const BottomIcons: React.FC<BottomIconsProps> = ({ onToggleTheme }) => {
    return (
        <div className="bottom-section">
            <div className="icon-left" onClick={onToggleTheme}>
                <span role="img" aria-label="icon-left">
                    ⚙️
                </span>
            </div>
            <div className="icon-right">
                <span role="img" aria-label="icon-right">
                    🚀
                </span>
            </div>
        </div>
    );
};

export default BottomIcons;
