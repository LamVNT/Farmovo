import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const CategoryTable = ({ rows, onEdit, onDelete }) => {
    const columns = [
        { field: "name", headerName: "Category Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 2 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => onEdit(params.row)}>
                        <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => onDelete(params.id)}>
                        <DeleteIcon color="error" />
                    </IconButton>
                </>
            ),
        },
    ];

    return (
        <div style={{ height: 400 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                    borderRadius: 2,
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                    },
                }}
            />
        </div>
    );
};

export default CategoryTable;
