import React from "react";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const ZoneTable = ({ rows, onEdit, onDelete }) => {
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
                    {rows.map((zone) => (
                        <TableRow key={zone.id}>
                            <TableCell>{zone.id}</TableCell>
                            <TableCell>{zone.zoneName}</TableCell>
                            <TableCell>{zone.zoneDescription}</TableCell>
                            <TableCell align="right">
                                <Button size="small" onClick={() => onEdit(zone)}>Edit</Button>
                                <Button size="small" color="error" onClick={() => onDelete(zone.id)}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ZoneTable;
