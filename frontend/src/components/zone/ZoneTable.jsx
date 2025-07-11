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
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Zone Name</TableCell>
                        <TableCell>Zone Description</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedRows.map((zone) => (
                        <TableRow
                            key={zone.id}
                            hover
                            selected={zone.id === hoveredZoneId}
                            onMouseEnter={() => setHoveredZoneId(zone.id)}
                            onMouseLeave={() => setHoveredZoneId(null)}
                        >
                            <TableCell>{zone.id}</TableCell>
                            <TableCell>{zone.zoneName}</TableCell>
                            <TableCell>{zone.zoneDescription}</TableCell>
                            <TableCell align="right">
                                <Button size="small" onClick={() => onEdit(zone)}>
                                    Edit
                                </Button>
                                <Button size="small" color="error" onClick={() => onDelete(zone)}>
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
                rowsPerPageOptions={[10]}
            />
        </TableContainer>
    );
};

export default ZoneTable;
