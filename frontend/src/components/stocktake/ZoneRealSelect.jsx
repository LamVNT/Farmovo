import React from "react";
import { Box, Chip, Checkbox, IconButton, MenuItem, Select, Typography } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ZoneRealSelect({
  zones = [],
  value = [],
  onChange,
  disabled,
  onOpenPopover,
  actualIdx
}) {
  const selected = Array.isArray(value)
    ? value.map(Number).filter(v => !isNaN(v))
    : (typeof value === 'string' && value.length ? value.split(',').map(Number).filter(v => !isNaN(v)) : []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '28px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', flex: 1, height: '100%', minWidth: '160px' }}>
        {selected.length === 0 && (
          <span style={{ color: '#6c757d', fontSize: '0.75rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 4 }}>
            <span style={{ width: '3px', height: '3px', backgroundColor: '#adb5bd', borderRadius: '50%', flexShrink: 0 }}></span>
            Chọn vị trí
          </span>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center', height: '24px', cursor: 'pointer', width: '100%', maxWidth: '160px', position: 'relative', zIndex: 3, pointerEvents: 'none' }}>
          {selected.length > 0 && (
            <>
              {selected.slice(0, 2).map((zoneId) => {
                const z = zones.find(z => Number(z.id) === Number(zoneId));
                return z ? (
                  <Chip
                    key={z.id}
                    label={z.zoneName}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '6px',
                      height: '18px',
                      fontSize: '0.65rem',
                      maxWidth: '50px',
                      '& .MuiChip-label': { padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                      '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)', transform: 'translateY(-1px)', boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)' },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ) : null;
              })}
              {selected.length > 2 && (
                <Chip
                  key={`more-${selected.length}`}
                  label={`+${selected.length - 2}`}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#d63384', fontWeight: '700', borderRadius: '6px', height: '18px', fontSize: '0.65rem', minWidth: '20px', '& .MuiChip-label': { padding: '0 3px' }, '&:hover': { background: 'linear-gradient(135deg, #ffe4b5 0%, #fbb040 100%)', transform: 'translateY(-1px)', boxShadow: '0 2px 6px rgba(252, 182, 159, 0.3)' }, transition: 'all 0.2s ease' }}
                />
              )}
            </>
          )}
        </div>
        <Select
          size="small"
          variant="outlined"
          multiple
          value={selected}
          onChange={e => onChange && onChange(e.target.value)}
          disabled={disabled}
          onClick={e => e.stopPropagation()}
          displayEmpty
          renderValue={(sel) => {
            if (!sel || sel.length === 0) return '';
            return sel.map(id => {
              const z = zones.find(z => Number(z.id) === Number(id));
              return z ? z.zoneName : id;
            }).join(', ');
          }}
          sx={{
            position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', minWidth: 160, padding: 0, background: 'transparent',
            '& .MuiSelect-select': { padding: '4px 8px', height: '100%', opacity: 1, color: 'transparent', cursor: 'pointer' },
            '& .MuiOutlinedInput-root': { borderRadius: '4px', backgroundColor: 'transparent', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' } },
            '& .MuiSelect-icon': { right: 6, position: 'absolute', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6c757d', transition: 'all 0.2s ease', fontSize: '0.875rem', zIndex: 2, '&:hover': { color: '#495057', transform: 'translateY(-50%) scale(1.1)' } },
            zIndex: 5, cursor: 'pointer', '&:hover .MuiSelect-icon': { color: '#495057' }
          }}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 280, minWidth: 200, borderRadius: 12, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', border: '1px solid #e9ecef', padding: 12 },
              sx: { '& .MuiMenu-list': { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, padding: 0 } }
            }
          }}
        >
          {zones.map((zone) => (
            <MenuItem key={zone.id} value={Number(zone.id)} style={{ borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', margin: '1px 0', transition: 'all 0.2s ease' }}>
              <Checkbox
                checked={selected.includes(Number(zone.id))}
                color="primary"
                size="small"
                style={{ padding: 1, color: '#667eea' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const zoneId = Number(zone.id);
                  let newSelected;
                  if (selected.includes(zoneId)) newSelected = selected.filter(id => id !== zoneId);
                  else newSelected = [...selected, zoneId];
                  onChange && onChange(newSelected);
                }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#495057', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                {zone.zoneName}
              </span>
            </MenuItem>
          ))}
        </Select>
      </div>
      <IconButton
        size="small"
        style={{ marginLeft: 6, color: '#667eea', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px', width: '20px', height: '20px', zIndex: 2, transition: 'all 0.2s ease', flexShrink: 0 }}
        onClick={e => onOpenPopover && onOpenPopover(e, actualIdx, 'real')}
        sx={{ '&:hover': { backgroundColor: '#667eea', color: 'white', transform: 'translateY(-1px)', boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)' } }}
      >
        <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
      </IconButton>
    </div>
  );
} 