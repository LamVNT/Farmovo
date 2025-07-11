import React from "react";
import "./ZoneVisual.css";

const ZoneVisual = ({zones, hoveredZoneId}) => {
    const parsedZones = zones.map(z => {
        const match = z.zoneName.match(/Z_\[(\d+);(\d+)\]/);
        if (!match) return null;
        return {
            id: z.id,
            row: parseInt(match[1]),
            col: parseInt(match[2]),
            description: z.zoneDescription,
        };
    }).filter(Boolean);

    const maxRow = Math.max(...parsedZones.map(z => z.row), 1);
    const maxCol = Math.max(...parsedZones.map(z => z.col), 1);

    const grid = [];
    for (let i = 1; i <= maxRow; i++) {
        const row = [];
        for (let j = 1; j <= maxCol; j++) {
            const zone = parsedZones.find(z => z.row === i && z.col === j);
            if (zone) {
                const isHovered = zone.id === hoveredZoneId;
                row.push(
                    <div
                        key={`cell-${i}-${j}`}
                        className={`grid-cell ${isHovered ? "highlighted-cell" : ""}`}
                    >
                        {zone.description}
                    </div>
                );
            } else {
                row.push(
                    <div key={`cell-${i}-${j}`} className="grid-cell empty-cell"></div>
                );
            }
        }
        grid.push(
            <div key={`row-${i}`} className="grid-row">
                {row}
            </div>
        );
    }

    return (
        <div className="zone-visual mt-10">
            <div className="grid-container">{grid}</div>
        </div>
    );
};

export default ZoneVisual;



