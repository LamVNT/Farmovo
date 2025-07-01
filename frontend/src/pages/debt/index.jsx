import { useState, useEffect, useMemo } from 'react';
import { TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { FaPlus } from 'react-icons/fa6';
import DebtTable from '../../components/debt/DebtTable';
import DebtFormDialog from '../../components/debt/DebtFormDialog';
import { debtService } from '../../services/debtService';

const DebtNote = () => {
    const [debtNotes, setDebtNotes] = useState([]);
    const [debtors, setDebtors] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [viewMode, setViewMode] = useState('debtors'); // 'debtors' or 'debtNotes'
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        id: null,
        customerId: null,
        customerName: '',
        phone: '',
        address: '',
        storeId: null,
        storeName: '',
        debtAmount: '',
        debtDate: '',
        debtType: '+',
        debtDescription: '',
        debtEvidences: '',
        fromSource: 'CUSTOMER',
        sourceId: '',
        createdAt: '',
        updatedAt: '',
        deletedAt: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [notesData, debtorsData] = await Promise.all([
                    debtService.getAllDebtNotes(),
                    debtService.getAllDebtors(),
                ]);
                setDebtNotes(notesData);
                setDebtors(debtorsData);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        const data = viewMode === 'debtors' ? debtors : debtNotes;
        return data.filter(
            (item) =>
                item.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
                (item.phone && item.phone.toLowerCase().includes(searchText.toLowerCase()))
        );
    }, [searchText, viewMode, debtors, debtNotes]);

    const handleOpenCreate = () => {
        setForm({
            id: null,
            customerId: null,
            customerName: '',
            phone: '',
            address: '',
            storeId: null,
            storeName: '',
            debtAmount: '',
            debtDate: '',
            debtType: '+',
            debtDescription: '',
            debtEvidences: '',
            fromSource: 'CUSTOMER',
            sourceId: '',
            createdAt: '',
            updatedAt: '',
            deletedAt: '',
        });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (debt) => {
        setForm({
            id: debt.id,
            customerId: debt.customerId,
            customerName: debt.customerName,
            phone: debt.phone || '',
            address: debt.address || '',
            storeId: debt.storeId,
            storeName: debt.storeName || '',
            debtAmount: debt.debtAmount || '',
            debtDate: debt.debtDate || '',
            debtType: debt.debtType || '+',
            debtDescription: debt.debtDescription || '',
            debtEvidences: debt.debtEvidences || '',
            fromSource: debt.fromSource || 'CUSTOMER',
            sourceId: debt.sourceId || '',
            createdAt: debt.createdAt || '',
            updatedAt: debt.updatedAt || '',
            deletedAt: debt.deletedAt || '',
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa công nợ này?')) {
            try {
                await debtService.softDeleteDebtNote(id);
                setDebtNotes((prev) => prev.filter((d) => d.id !== id));
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleSubmit = async () => {
        const debtData = {
            customerId: form.customerId,
            debtAmount: form.debtAmount,
            debtDate: form.debtDate,
            storeId: form.storeId,
            debtType: form.debtType,
            debtDescription: form.debtDescription,
            debtEvidences: form.debtEvidences,
            fromSource: form.fromSource,
            sourceId: form.sourceId,
        };
        try {
            if (editMode) {
                const updatedDebt = await debtService.updateDebtNote(form.id, debtData);
                setDebtNotes((prev) =>
                    prev.map((d) => (d.id === form.id ? updatedDebt : d))
                );
            } else {
                const newDebt = await debtService.createDebtNote(debtData);
                setDebtNotes((prev) => [...prev, newDebt]);
            }
            handleClose();
            setError(null);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quản lý công nợ</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Tìm kiếm"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <FormControl size="small" style={{ minWidth: 200 }}>
                        <InputLabel>Chế độ xem</InputLabel>
                        <Select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value)}
                        >
                            <MenuItem value="debtors">Danh sách người nợ</MenuItem>
                            <MenuItem value="debtNotes">Danh sách công nợ</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus />}>
                        Thêm
                    </Button>
                </div>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <DebtTable
                    debtNotes={filteredData}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    viewMode={viewMode}
                />
            )}

            <DebtFormDialog
                open={openDialog}
                onClose={handleClose}
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                editMode={editMode}
            />
        </div>
    );
};

export default DebtNote;