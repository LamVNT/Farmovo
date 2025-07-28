import React from 'react';

const Progress = ({percentage = 0, type}) => {
    const color =
        type === "success" ? "bg-green-500" :
            type === "warning" ? "bg-yellow-500" :
                "bg-blue-500";

    return (
        <div className="w-[80px] h-[8px] bg-gray-200 rounded-full overflow-hidden ml-2">
            <div
                className={`${color} h-full transition-all duration-300`}
                style={{width: `${percentage}%`}}
            />
        </div>
    );
};

export default Progress;
