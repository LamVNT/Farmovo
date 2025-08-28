import React, { useState } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    Button,
    Chip,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Tooltip
} from '@mui/material';
import {
    NotificationsNone as NotificationsIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    ClearAll as ClearAllIcon,
    DoneAll as DoneAllIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationDropdown = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAllNotifications
    } = useNotification();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        handleClose();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckIcon color="success" />;
            case 'ERROR':
                return <ErrorIcon color="error" />;
            case 'WARNING':
                return <WarningIcon color="warning" />;
            case 'INFO':
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'SUCCESS':
                return '#4caf50';
            case 'ERROR':
                return '#f44336';
            case 'WARNING':
                return '#ff9800';
            case 'INFO':
            default:
                return '#2196f3';
        }
    };

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { 
                addSuffix: true, 
                locale: vi 
            });
        } catch (error) {
            return 'Vừa xong';
        }
    };

    const getCategoryLabel = (category) => {
        const labels = {
            'IMPORT_TRANSACTION': 'Nhập hàng',
            'SALE_TRANSACTION': 'Bán hàng',
            'PRODUCT': 'Sản phẩm',
            'CUSTOMER': 'Khách hàng',
            'STOCKTAKE': 'Kiểm kê',
            'USER': 'Người dùng',
            'STORE': 'Cửa hàng',
            'CATEGORY': 'Danh mục',
            'ZONE': 'Khu vực',
            'DEBT_NOTE': 'Ghi chú nợ',
            'GENERAL': 'Chung',
            'ERROR': 'Lỗi',
            'SUCCESS': 'Thành công'
        };
        return labels[category] || category;
    };

    return (
        <>
            <Tooltip title="Thông báo">
                <IconButton
                    onClick={handleClick}
                    sx={{
                        color: 'inherit',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    <Badge 
                        badgeContent={unreadCount} 
                        color="error"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                height: '20px',
                                minWidth: '20px',
                                padding: '0 6px'
                            }
                        }}
                    >
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 500,
                        mt: 1
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Thông báo
                        </Typography>
                        <Box>
                            <Tooltip title="Đánh dấu tất cả đã đọc">
                                <IconButton 
                                    size="small" 
                                    onClick={markAllAsRead}
                                    disabled={unreadCount === 0}
                                >
                                    <DoneAllIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa tất cả">
                                <IconButton 
                                    size="small" 
                                    onClick={clearAllNotifications}
                                    disabled={notifications.length === 0}
                                >
                                    <ClearAllIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                    {unreadCount > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            {unreadCount} thông báo chưa đọc
                        </Typography>
                    )}
                </Box>

                {/* Notifications List */}
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Không có thông báo nào
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => (
                            <React.Fragment key={notification.id}>
                                <ListItemButton
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{
                                        p: 2,
                                        backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                                        '&:hover': {
                                            backgroundColor: notification.isRead 
                                                ? 'rgba(0, 0, 0, 0.04)' 
                                                : 'rgba(25, 118, 210, 0.08)'
                                        },
                                        borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                                        borderLeftColor: notification.isRead 
                                            ? 'transparent' 
                                            : getNotificationColor(notification.type)
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Box sx={{ fontSize: '1.5rem' }}>
                                            {getNotificationIcon(notification.type)}
                                        </Box>
                                    </ListItemIcon>
                                    
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Title và Time */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                            <Typography 
                                                variant="subtitle2" 
                                                sx={{ 
                                                    fontWeight: notification.isRead ? 400 : 600,
                                                    color: notification.isRead ? 'text.secondary' : 'text.primary',
                                                    flex: 1,
                                                    mr: 1
                                                }}
                                            >
                                                {notification.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                                {formatTime(notification.createdAt)}
                                            </Typography>
                                        </Box>
                                        
                                        {/* Message */}
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: notification.isRead ? 'text.secondary' : 'text.primary',
                                                mb: 1
                                            }}
                                        >
                                            {notification.message}
                                        </Typography>
                                        
                                        {/* User info */}
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                color: 'text.secondary',
                                                display: 'block',
                                                mb: 1
                                            }}
                                        >
                                            👤 {notification.userName}
                                        </Typography>
                                        
                                        {/* Store info - chỉ hiển thị khi có store */}
                                        {notification.storeName && (
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 1
                                                }}
                                            >
                                                🏪 {notification.storeName}
                                            </Typography>
                                        )}
                                        
                                        {/* Category và Unread indicator */}
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Chip
                                                label={getCategoryLabel(notification.category)}
                                                size="small"
                                                variant="outlined"
                                                sx={{ 
                                                    fontSize: '0.7rem',
                                                    height: '20px'
                                                }}
                                            />
                                            {!notification.isRead && (
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'primary.main'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </ListItemButton>
                                <Divider />
                            </React.Fragment>
                        ))
                    )}
                </Box>

                {/* Footer */}
                {notifications.length > 0 && (
                    <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                        <Button 
                            variant="text" 
                            size="small" 
                            onClick={handleClose}
                            sx={{ color: 'text.secondary' }}
                        >
                            Đóng
                        </Button>
                    </Box>
                )}
            </Menu>
        </>
    );
};

export default NotificationDropdown;
