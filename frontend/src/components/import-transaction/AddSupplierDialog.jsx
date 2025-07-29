import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Snackbar, Alert } from "@mui/material";
import { customerService } from "../../services/customerService";

const AddSupplierDialog = ({ open, onClose, onSupplierAdded, currentUser }) => {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    address: "",
    role: "SUPPLIER",
    totalDept: 0,
    isSupplier: true
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  useEffect(() => {
    if (open) {
      setForm({ 
        name: "", 
        email: "", 
        phone: "", 
        address: "",
        role: "SUPPLIER",
        totalDept: 0,
        isSupplier: true
      });
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập tên nhà cung cấp', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const createdBy = currentUser?.id || 1; // Fallback to 1 if no user
      // Chỉ gửi các trường mà backend yêu cầu
      const requestData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        totalDept: form.totalDept,
        isSupplier: form.isSupplier
      };
      const newSupplier = await customerService.createCustomer(requestData, createdBy);
      setSnackbar({ open: true, message: 'Thêm nhà cung cấp thành công', severity: 'success' });
      onSupplierAdded(newSupplier);
      onClose();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Lỗi khi thêm nhà cung cấp: ' + (error.response?.data?.message || error.message), 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={() => onClose()} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            minHeight: '500px'
          }
        }}
      >
        {/* Header đơn giản */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Thêm nhà cung cấp</h2>
            <Button 
              onClick={() => onClose()} 
              sx={{ 
                color: '#999',
                minWidth: 'auto',
                padding: '6px',
                '&:hover': { 
                  backgroundColor: '#f5f5f5',
                  color: '#666'
                }
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Content */}
        <DialogContent className="p-8 bg-white">
          <div className="space-y-8">
            {/* Tên nhà cung cấp - Full width */}
            <TextField
                autoFocus
                label="Tên nhà cung cấp *"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                variant="standard"
                error={!form.name.trim() && form.name.length > 0}
                helperText={!form.name.trim() && form.name.length > 0 ? 'Vui lòng nhập tên nhà cung cấp' : ''}
                sx={{
                  '& .MuiInput-root': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                    '&:before': {
                      borderBottom: '1px solid #e0e0e0',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottom: '2px solid #1976d2',
                    },
                    '&:after': {
                      borderBottom: '2px solid #1976d2',
                    },
                    '&.Mui-focused': {
                      background: 'none !important',
                      backgroundColor: 'transparent !important',
                    }
                  },
                  '& .MuiInputBase-input': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    fontSize: '14px',
                    '&.Mui-focused': {
                      color: '#1976d2',
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#d32f2f',
                    marginLeft: 0,
                    fontSize: '12px'
                  }
                }}
              />

            {/* Số điện thoại và Email - 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextField
                label="Số điện thoại"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
                variant="standard"
                sx={{
                  '& .MuiInput-root': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                    '&:before': {
                      borderBottom: '1px solid #e0e0e0',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottom: '2px solid #1976d2',
                    },
                    '&:after': {
                      borderBottom: '2px solid #1976d2',
                    },
                    '&.Mui-focused': {
                      background: 'none !important',
                      backgroundColor: 'transparent !important',
                    }
                  },
                  '& .MuiInputBase-input': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    fontSize: '14px',
                    '&.Mui-focused': {
                      color: '#1976d2',
                    }
                  }
                }}
              />

              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                variant="standard"
                sx={{
                  '& .MuiInput-root': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                    '&:before': {
                      borderBottom: '1px solid #e0e0e0',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottom: '2px solid #1976d2',
                    },
                    '&:after': {
                      borderBottom: '2px solid #1976d2',
                    },
                    '&.Mui-focused': {
                      background: 'none !important',
                      backgroundColor: 'transparent !important',
                    }
                  },
                  '& .MuiInputBase-input': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    fontSize: '14px',
                    '&.Mui-focused': {
                      color: '#1976d2',
                    }
                  }
                }}
              />
            </div>

            {/* Địa chỉ - Full width */}
            <TextField
              label="Địa chỉ"
              name="address"
              value={form.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              variant="standard"
              sx={{
                '& .MuiInput-root': {
                  background: 'none !important',
                  backgroundColor: 'transparent !important',
                  '&:before': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                  '&:hover:not(.Mui-disabled):before': {
                    borderBottom: '2px solid #1976d2',
                  },
                  '&:after': {
                    borderBottom: '2px solid #1976d2',
                  },
                  '&.Mui-focused': {
                    background: 'none !important',
                    backgroundColor: 'transparent !important',
                  }
                },
                '& .MuiInputBase-input': {
                  background: 'none !important',
                  backgroundColor: 'transparent !important',
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                  fontSize: '14px',
                  '&.Mui-focused': {
                    color: '#1976d2',
                  }
                }
              }}
            />
          </div>
        </DialogContent>

        {/* Footer */}
        <div className="bg-white p-6 border-t border-gray-100">
          <div className="flex justify-end gap-3">
            <Button 
              onClick={() => onClose()} 
              disabled={loading}
              variant="text"
              sx={{ 
                color: '#666',
                fontSize: '14px',
                fontWeight: 500,
                '&:hover': { 
                  backgroundColor: '#f5f5f5',
                  color: '#333'
                },
                px: 3,
                py: 1.5
              }}
            >
              HỦY
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={loading || !form.name.trim()}
              sx={{ 
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                '&:hover': { 
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': { 
                  background: '#ccc',
                  boxShadow: 'none',
                  transform: 'none'
                },
                px: 4,
                py: 1.5,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                textTransform: 'none'
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <CircularProgress size={14} color="inherit" />
                  <span>Đang thêm...</span>
                </div>
              ) : (
                'THÊM'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddSupplierDialog; 