import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Container
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PasswordChangeForm from '../../components/profile/PasswordChangeForm';

const ChangePasswordPage = () => {
    const navigate = useNavigate();

    const handleBackToProfile = () => {
        navigate('/profile');
    };

    const handlePasswordChanged = () => {
        // Có thể thêm logic redirect hoặc thông báo
        console.log('Password changed successfully');
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={handleBackToProfile}
                    sx={{ mb: 2 }}
                >
                    Quay lại Profile
                </Button>
                
                <Typography variant="h4" gutterBottom>
                    Thay đổi mật khẩu
                </Typography>
                
                <Typography variant="body1" color="text.secondary">
                    Cập nhật mật khẩu tài khoản của bạn để bảo mật thông tin
                </Typography>
            </Box>

            <Paper elevation={2} sx={{ p: 4 }}>
                <PasswordChangeForm onPasswordChanged={handlePasswordChanged} />
            </Paper>
        </Container>
    );
};

export default ChangePasswordPage; 