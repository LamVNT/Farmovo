import {DataGrid} from "@mui/x-data-grid";
import {IconButton, TextField} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useState, useMemo} from "react";
import Progress from "../progress-bar";

const ProductsTable = ({products}) => {
    const [searchProduct, setSearchProduct] = useState("");

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchProduct.toLowerCase())
        ), [searchProduct, products]);

    const productColumns = [
        {field: 'name', headerName: 'Tên Sản Phẩm', flex: 1},
        {field: 'category', headerName: 'Danh Mục', flex: 1},
        {
            field: 'stock',
            headerName: 'Tồn Kho',
            flex: 1,
            renderCell: (params) => {
                const stock = params.value;
                const percentage = Math.min((stock / 50) * 100, 100); // 50 là max giả định
                const type = percentage < 30 ? 'warning' : percentage < 70 ? 'info' : 'success';

                return (
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{stock}</div>
                        <Progress percentage={percentage} type={type}/>
                    </div>
                );
            }
        },
        {field: 'price', headerName: 'Giá', flex: 1},
        {
            field: 'actions',
            headerName: 'Thao Tác',
            flex: 1,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => alert("Chỉnh sửa sản phẩm " + params.id)}><EditIcon
                        color="primary"/></IconButton>
                    <IconButton onClick={() => alert("Xóa sản phẩm " + params.id)}><DeleteIcon
                        color="error"/></IconButton>
                </>
            )
        }
    ];

    return (
        <div className="card my-4 shadow-md sm:rounded-lg bg-white p-5">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Danh Sách Sản Phẩm</h2>
                <TextField
                    label="Tìm Kiếm Sản Phẩm"
                    size="small"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                />
            </div>
            <div style={{height: 400}}>
                <DataGrid
                    rows={filteredProducts}
                    columns={productColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    checkboxSelection
                    disableSelectionOnClick
                    sx={{
                        borderRadius: 2,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold',
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default ProductsTable;
