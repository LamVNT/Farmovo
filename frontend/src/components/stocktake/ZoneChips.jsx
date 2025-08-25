import React from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ZoneChips({ zones = [], zonesId = [], onOpenPopover, actualIdx }) {
    const validZoneIds = (zonesId || []).filter(v => v !== null && v !== undefined && v !== '');
    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row',
                flexWrap: 'nowrap', 
                gap: 1, 
                alignItems: 'center', 
                justifyContent: 'flex-start',
                height: '24px', 
                width: '100%',
                maxWidth: '160px',
                position: 'relative',
                zIndex: 3,
                overflow: 'hidden'
            }}>
                {validZoneIds.length > 0 ? (
                    <>
                        {validZoneIds.slice(0, 2).map((zoneId) => {
                            const z = zones.find(z => Number(z.id) === Number(zoneId));
                            return z ? (
                                <Chip
                                    key={z.id}
                                    label={z.zoneName}
                                    size="small"
                                    sx={{
                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                        color: 'white',
                                        fontWeight: '600',
                                        borderRadius: '6px',
                                        height: '18px',
                                        fontSize: '0.65rem',
                                        maxWidth: '45px',
                                        minWidth: '35px',
                                        '& .MuiChip-label': {
                                            padding: '0 3px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.6rem'
                                        }
                                    }}
                                />
                            ) : null;
                        })}
                        {validZoneIds.length > 2 && (
                            <Chip
                                key={`more-zones-${actualIdx}`}
                                label={`+${validZoneIds.length - 2}`}
                                size="small"
                                sx={{ 
                                    background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                                    color: 'white',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    height: '18px',
                                    fontSize: '0.6rem',
                                    minWidth: '18px',
                                    maxWidth: '18px',
                                    '& .MuiChip-label': { padding: '0 2px' }
                                }}
                            />
                        )}
                    </>
                ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Chưa có khu vực
                    </Typography>
                )}
            </div>
            {validZoneIds.length > 0 && (
                <IconButton 
                    size="small" 
                    style={{ 
                        marginLeft: 6, 
                        color: '#28a745',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
                        zIndex: 2,
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                    }} 
                    onClick={e => onOpenPopover && onOpenPopover(e, actualIdx, 'original')}
                    sx={{ '&:hover': { backgroundColor: '#28a745', color: 'white', transform: 'translateY(-1px)', boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)' } }}
                >
                    <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
                </IconButton>
            )}
        </div>
    );
} 