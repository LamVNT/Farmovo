import React, {useState} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Tabs,
    Tab,
    TextField,
    Select,
    MenuItem,
    Button,
    IconButton,
    InputAdornment
} from '@mui/material';
import {AiOutlinePlus} from 'react-icons/ai';
import {FiX} from 'react-icons/fi';

const AddProductDialog = ({open, onClose}) => {
    const [tab, setTab] = useState(0);
    const [product, setProduct] = useState({
        code: '',
        name: '',
        category: '',
        location: '',
        price: 0,
    });

    const [images, setImages] = useState([null, null, null, null, null]);

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setProduct({...product, [field]: value});
    };

    const handleImageChange = (index, file) => {
        const newImages = [...images];
        newImages[index] = file;
        setImages(newImages);
    };

    const handleRemoveImage = (index) => {
        const newImages = [...images];
        newImages[index] = null;
        setImages(newImages);
    };

    const handleSubmit = () => {
        console.log('Lưu:', product, images);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle className="flex justify-between items-center p-4 pb-0">
                <span className="text-lg font-semibold">Thêm hàng hóa</span>
                <IconButton onClick={onClose}>
                    <FiX/>
                </IconButton>
            </DialogTitle>

            <DialogContent className="p-4 pt-2">
                <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} indicatorColor="success">
                    <Tab label="Thông tin"/>
                    <Tab label="Mô tả chi tiết"/>
                </Tabs>

                {tab === 0 && (
                    <div className="mt-4 space-y-4 text-sm">
                        {/* Mã hàng + Giá bán */}
                        <div className="flex gap-4">
                            <TextField
                                label="Mã hàng"
                                placeholder="Mã hàng tự động"
                                variant="standard"
                                value={product.code}
                                onChange={handleChange('code')}
                                fullWidth
                                style={{flex: 7}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">ⓘ</InputAdornment>,
                                }}
                            />
                            <TextField
                                label="Giá bán"
                                type="number"
                                value={product.price}
                                onChange={handleChange('price')}
                                variant="standard"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                                }}
                                style={{flex: 3}}
                            />
                        </div>

                        {/* Tên hàng (70%) */}
                        <div style={{width: '70%'}}>
                            <TextField
                                label="Tên hàng"
                                variant="standard"
                                value={product.name}
                                onChange={handleChange('name')}
                                fullWidth
                            />
                        </div>

                        {/* Nhóm hàng + Vị trí */}
                        <div className="flex gap-4">
                            <div className="flex items-end gap-2 w-1/2">
                                <Select
                                    value={product.category}
                                    onChange={handleChange('category')}
                                    displayEmpty
                                    variant="standard"
                                    fullWidth
                                >
                                    <MenuItem value="">---Lựa chọn---</MenuItem>
                                    <MenuItem value="thucpham">Thực phẩm</MenuItem>
                                    <MenuItem value="douong">Đồ uống</MenuItem>
                                </Select>
                                <IconButton size="small">
                                    <AiOutlinePlus/>
                                </IconButton>
                            </div>

                            <div className="flex items-end gap-2 w-1/2">
                                <TextField
                                    label="Vị trí"
                                    variant="standard"
                                    value={product.location}
                                    onChange={handleChange('location')}
                                    fullWidth
                                />
                                <IconButton size="small">
                                    <AiOutlinePlus/>
                                </IconButton>
                            </div>
                        </div>

                        {/* Ảnh ở dưới cùng */}
                        <div className="grid grid-cols-5 gap-2 mt-2">
                            {images.map((img, i) => (
                                <div
                                    key={i}
                                    className="border border-dashed border-gray-300 h-20 flex justify-center items-center relative group"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(i, e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {img ? (
                                        <>
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Ảnh ${i + 1}`}
                                                className="object-cover w-full h-full"
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(i)}
                                                className="absolute top-0 right-0 text-xs text-white bg-black bg-opacity-50 px-1"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-400">Ảnh {i + 1}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 1 && (
                    <div className="mt-4 text-gray-500 italic text-sm">
                        Mô tả chi tiết (chưa triển khai).
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={onClose} variant="outlined" color="inherit">
                        Bỏ qua
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="success">
                        Lưu
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddProductDialog;
