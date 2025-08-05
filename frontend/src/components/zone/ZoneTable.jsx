import React from "react";
import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination
} from "@mui/material";

const ZoneTable = ({
                       rows,
                       onEdit,
                       onDelete,
                       hoveredZoneId,
                       setHoveredZoneId,
                       page,
                       setPage,
                       rowsPerPage,
                       setRowsPerPage
                   }) => {
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>STT</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Zone Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Zone Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Store Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedRows.map((zone, index) => (
                        <TableRow
                            key={zone.id}
                            hover
                            selected={zone.id === hoveredZoneId}
                            onMouseEnter={() => setHoveredZoneId(zone.id)}
                            onMouseLeave={() => setHoveredZoneId(null)}
                        >
                            <TableCell sx={{ fontWeight: 'bold', color: '#666' }}>
                                {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell>{zone.zoneName}</TableCell>
                            <TableCell>{zone.zoneDescription}</TableCell>
                            <TableCell>
                                <span style={{ 
                                    backgroundColor: '#e3f2fd', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#1976d2'
                                }}>
                                    {zone.storeName || 'N/A'}
                                </span>
                            </TableCell>
                            <TableCell align="right">
                                <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => onEdit(zone)}
                                    sx={{ mr: 1, textTransform: 'none' }}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    size="small" 
                                    variant="outlined"
                                    color="error" 
                                    onClick={() => onDelete(zone)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <TablePagination
                component="div"
                count={rows.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
            />
        </TableContainer>
    );
};

export default ZoneTable;
