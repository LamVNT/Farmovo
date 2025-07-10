import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
} from "@mui/material";

const DebtTable = ({ debtNotes, onEdit }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Ngày giao dịch</TableCell>
                        <TableCell>Loại nợ</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell>Bằng chứng</TableCell>
                        <TableCell>Nguồn</TableCell>
                        <TableCell>Hành động</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {debtNotes && debtNotes.length > 0 ? (
                        debtNotes.map((note) => (
                            <TableRow key={note.id || Math.random()}>
                                <TableCell>{note.id || "N/A"}</TableCell>
                                <TableCell>
                                    {note.debtDate
                                        ? new Date(note.debtDate).toLocaleString("vi-VN", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })
                                        : "N/A"}
                                </TableCell>
                                <TableCell>{note.debtType || "N/A"}</TableCell>
                                <TableCell>{note.debtDescription || "N/A"}</TableCell>
                                <TableCell>{note.debtEvidences || "N/A"}</TableCell>
                                <TableCell>{note.fromSource || "N/A"}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => onEdit(note)}
                                        disabled={!note.id}
                                    >
                                        Chỉnh sửa
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7}>Không có giao dịch nợ</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DebtTable;