import React from "react";

export default function PaginationBar({
  lots = [],
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  filterPredicate
}) {
  const filteredCount = lots.filter(filterPredicate).length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / rowsPerPage));

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: 8, background: '#fafbfc', borderRadius: 16, fontFamily: 'Roboto, Arial, sans-serif', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', width: 'fit-content', minWidth: 480, justifyContent: 'space-between', height: '44px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: 8, color: '#374151', fontWeight: 500 }}>Hiển thị</span>
        <select
          value={rowsPerPage}
          onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          style={{ borderRadius: 10, fontSize: 14, height: 36, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #d1d5db', padding: '4px 12px', backgroundColor: '#fff', minWidth: 90, marginRight: 12 }}
        >
          {[10, 25, 50, 100].map(opt => (<option key={opt} value={opt}>{opt} dòng</option>))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button disabled={page === 0} onClick={() => setPage(0)} style={btnStyle}>{'|<'}</button>
        <button disabled={page === 0} onClick={() => setPage(page - 1)} style={btnStyle}>{'<'}</button>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={page + 1}
          onChange={e => {
            let val = Number(e.target.value) - 1;
            if (isNaN(val)) return;
            if (val < 0) val = 0;
            if (val >= totalPages) val = totalPages - 1;
            setPage(val);
          }}
          style={{ width: 40, textAlign: 'center', margin: '0 6px', height: 32, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', outline: 'none', backgroundColor: '#fff' }}
        />
        <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={btnStyle}>{'>'}</button>
        <button disabled={page + 1 >= totalPages} onClick={() => setPage(totalPages - 1)} style={btnStyle}>{'>|'}</button>
      </div>

      <div style={{ marginLeft: 16 }}>
        <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
          {`${page * rowsPerPage + 1} - ${Math.min((page + 1) * rowsPerPage, filteredCount)} trong ${filteredCount} lô hàng`}
        </span>
      </div>
    </div>
  );
}

const btnStyle = { minWidth: 32, borderRadius: 8, margin: '0 2px', padding: '4px 8px', border: '1px solid #d1d5db', color: '#374151', background: '#fff', height: 32, cursor: 'pointer' }; 